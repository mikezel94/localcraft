/**
 * AES-256-GCM with PBKDF2 key derivation (250,000 iterations, SHA-256).
 * Container format: "LCENC1" magic + 16-byte salt + 12-byte IV + ciphertext.
 * Everything happens in this tab via Web Crypto — nothing is sent anywhere.
 */

const MAGIC = new TextEncoder().encode('LCENC1');
const ITERATIONS = 250_000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBytes(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as ArrayBuffer }, key, data as unknown as ArrayBuffer),
  );
  const out = new Uint8Array(MAGIC.length + salt.length + iv.length + encrypted.length);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + salt.length);
  out.set(encrypted, MAGIC.length + salt.length + iv.length);
  return out;
}

export async function decryptBytes(container: Uint8Array, password: string): Promise<Uint8Array> {
  const header = container.slice(0, MAGIC.length);
  if (MAGIC.some((byte, i) => header[i] !== byte)) {
    throw new Error('This does not look like a LocalCraft encrypted file.');
  }
  const salt = container.slice(MAGIC.length, MAGIC.length + 16);
  const iv = container.slice(MAGIC.length + 16, MAGIC.length + 28);
  const ciphertext = container.slice(MAGIC.length + 28);
  const key = await deriveKey(password, salt);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as ArrayBuffer }, key, ciphertext as unknown as ArrayBuffer),
    );
  } catch {
    throw new Error('Wrong password, or the file was modified.');
  }
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64.trim().replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
