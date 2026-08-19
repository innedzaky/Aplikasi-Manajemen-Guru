/**
 * HMAC-SHA256 Request Signing & Verification Utility for Cloudflare Workers
 * Uses native Web Crypto API (crypto.subtle)
 */

export const REPLAY_WINDOW_SECONDS = 300; // ±5 minutes (300 seconds)

/**
 * Builds the standard canonical string to be signed.
 * Format: `${timestamp}.${requestId}.${schoolId}.${rawBody}`
 */
export function buildCanonicalString(
  timestamp: string | number,
  requestId: string,
  schoolId: string,
  rawBody: string
): string {
  return `${timestamp}.${requestId}.${schoolId}.${rawBody}`;
}

/**
 * Generates an HMAC-SHA256 hex signature using Web Crypto API.
 */
export async function generateHmacSignature(
  canonicalString: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(canonicalString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return bufferToHex(new Uint8Array(signatureBuffer));
}

/**
 * Verifies an incoming HMAC-SHA256 signature with constant-time comparison.
 */
export async function verifyHmacSignature(
  canonicalString: string,
  signatureHex: string,
  secret: string
): Promise<boolean> {
  if (!signatureHex || !secret) return false;
  try {
    const expectedSignatureHex = await generateHmacSignature(canonicalString, secret);
    return constantTimeEqual(signatureHex.toLowerCase(), expectedSignatureHex.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Verifies that the timestamp is within the acceptable window (±5 minutes).
 */
export function verifyTimestampWindow(
  timestampStr: string,
  nowMs: number = Date.now(),
  windowSeconds: number = REPLAY_WINDOW_SECONDS
): { valid: boolean; reason?: string } {
  const requestTimeMs = new Date(timestampStr).getTime();
  if (isNaN(requestTimeMs)) {
    return { valid: false, reason: 'INVALID_TIMESTAMP_FORMAT' };
  }

  const deltaMs = Math.abs(nowMs - requestTimeMs);
  const maxDeltaMs = windowSeconds * 1000;

  if (deltaMs > maxDeltaMs) {
    return {
      valid: false,
      reason: `TIMESTAMP_OUT_OF_WINDOW: delta=${Math.round(deltaMs / 1000)}s, maxAllowed=${windowSeconds}s`
    };
  }

  return { valid: true };
}

/**
 * Constant-time comparison between two strings to prevent timing attacks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
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
