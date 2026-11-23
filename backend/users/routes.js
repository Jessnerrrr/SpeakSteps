const express = require('express');
const mongoose = require('mongoose');
const User = require('./User');
const { hashPassword, verifyPassword } = require('./password');
const { validateRegistration } = require('./validation');
const { requireSession, signAccessToken, TOKEN_LIFETIME_SECONDS } = require('./session');
const { getRegistrationStatus } = require('./registration-policy');
const { generatePatientCode } = require('../patients/patient-code');
const { logAuditEvent } = require('../utils/auditLogger');

const router = express.Router();

function loginHandler(role) {
  return async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password_hash');
    const [salt, hash] = user?.password_hash?.split(':') || [];
    if (!user || !salt || !hash || !(await verifyPassword(password, salt, hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ success: false, error: `This account is not registered as a ${role}.` });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Your account is awaiting approval.' });
    }
    if (user.status !== 'verified') {
      return res.status(403).json({ success: false, error: 'This account is not approved for sign in.' });
    }

    const token = signAccessToken(user);
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
      expiresIn: TOKEN_LIFETIME_SECONDS,
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
      if (category && category !== 'All activity') filter.category = category.slice(0, 60);
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
  admins: roleLoginRouter('admin'),
  therapists: roleLoginRouter('therapist'),
  teachers: roleLoginRouter('teacher'),
};
