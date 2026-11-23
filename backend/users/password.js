const { promisify } = require('node:util');
const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: hash.toString('hex') };
}

async function verifyPassword(password, salt, expectedHash) {
  const actualHash = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return expected.length === actualHash.length && timingSafeEqual(expected, actualHash);
}

module.exports = { hashPassword, verifyPassword };
