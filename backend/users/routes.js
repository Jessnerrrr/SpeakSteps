const express = require('express');
const mongoose = require('mongoose');
const crypto = require('node:crypto');
const User = require('./User');
const { hashPassword, verifyPassword } = require('./password');
const { validateRegistration } = require('./validation');
const { requireSession, signAccessToken, TOKEN_LIFETIME_SECONDS } = require('./session');
const { getRegistrationStatus } = require('./registration-policy');
const { generatePatientCode } = require('../patients/patient-code');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  createTotpSecret,
  decryptTotpSecret,
  encryptTotpSecret,
  verifyTotp,
} = require('./totp');

const router = express.Router();
const authRouter = express.Router();

function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(user, req, deviceLabel = '') {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_SECONDS * 1000);
  await mongoose.connection.db.collection('user_sessions').insertOne({
    sessionId,
    userId: user._id,
    deviceLabel: typeof deviceLabel === 'string' ? deviceLabel.trim().slice(0, 100) : '',
    userAgent: req.get('user-agent') || '',
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
    revokedAt: null,
  });
  return { token: signAccessToken(user, sessionId), expiresIn: TOKEN_LIFETIME_SECONDS };
}

function validCredentials(user, password) {
  const [salt, hash] = user?.password_hash?.split(':') || [];
  return salt && hash ? verifyPassword(password, salt, hash) : false;
}

function safeCompareHash(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const actualBytes = Buffer.from(actual, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return actualBytes.length === expectedBytes.length
    && actualBytes.length > 0
    && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

function loginHandler(role) {
  return async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email, archived_at: null }).select('+password_hash');
    if (!user || !(await validCredentials(user, password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ success: false, error: `This account is not registered as a ${role}.` });
    }
    if (user.status === 'pending' && user.invited_by_admin) {
      if (!user.invitation_expires_at || user.invitation_expires_at <= new Date()) {
        return res.status(403).json({ success: false, error: 'This invitation has expired. Ask the administrator to resend it.' });
      }
      return res.json({
        success: true,
        setupRequired: true,
        user: publicUser(user),
      });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Your account is awaiting approval.' });
    }
    if (user.status !== 'verified') {
      return res.status(403).json({ success: false, error: 'This account is not approved for sign in.' });
    }

    if (user.totp_enabled) {
      const challengeToken = crypto.randomBytes(32).toString('base64url');
      await mongoose.connection.db.collection('login_challenges').insertOne({
        tokenHash: hashOpaqueToken(challengeToken),
        userId: user._id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      });
      return res.status(401).json({
        success: false,
        code: 'TOTP_REQUIRED',
        challengeToken,
        error: 'Enter the 6-digit code from your authenticator app.',
      });
    }

    const { token, expiresIn } = await createSession(user, req, body.deviceLabel);
    void logAuditEvent(mongoose.connection.db, {
      actorId: user._id,
      actorRole: user.role,
      actorName: user.full_name,
      action: 'Successful login',
      category: 'Account',
      targetType: 'account',
      targetId: user._id,
      details: `${role} account signed in.`,
    });

    return res.json({
      success: true,
      token,
      expiresIn,
      user: publicUser(user),
    });
  };
}

function roleLoginRouter(role) {
  const roleRouter = express.Router();
  roleRouter.post('/login', loginHandler(role));
  if (role === 'admin') {
    roleRouter.get('/audit-logs', requireSession, async (req, res) => {
      const admin = await User.findById(req.session.sub).select('role status');
      if (!admin || admin.status !== 'verified' || admin.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Administrator access is required.' });
      }

      const filter = {};
      const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 200) : '';
      if (category && category !== 'All activity') {
        const categoryAliases = {
          Accounts: ['Account'],
          Assignments: ['Activity'],
          Students: ['Practice', 'Clinical', 'Media'],
          Requests: ['Request'],
          Settings: ['Settings'],
        };
        const matchingCategories = categoryAliases[category] || [category.slice(0, 60)];
        filter.category = matchingCategories.length === 1
          ? matchingCategories[0]
          : { $in: matchingCategories };
      }
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const expression = new RegExp(escapedSearch, 'i');
        filter.$or = [
          { actorName: expression },
          { action: expression },
          { category: expression },
          { targetType: expression },
          { targetId: expression },
          { details: expression },
        ];
      }

      const logs = await mongoose.connection.db.collection('audit_logs')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      return res.json({
        success: true,
        auditLogs: logs.map((log) => ({
          id: String(log._id),
          actorId: String(log.actorId || ''),
          actorRole: log.actorRole || '',
          actorName: log.actorName || 'Unknown',
          action: log.action,
          category: log.category,
          targetType: log.targetType,
          targetId: String(log.targetId || ''),
          details: typeof log.details === 'string' ? log.details : '',
          createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
        })),
      });
    });
  }
  return roleRouter;
}

authRouter.post('/forgot-password', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
  }
  const user = await User.findOne({ email, status: 'verified', archived_at: null }).select('+password_reset_token_hash');
  if (!user) {
    return res.json({ success: true, message: 'If the account exists, a reset code has been issued.' });
  }
  const resetCode = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  user.password_reset_token_hash = hashOpaqueToken(resetCode);
  user.password_reset_expires_at = new Date(Date.now() + 15 * 60 * 1000);
  user.password_reset_attempts = 0;
  await user.save();
  return res.json({
    success: true,
    message: 'If the account exists, a reset code has been issued.',
    ...(!process.env.SMTP_HOST ? { resetCode } : {}),
  });
});

authRouter.post('/reset-password', async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !token) {
    return res.status(400).json({ success: false, error: 'A valid email and reset code are required.' });
  }
  if (
    newPassword.length < 8 || newPassword.length > 20
    || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)
    || !/\d/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>\-_]/.test(newPassword)
  ) {
    return res.status(400).json({ success: false, error: 'Password does not meet the required security rules.' });
  }

  const user = await User.findOne({ email })
    .select('+password_reset_token_hash +password_reset_expires_at +password_reset_attempts +invitation_token_hash +invitation_expires_at');
  if (!user || user.archived_at) return res.status(400).json({ success: false, error: 'The reset code is invalid or expired.' });
  const now = new Date();
  const invitationMatches = user.invitation_expires_at > now
    && safeCompareHash(user.invitation_token_hash, hashOpaqueToken(token));
  const resetMatches = user.password_reset_expires_at > now
    && user.password_reset_attempts < 5
    && safeCompareHash(user.password_reset_token_hash, hashOpaqueToken(token));
  if (!invitationMatches && !resetMatches) {
    if (user.password_reset_token_hash && user.password_reset_attempts < 5) {
      user.password_reset_attempts += 1;
      await user.save();
    }
    return res.status(400).json({ success: false, error: 'The reset code is invalid or expired.' });
  }

  const { salt, hash } = await hashPassword(newPassword);
  user.password_hash = `${salt}:${hash}`;
  user.password_reset_token_hash = null;
  user.password_reset_expires_at = null;
  user.password_reset_attempts = 0;
  if (invitationMatches) {
    user.status = 'verified';
    user.invitation_token_hash = null;
    user.invitation_expires_at = null;
  }
  user.updated_at = now;
  await user.save();
  await mongoose.connection.db.collection('user_sessions').updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: now } },
  );
  void logAuditEvent(mongoose.connection.db, {
    actorId: user._id,
    actorRole: user.role,
    actorName: user.full_name,
    action: invitationMatches ? 'Invitation accepted' : 'Password reset',
    category: 'Account',
    targetType: 'account',
    targetId: user._id,
    details: invitationMatches ? 'Invited account activated its password.' : 'Account password was reset.',
  });
  return res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

authRouter.post('/totp/setup', async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const user = await User.findOne({ email, archived_at: null })
    .select('+password_hash +totp_enabled +totp_pending_secret');
  if (!user || !(await validCredentials(user, password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }
  if (
    user.status === 'rejected'
    || (user.status === 'pending' && !user.invited_by_admin)
    || (user.status === 'pending' && (!user.invitation_expires_at || user.invitation_expires_at <= new Date()))
  ) {
    return res.status(403).json({ success: false, error: 'This account is not available for authenticator setup.' });
  }
  if (user.totp_enabled) {
    return res.status(409).json({ success: false, error: 'Authenticator protection is already enabled.' });
  }
  const secret = createTotpSecret();
  user.totp_pending_secret = encryptTotpSecret(secret);
  await user.save();
  const label = encodeURIComponent(`SpeakSteps:${user.email}`);
  const issuer = encodeURIComponent('SpeakSteps');
  return res.json({
    success: true,
    secret,
    otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
  });
});

authRouter.post('/totp/verify', async (req, res) => {
  const body = req.body || {};
  if (body.purpose === 'setup') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await User.findOne({ email, archived_at: null })
      .select('+password_hash +totp_pending_secret +totp_enabled');
    if (!user || !(await validCredentials(user, password)) || !user.totp_pending_secret) {
      return res.status(401).json({ success: false, error: 'Authenticator setup could not be verified.' });
    }
    if (
      user.status === 'rejected'
      || (user.status === 'pending' && !user.invited_by_admin)
      || (user.status === 'pending' && (!user.invitation_expires_at || user.invitation_expires_at <= new Date()))
    ) {
      return res.status(403).json({ success: false, error: 'This account is not available for authenticator setup.' });
    }
    const secret = decryptTotpSecret(user.totp_pending_secret);
    if (!verifyTotp(secret, body.code)) {
      return res.status(400).json({ success: false, error: 'The authenticator code is incorrect or expired.' });
    }
    user.totp_secret = user.totp_pending_secret;
    user.totp_pending_secret = null;
    user.totp_enabled = true;
    user.mfa_enabled = true;
    user.status = 'verified';
    user.invitation_token_hash = null;
    user.invitation_expires_at = null;
    await user.save();
    const session = await createSession(user, req, body.deviceLabel);
    return res.json({ success: true, ...session, user: publicUser(user) });
  }

  const challengeToken = typeof body.challengeToken === 'string' ? body.challengeToken : '';
  const tokenHash = hashOpaqueToken(challengeToken);
  const challenges = mongoose.connection.db.collection('login_challenges');
  const challenge = await challenges.findOne({ tokenHash, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } });
  if (!challenge) return res.status(401).json({ success: false, error: 'The authenticator challenge is invalid or expired.' });
  const user = await User.findOne({ _id: challenge.userId, status: 'verified', totp_enabled: true })
    .select('+totp_secret');
  if (!user || !verifyTotp(decryptTotpSecret(user.totp_secret), body.code)) {
    await challenges.updateOne(
      { _id: challenge._id },
      { $inc: { attempts: 1 } },
    );
    return res.status(401).json({ success: false, error: 'The authenticator code is incorrect or expired.' });
  }
  await challenges.deleteOne({ _id: challenge._id });
  const session = await createSession(user, req, body.deviceLabel);
  return res.json({ success: true, ...session, user: publicUser(user) });
});

authRouter.get('/sessions', requireSession, async (req, res) => {
  const sessions = await mongoose.connection.db.collection('user_sessions')
    .find({ userId: new mongoose.Types.ObjectId(req.session.sub), revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastActiveAt: -1 })
    .toArray();
  return res.json({
    success: true,
    sessions: sessions.map((session) => ({
      sessionId: session.sessionId,
      deviceLabel: session.deviceLabel || 'Unknown device',
      userAgent: session.userAgent || '',
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      current: session.sessionId === req.session.sessionId,
    })),
  });
});

authRouter.delete('/sessions/:sessionId', requireSession, async (req, res) => {
  const result = await mongoose.connection.db.collection('user_sessions').updateOne(
    {
      sessionId: req.params.sessionId,
      userId: new mongoose.Types.ObjectId(req.session.sub),
      revokedAt: null,
    },
    { $set: { revokedAt: new Date() } },
  );
  if (!result.matchedCount) return res.status(404).json({ success: false, error: 'Session was not found or was already revoked.' });
  return res.json({ success: true });
});

function publicUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.full_name,
    email: user.email,
    childName: user.child_name,
    childAge: user.child_age,
    startingLevel: user.starting_level,
    status: user.status,
    role: user.role,
  };
}

router.post('/register', async (req, res) => {
  let registration;
  try {
    registration = validateRegistration(req.body || {});
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  const existingUser = await User.exists({ email: registration.email });
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const { salt, hash } = await hashPassword(registration.password);
  let createdUser;
  let patientCode;
  const patientsCollection = mongoose.connection.db.collection('patients');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const user = new User({
      full_name: registration.fullName,
      email: registration.email,
      phone_number: registration.contactNo,
      password_hash: `${salt}:${hash}`,
      profile_image: registration.profileImage,
      verification_image: registration.verificationImage,
      child_name: registration.childName,
      child_age: registration.childAge,
      starting_level: registration.startingLevel,
      student_id: registration.studentId,
      role: 'parent',
      status: getRegistrationStatus(),
    });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        const code = await generatePatientCode(patientsCollection, now, undefined, session);
        await user.save({ session });

        const parentProfileId = new mongoose.Types.ObjectId();
        await mongoose.connection.db.collection('parent_profiles').insertOne({
          _id: parentProfileId,
          user_id: user._id,
          guardian_name: registration.fullName,
          relationship_to_child: 'Parent',
        }, { session });

        const childNameParts = registration.childName.split(/\s+/);
        const dateOfBirth = new Date(Date.UTC(now.getUTCFullYear() - registration.childAge, now.getUTCMonth(), now.getUTCDate()));
        await patientsCollection.insertOne({
          parent_id: parentProfileId,
          patientCode: code,
          first_name: childNameParts[0],
          last_name: childNameParts.slice(1).join(' ') || 'Child',
          date_of_birth: dateOfBirth,
          created_at: now,
          language_profile: 'english',
          target_positions: [],
          baseline_done: false,
          total_stars: 0,
        }, { session });
        patientCode = code;
      });
      createdUser = user;
      break;
    } catch (error) {
      const patientCodeConflict = error.code === 11000 && error.keyPattern?.patientCode;
      if (patientCodeConflict && attempt < 4) continue;
      if (error.code === 11000 && !patientCodeConflict) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  if (!createdUser) throw new Error('Could not allocate a unique patient code after several attempts.');
  void logAuditEvent(mongoose.connection.db, {
    actorId: createdUser._id,
    actorRole: createdUser.role,
    actorName: createdUser.full_name,
    action: 'Account registered',
    category: 'Account',
    targetType: 'account',
    targetId: createdUser._id,
    details: 'Parent registration completed.',
  });
  const isApproved = createdUser.status === 'verified';
  return res.status(201).json({
    success: true,
    message: isApproved
      ? 'Account created and approved. You can now sign in.'
      : 'Account created. It is awaiting approval.',
    user: publicUser(createdUser),
    patientCode,
  });
});

router.post('/login', loginHandler('parent'));

router.get('/session', requireSession, async (req, res) => {
  const user = await User.findById(req.session.sub);
  if (!user || user.status !== 'verified' || user.role !== req.session.role) {
    return res.status(401).json({ success: false, error: 'Your account is no longer available. Please sign in again.' });
  }
  return res.json({ success: true, user: publicUser(user), expiresAt: req.session.exp * 1000 });
});

module.exports = {
  users: router,
  auth: authRouter,
  admins: roleLoginRouter('admin'),
  therapists: roleLoginRouter('therapist'),
  teachers: roleLoginRouter('teacher'),
};
