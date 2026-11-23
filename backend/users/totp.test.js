const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createTotpSecret,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotp,
  verifyTotp,
} = require('./totp');

test('TOTP generation matches the RFC 6238 SHA-1 vector', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const code = generateTotp(secret, 59000);
  assert.equal(code, '287082');
  assert.equal(verifyTotp(secret, code, 59000), true);
  assert.equal(verifyTotp(secret, '000000', 59000), false);
});

test('TOTP secrets are random and can be encrypted at rest', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'totp-unit-test-secret-with-at-least-32-characters';
  try {
    const secret = createTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    assert.notEqual(encrypted, secret);
    assert.equal(decryptTotpSecret(encrypted), secret);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
