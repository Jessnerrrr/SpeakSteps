const crypto = require('node:crypto');
const mongoose = require('mongoose');

const TOKEN_LIFETIME_SECONDS = 12 * 60 * 60;
const TOKEN_ISSUER = 'speaksteps-api';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in backend/.env');
  }
  return secret;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signAccessToken(user, sessionId) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({
    sub: user._id.toString(),
    role: user.role,
    sessionId,
    iss: TOKEN_ISSUER,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

function verifyAccessToken(token) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) throw new Error('Invalid or expired session.');

  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSignature = crypto.createHmac('sha256', getJwtSecret()).update(signingInput).digest();
  let actualSignature;
  try {
    actualSignature = Buffer.from(signaturePart, 'base64url');
  } catch {
    throw new Error('Invalid or expired session.');
  }
  if (actualSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(actualSignature, expectedSignature)) {
    throw new Error('Invalid or expired session.');
  }

  try {
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    const validRole = ['admin', 'parent', 'therapist', 'teacher'].includes(payload.role);
    if (
      header.alg !== 'HS256' ||
      header.typ !== 'JWT' ||
      payload.iss !== TOKEN_ISSUER ||
      typeof payload.sub !== 'string' ||
      !validRole ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new Error('Invalid or expired session.');
    }
    return payload;
  } catch {
    throw new Error('Invalid or expired session.');
  }
}

async function requireSession(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, error: 'A valid session is required.' });
  }

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    return res.status(401).json({ success: false, error: 'Your session is invalid or has expired. Please sign in again.' });
  }
  if (typeof payload.sessionId !== 'string' || !payload.sessionId) {
    return res.status(401).json({ success: false, error: 'Your session is invalid or has expired. Please sign in again.' });
  }
  try {
    const sessions = mongoose.connection.db.collection('user_sessions');
    const session = await sessions.findOne({
      sessionId: payload.sessionId,
      userId: new mongoose.Types.ObjectId(payload.sub),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) {
      return res.status(401).json({ success: false, error: 'This session has been revoked or expired. Please sign in again.' });
    }
    const staleBefore = new Date(Date.now() - 60_000);
    await sessions.updateOne(
      { sessionId: payload.sessionId, lastActiveAt: { $lt: staleBefore } },
      { $set: { lastActiveAt: new Date() } },
    );
    req.session = payload;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  TOKEN_LIFETIME_SECONDS,
  getJwtSecret,
  requireSession,
  signAccessToken,
  verifyAccessToken,
};
