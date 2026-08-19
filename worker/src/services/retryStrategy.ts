export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Approximate retry target delays in seconds:
 * Attempt 1: ~30s
 * Attempt 2: ~120s (2m)
 * Attempt 3: ~480s (8m)
 * Attempt 4: ~1800s (30m)
 * Attempt 5: ~7200s (2h)
 */
const RETRY_BASE_DELAYS_SECONDS = [30, 120, 480, 1800, 7200];

/**
 * Calculates next retry delay in seconds using exponential backoff with ±10% jitter.
 */
export function calculateNextRetryDelaySeconds(currentAttempt: number): number {
  const index = Math.min(Math.max(0, currentAttempt - 1), RETRY_BASE_DELAYS_SECONDS.length - 1);
  const baseDelay = RETRY_BASE_DELAYS_SECONDS[index];
  
  // Add ±10% random jitter to avoid thundering herd problem
  const jitterRange = baseDelay * 0.1;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  
  return Math.max(10, Math.round(baseDelay + jitter));
}

/**
 * Determines whether an HTTP status code or error is transient (retryable).
 */
export function isRetryableError(
  httpStatus?: number,
  errorCode?: string,
  errorMessage?: string
): boolean {
  if (httpStatus) {
    // 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
    if (httpStatus === 429 || httpStatus === 500 || httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
      return true;
    }
    // Client errors like 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found are permanent
    if (httpStatus >= 400 && httpStatus < 500) {
      return false;
    }
  }

  // Network / timeout error codes
  if (errorCode) {
    const retryableCodes = ['NETWORK_TIMEOUT', 'CONNECTION_RESET', 'SERVICE_UNAVAILABLE', 'LOCK_TIMEOUT', 'SPREADSHEET_LOCKED', 'QUOTA_EXCEEDED'];
    if (retryableCodes.includes(errorCode)) {
      return true;
    }
    const permanentCodes = ['INVALID_SIGNATURE', 'EXPIRED_TIMESTAMP', 'REPLAY_DETECTED', 'INVALID_PAYLOAD', 'SCHEMA_ERROR', 'FORBIDDEN'];
    if (permanentCodes.includes(errorCode)) {
      return false;
    }
  }

  // Check message keywords
  if (errorMessage) {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('quota') || msg.includes('lock') || msg.includes('too many')) {
      return true;
    }
  }

  return false;
}
