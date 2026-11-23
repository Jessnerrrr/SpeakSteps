const assert = require('node:assert/strict');
const test = require('node:test');
const { signAccessToken, verifyAccessToken } = require('./session');

const originalJwtSecret = process.env.JWT_SECRET;

test('session tokens contain the signed user ID and role', () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  try {
    const token = signAccessToken({ _id: { toString: () => 'user-123' }, role: 'therapist' });
    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, 'user-123');
    assert.equal(payload.role, 'therapist');
  } finally {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});

test('session token verification rejects a modified signature', () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  try {
    const token = signAccessToken({ _id: { toString: () => 'user-123' }, role: 'parent' });
    const parts = token.split('.');
    parts[2] = `${parts[2][0] === 'a' ? 'b' : 'a'}${parts[2].slice(1)}`;
    const modifiedToken = parts.join('.');
    assert.throws(() => verifyAccessToken(modifiedToken), /Invalid or expired session/);
  } finally {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});
