/**
 * Google Apps Script - AuthMiddleware.gs
 * Handles HMAC-SHA256 Signature Verification, Timestamp Window Checks, and Replay Protection.
 */

/**
 * Validates HMAC signature, timestamp window, and canonical request headers.
 *
 * @param {Object} e - HTTP POST event object from Apps Script doPost(e)
 * @returns {Object} { isValid: boolean, error?: { httpStatus: number, errorCode: string, message: string } }
 */
function verifySyncRequest(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {
      isValid: false,
      error: {
        httpStatus: 400,
        errorCode: 'INVALID_PAYLOAD',
        message: 'Request body is empty or malformed.'
      }
    };
  }

  // Apps Script provides headers in lowercase or original depending on deployment
  var headers = e.headers || {};
  var signature = headers['x-sync-signature'] || headers['X-Sync-Signature'];
  var timestampStr = headers['x-sync-timestamp'] || headers['X-Sync-Timestamp'];
  var schoolId = headers['x-sync-school-id'] || headers['X-Sync-School-Id'];
  var requestId = headers['x-sync-request-id'] || headers['X-Sync-Request-Id'];

  if (!signature || !timestampStr || !schoolId || !requestId) {
    return {
      isValid: false,
      error: {
        httpStatus: 401,
        errorCode: 'MISSING_SYNC_HEADERS',
        message: 'Missing required sync security headers (X-Sync-Signature, X-Sync-Timestamp, X-Sync-School-Id, X-Sync-Request-Id).'
      }
    };
  }

  // 1. Replay Protection: Validate timestamp window (±5 minutes)
  var requestTimeMs = new Date(timestampStr).getTime();
  if (isNaN(requestTimeMs)) {
    return {
      isValid: false,
      error: {
        httpStatus: 400,
        errorCode: 'INVALID_TIMESTAMP_FORMAT',
        message: 'Header X-Sync-Timestamp is not a valid ISO date.'
      }
    };
  }

  var nowMs = new Date().getTime();
  var deltaSeconds = Math.abs(nowMs - requestTimeMs) / 1000;
  if (deltaSeconds > SYNC_CONFIG.REPLAY_WINDOW_SECONDS) {
    return {
      isValid: false,
      error: {
        httpStatus: 401,
        errorCode: 'EXPIRED_TIMESTAMP',
        message: 'Request timestamp is outside the ±5 minutes replay window (' + Math.round(deltaSeconds) + 's delta).'
      }
    };
  }

  // 2. Compute Expected HMAC-SHA256 Signature
  var rawBody = e.postData.contents;
  var canonicalString = timestampStr + '.' + requestId + '.' + schoolId + '.' + rawBody;
  var secret = getSyncSecret();

  var computedBytes = Utilities.computeHmacSha256Signature(canonicalString, secret);
  var computedHex = bytesToHex(computedBytes);

  // 3. Constant-Time Signature Comparison
  if (!constantTimeCompare(signature.toLowerCase(), computedHex.toLowerCase())) {
    return {
      isValid: false,
      error: {
        httpStatus: 401,
        errorCode: 'INVALID_SIGNATURE',
        message: 'HMAC-SHA256 signature verification failed.'
      }
    };
  }

  return { isValid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Converts a signed byte array to a lowercase hexadecimal string.
 */
function bytesToHex(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    if (b < 0) b += 256;
    var byteHex = b.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}
