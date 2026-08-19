// Native Web Crypto PBKDF2 Password Hashing for Cloudflare Workers
// Secure, zero external dependency, resistant to timing attacks

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generates a PBKDF2 hash with random salt.
 * Format output: "pbkdf2:sha256:<iterations>:<saltHex>:<hashHex>"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(new Uint8Array(derivedBits));

  return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Constant-time password verification against stored PBKDF2 or legacy SHA-256 hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;

  // Support PBKDF2 format
  if (storedHash.startsWith('pbkdf2:sha256:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 5) return false;

    const iterations = parseInt(parts[2], 10);
    const salt = hexToBuffer(parts[3]);
    const originalHashHex = parts[4];

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      KEY_LENGTH * 8
    );

    const derivedHashHex = bufferToHex(new Uint8Array(derivedBits));
    return constantTimeEqual(derivedHashHex, originalHashHex);
  }

  // Fallback support for seed/legacy SHA-256 hashes
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const sha256Hex = bufferToHex(new Uint8Array(hashBuffer));
  return constantTimeEqual(sha256Hex, storedHash);
}

/**
 * SHA-256 fast hash for token hashing and session identifiers
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(new Uint8Array(hashBuffer));
}

/**
 * Cryptographically secure random token (32 bytes = 256 bits)
 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Constant-time string equality comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
