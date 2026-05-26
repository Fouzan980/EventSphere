// ── End-to-End Encryption using Web Crypto API ────────────────────────────────
// Algorithm: ECDH key exchange → AES-GCM encryption
// Keys are generated per-device and stored in localStorage.
// Server NEVER sees plaintext.

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' };
const AES_PARAMS  = { name: 'AES-GCM', length: 256 };
const LS_KEY      = 'es_ecdh_keypair';

// ── Generate or load persistent ECDH key pair ─────────────────────────────────
export async function getOrCreateKeyPair() {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    try {
      const { pub, priv } = JSON.parse(stored);
      const publicKey  = await crypto.subtle.importKey('jwk', pub,  ECDH_PARAMS, true,  []);
      const privateKey = await crypto.subtle.importKey('jwk', priv, ECDH_PARAMS, true, ['deriveKey']);
      return { publicKey, privateKey };
    } catch { /* fall through to regenerate */ }
  }
  const pair = await crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey']);
  const pub  = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  localStorage.setItem(LS_KEY, JSON.stringify({ pub, priv }));
  return pair;
}

// ── Export public key as JWK string for server storage ───────────────────────
export async function exportPublicKey(keyPair) {
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return JSON.stringify(jwk);
}

// ── Import peer's public key from JWK string ─────────────────────────────────
export async function importPublicKey(jwkString) {
  const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  return crypto.subtle.importKey('jwk', jwk, ECDH_PARAMS, true, []);
}

// ── Derive shared AES key from ECDH key pair + peer public key ───────────────
export async function deriveSharedKey(myPrivateKey, theirPublicKey) {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    AES_PARAMS,
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt plaintext string → { ciphertext: base64, iv: base64 } ────────────
export async function encrypt(sharedKey, plaintext) {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encoded   = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv:         btoa(String.fromCharCode(...iv)),
  };
}

// ── Decrypt { ciphertext: base64, iv: base64 } → plaintext string ────────────
export async function decrypt(sharedKey, ciphertext, iv) {
  try {
    const ivBytes  = Uint8Array.from(atob(iv),  c => c.charCodeAt(0));
    const ctBytes  = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, sharedKey, ctBytes);
    return new TextDecoder().decode(decrypted);
  } catch {
    return '[encrypted message]';
  }
}
