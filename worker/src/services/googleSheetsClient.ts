import { Env, SyncPayloadEnvelope, GasSyncResponse } from '../types';
import { buildCanonicalString, generateHmacSignature } from '../utils/hmac';

export interface GasClientResult {
  response: GasSyncResponse;
  httpStatus: number;
  durationMs: number;
}

export class GoogleSheetsClient {
  constructor(private env: Env) {}

  /**
   * Dispatches a single sync payload envelope to the Google Apps Script Web App.
   */
  async sendSyncPayload(envelope: SyncPayloadEnvelope): Promise<GasClientResult> {
    const endpoint = this.env.GAS_SYNC_URL || this.env.GAS_SYNC_ENDPOINT;
    const secret = this.env.SYNC_SECRET || this.env.GAS_SYNC_SECRET || 'dev-sync-secret-default-key-32b';

    if (!endpoint) {
      // Mock mode in development / local testing if endpoint is not configured
      return {
        response: {
          success: true,
          requestId: envelope.requestId,
          syncQueueId: envelope.syncQueueId,
          status: 'SYNCED',
          processedRows: 1,
          timestamp: new Date().toISOString()
        },
        httpStatus: 200,
        durationMs: 5
      };
    }

    const rawBody = JSON.stringify(envelope);
    const canonicalString = buildCanonicalString(
      envelope.timestamp,
      envelope.requestId,
      envelope.schoolId,
      rawBody
    );

    const signature = await generateHmacSignature(canonicalString, secret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Sync-Signature': signature,
      'X-Sync-Timestamp': envelope.timestamp,
      'X-Sync-School-Id': envelope.schoolId,
      'X-Sync-Request-Id': envelope.requestId
    };

    const start = Date.now();
    try {
      // Timeout after 25 seconds (Google Apps Script limit is 30s-6m, Worker fetch timeout default is 30s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: rawBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - start;
      const httpStatus = res.status;

      let jsonResponse: any = null;
      try {
        jsonResponse = await res.json();
      } catch {
        jsonResponse = null;
      }

      if (!res.ok) {
        return {
          response: {
            success: false,
            requestId: envelope.requestId,
            syncQueueId: envelope.syncQueueId,
            status: 'FAILED',
            errorCode: jsonResponse?.errorCode || `HTTP_${httpStatus}`,
            message: jsonResponse?.message || `GAS returned HTTP status ${httpStatus}`,
            retryable: jsonResponse?.retryable ?? (httpStatus === 429 || httpStatus >= 500),
            timestamp: new Date().toISOString()
          },
          httpStatus,
          durationMs
        };
      }

      return {
        response: {
          success: jsonResponse?.success ?? true,
          requestId: envelope.requestId,
          syncQueueId: envelope.syncQueueId,
          status: jsonResponse?.status ?? 'SYNCED',
          processedRows: jsonResponse?.processedRows,
          errorCode: jsonResponse?.errorCode,
          message: jsonResponse?.message,
          retryable: jsonResponse?.retryable,
          timestamp: jsonResponse?.timestamp ?? new Date().toISOString()
        },
        httpStatus,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const isTimeout = err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout');

      return {
        response: {
          success: false,
          requestId: envelope.requestId,
          syncQueueId: envelope.syncQueueId,
          status: 'FAILED',
          errorCode: isTimeout ? 'NETWORK_TIMEOUT' : 'FETCH_ERROR',
          message: err?.message || 'Failed to connect to Google Apps Script',
          retryable: true,
          timestamp: new Date().toISOString()
        },
        httpStatus: isTimeout ? 504 : 503,
        durationMs
      };
    }
  }
}
