/**
 * chatCrypto.js
 * Server-side AES-256-CBC encryption for chat messages.
 * Key is stored in CHAT_ENCRYPTION_KEY env variable (64-char hex = 32 bytes).
 * Messages are encrypted before writing to MongoDB and decrypted on read.
 * Format stored: "iv_hex:ciphertext_hex"
 */
const crypto = require('crypto');

const ALGO = 'aes-256-cbc';

function getKey() {
  const k = process.env.CHAT_ENCRYPTION_KEY;
  if (!k || k.length !== 64) {
    throw new Error('CHAT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(k, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns "ivHex:ciphertextHex" or '' if input is empty.
 */
function encrypt(plaintext) {
  if (!plaintext) return '';
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a stored "ivHex:ciphertextHex" string.
 * Returns the plaintext, or '' on failure (handles legacy / empty values gracefully).
 */
function decrypt(stored) {
  if (!stored) return '';
  // Legacy plain-text values won't contain ':' in this format pattern
  const colonIdx = stored.indexOf(':');
  if (colonIdx === -1 || colonIdx !== 32) return stored; // not our format → return as-is
  try {
    const iv         = Buffer.from(stored.slice(0, 32), 'hex');
    const ciphertext = Buffer.from(stored.slice(33), 'hex');
    const decipher   = crypto.createDecipheriv(ALGO, getKey(), iv);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (e) {
    return stored; // fallback: return raw (handles any edge case)
  }
}

/**
 * Decrypt all text fields of a ChatMessage plain object (from .toObject() or lean()).
 * Returns a new object safe to send to clients.
 */
function decryptMessage(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    message:   decrypt(doc.message   || ''),
    imageData: decrypt(doc.imageData || ''),
    imageType: doc.imageType || '',
  };
}

module.exports = { encrypt, decrypt, decryptMessage };
