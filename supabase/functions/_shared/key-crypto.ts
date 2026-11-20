// AES-256-GCM encryption for stored API keys (Web Crypto: identical in Node 20+, Deno and browsers).
// The 32-byte master key comes from the KEY_ENCRYPTION_SECRET server secret. Generate one with:
//   openssl rand -base64 32
// Each value gets a fresh random 96-bit IV; the GCM tag is appended to the ciphertext. The additional authenticated data
// (AAD) binds a ciphertext to its owner, so a row copied to another user or provider fails to decrypt.

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export class KeyEncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyEncryptionConfigError';
  }
}

/** Accepts a base64 (44 chars) or hex (64 chars) encoding of exactly 32 bytes. */
export function parseMasterKey(secret: string | undefined): Uint8Array {
  if (!secret) throw new KeyEncryptionConfigError('KEY_ENCRYPTION_SECRET is not set. Generate one with: openssl rand -base64 32');
  const s = secret.trim();
  let bytes: Uint8Array | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(s)) bytes = Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
  else {
    try {
      bytes = unb64(s);
    } catch {
      bytes = null;
    }
  }
  if (!bytes || bytes.length !== 32) throw new KeyEncryptionConfigError('KEY_ENCRYPTION_SECRET must be 32 random bytes (base64 or hex). Generate one with: openssl rand -base64 32');
  return bytes;
}

async function cryptoKey(secret: string | undefined): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', parseMasterKey(secret) as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export const aadFor = (userId: string, provider: string) => new TextEncoder().encode(`${userId}:${provider}`);

export async function encryptSecret(plaintext: string, secret: string | undefined, aad: Uint8Array): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad as BufferSource }, await cryptoKey(secret), new TextEncoder().encode(plaintext));
  return { ciphertext: b64(new Uint8Array(buf)), iv: b64(iv) };
}

/** Throws if the data was tampered with, belongs to another AAD, or the master key is wrong. */
export async function decryptSecret(record: { ciphertext: string; iv: string }, secret: string | undefined, aad: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(record.iv) as BufferSource, additionalData: aad as BufferSource },
    await cryptoKey(secret),
    unb64(record.ciphertext) as BufferSource
  );
  return new TextDecoder().decode(buf);
}

export const last4Of = (key: string) => key.trim().slice(-4);
