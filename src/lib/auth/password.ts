const PBKDF2_ITERATIONS = 600_000;
const HASH_ALGORITHM = 'SHA-256';
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function base64ToBytes(value: string): Uint8Array {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const stableSalt = new Uint8Array(salt).buffer;
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: HASH_ALGORITHM, salt: stableSalt, iterations }, key, KEY_BYTES * 8);
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${HASH_ALGORITHM}$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, algorithm, iterationValue, saltValue, hashValue] = storedHash.split('$');
  const iterations = Number(iterationValue);
  if (scheme !== 'pbkdf2' || algorithm !== HASH_ALGORITHM || !Number.isSafeInteger(iterations) || !saltValue || !hashValue) return false;
  const expected = base64ToBytes(hashValue);
  const actual = await derive(password, base64ToBytes(saltValue), iterations);
  return constantTimeEqual(actual, expected);
}

export async function hashOpaqueToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return bytesToBase64(new Uint8Array(digest));
}

export function generateOpaqueToken(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
}
