const crypto = require('crypto');
const { promisify } = require('util');

const HASH_ALGORITHM = 'scrypt';
const KEY_LENGTH = 64;
const scrypt = promisify(crypto.scrypt);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${HASH_ALGORITHM}$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const [algorithm, salt, encodedKey, extra] = storedHash.split('$');
  if (algorithm !== HASH_ALGORITHM || !salt || !encodedKey || extra !== undefined) return false;

  const expectedKey = Buffer.from(encodedKey, 'hex');
  if (expectedKey.length !== KEY_LENGTH) return false;

  const actualKey = await scrypt(password, salt, KEY_LENGTH);
  return crypto.timingSafeEqual(actualKey, expectedKey);
}

module.exports = { hashPassword, verifyPassword };
