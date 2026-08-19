/**
 * Google Apps Script - Code.gs
 * Web App Entry Point: doPost(e), doGet(e), and CORS Preflight Handlers.
 */

/**
 * Main Web App POST handler for Cloudflare Worker Sync payloads.
 *
 * @param {Object} e - Event object from Apps Script Web App POST request
 * @returns {TextOutput} JSON HTTP response
 */
function doPost(e) {
  try {
    // 1. Authenticate Request (HMAC-SHA256, Headers, Replay Window)
    var authResult = verifySyncRequest(e);
    if (!authResult.isValid) {
      return createJsonResponse({
        success: false,
        status: 'FAILED',
        errorCode: authResult.error.errorCode,
        message: authResult.error.message,
        retryable: authResult.error.httpStatus >= 500,
        timestamp: new Date().toISOString()
      }, authResult.error.httpStatus);
    }

    // 2. Parse Envelope Body
    var envelope;
    try {
      envelope = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        success: false,
        status: 'FAILED',
        errorCode: 'INVALID_JSON',
        message: 'Could not parse request body as JSON: ' + parseErr.message,
        retryable: false,
        timestamp: new Date().toISOString()
      }, 400);
    }

    // 3. Process Sync Request & Perform Idempotent Spreadsheet Upsert
    var syncResult = SyncService.processEnvelope(envelope);
    return createJsonResponse(syncResult, syncResult.success ? 200 : (syncResult.retryable ? 503 : 400));

  } catch (globalErr) {
    return createJsonResponse({
      success: false,
      status: 'FAILED',
      errorCode: 'GAS_INTERNAL_ERROR',
      message: globalErr.message || 'An unexpected error occurred in Google Apps Script.',
      retryable: true,
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Health check & status verification endpoint for Google Apps Script (TASK U8.3).
 * Verifies Web App availability, script execution, configuration state, and Spreadsheet connectivity
 * without dumping sensitive spreadsheet contents or secrets.
 */
function doGet(e) {
  try {
    var secretProp = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
    var secretState = secretProp ? (secretProp.length >= 16 ? 'CONFIGURED' : 'INVALID') : 'DEFAULT';

    // Verify spreadsheet accessibility
    var spreadsheetConnected = false;
    var spreadsheetTitle = 'N/A';
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        spreadsheetConnected = true;
        spreadsheetTitle = ss.getName();
      }
    } catch (ssErr) {
      spreadsheetConnected = false;
    }

    var isHealthy = true;

    return createJsonResponse({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'Sistem Manajemen Guru - Google Apps Script Sync Replica',
      execution: 'ONLINE',
      configuration: {
        syncSecret: secretState,
        replayWindowSeconds: SYNC_CONFIG.REPLAY_WINDOW_SECONDS,
        lockTimeoutMs: SYNC_CONFIG.LOCK_TIMEOUT_MS
      },
      spreadsheet: {
        connected: spreadsheetConnected,
        name: spreadsheetTitle
      },
      timestamp: new Date().toISOString()
    }, 200);

  } catch (healthErr) {
    return createJsonResponse({
      success: false,
      status: 'unhealthy',
      service: 'Sistem Manajemen Guru - Google Apps Script Sync Replica',
      message: 'GAS Health Check failed: ' + healthErr.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}

/**
 * Helper to build standard JSON response for Google Apps Script Web App.
 */
function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
