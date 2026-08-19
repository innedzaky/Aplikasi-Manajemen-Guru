import { Env, SyncQueueRecord, SyncStatusSummary } from '../types';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { GoogleSheetsClient } from './googleSheetsClient';
import { buildSyncPayloadEnvelopes } from './payloadBuilder';
import { calculateNextRetryDelaySeconds, isRetryableError, MAX_RETRY_ATTEMPTS } from './retryStrategy';

export interface SyncBatchResult {
  claimedCount: number;
  syncedCount: number;
  retryCount: number;
  failedCount: number;
}

export class SyncService {
  private queueRepo: SyncQueueRepository;
  private sheetsClient: GoogleSheetsClient;

  constructor(private env: Env) {
    this.queueRepo = new SyncQueueRepository(env.DB);
    this.sheetsClient = new GoogleSheetsClient(env);
  }

  /**
   * Recovers queue items that have been stuck in 'PROCESSING' for > staleMinutes.
   */
  async recoverStaleProcessing(staleMinutes: number = 5): Promise<number> {
    return await this.queueRepo.recoverStaleProcessing(staleMinutes);
  }

  /**
   * Main Cron / Worker execution tick: Claims up to `limit` pending items and dispatches them.
   */
  async processBatch(limit: number = 10): Promise<SyncBatchResult> {
    // 1. Recover stale items first
    await this.recoverStaleProcessing(5);

    // 2. Claim pending batch atomically
    const items = await this.queueRepo.claimPendingBatch(limit);
    if (items.length === 0) {
      return { claimedCount: 0, syncedCount: 0, retryCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let retryCount = 0;
    let failedCount = 0;

    // 3. Process each claimed item sequentially to preserve ordering per entity
    for (const item of items) {
      const outcome = await this.processSingleItem(item);
      if (outcome === 'SYNCED') syncedCount++;
      else if (outcome === 'RETRY') retryCount++;
      else failedCount++;
    }

    return {
      claimedCount: items.length,
      syncedCount,
      retryCount,
      failedCount
    };
  }

  /**
   * Processes a single queue item across its potentially chunked payload envelopes.
   */
  async processSingleItem(item: SyncQueueRecord): Promise<'SYNCED' | 'RETRY' | 'FAILED'> {
    let envelopes;
    try {
      envelopes = buildSyncPayloadEnvelopes(item);
    } catch (err: any) {
      // Unparseable JSON or schema violation: Permanent failure
      const errorMsg = `Payload Build Error: ${err.message}`;
      await this.queueRepo.markRetryOrFailed(item.id, errorMsg, item.retry_count, true);
      await this.queueRepo.logSync({
        school_id: item.school_id,
        sync_queue_id: item.id,
        status: 'ERROR',
        response_payload: JSON.stringify({ error: errorMsg }),
        duration_ms: 0
      });
      return 'FAILED';
    }

    let allEnvelopesSucceeded = true;
    let lastError: any = null;
    let totalDurationMs = 0;

    for (const envelope of envelopes) {
      const { response, httpStatus, durationMs } = await this.sheetsClient.sendSyncPayload(envelope);
      totalDurationMs += durationMs;

      if (!response.success || response.status === 'FAILED') {
        allEnvelopesSucceeded = false;
        lastError = {
          httpStatus,
          errorCode: response.errorCode,
          message: response.message,
          retryable: response.retryable
        };
        break; // Stop remaining chunks on first chunk failure
      }
    }

    if (allEnvelopesSucceeded) {
      await this.queueRepo.markSynced(item.id);
      await this.queueRepo.logSync({
        school_id: item.school_id,
        sync_queue_id: item.id,
        status: 'SUCCESS',
        response_payload: JSON.stringify({ message: 'Sync acknowledged by Google Apps Script' }),
        duration_ms: totalDurationMs
      });
      return 'SYNCED';
    }

    // Determine retry vs permanent failure
    const isRetryable = isRetryableError(lastError?.httpStatus, lastError?.errorCode, lastError?.message) || (lastError?.retryable === true);
    const nextAttempt = (item.retry_count || 0) + 1;

    if (isRetryable && nextAttempt < MAX_RETRY_ATTEMPTS) {
      const delaySeconds = calculateNextRetryDelaySeconds(nextAttempt);
      const nextScheduledAtDate = new Date(Date.now() + delaySeconds * 1000);
      const nextScheduledAtIso = nextScheduledAtDate.toISOString().replace('T', ' ').substring(0, 19);
      const errorMsg = `[Attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS}] ${lastError?.errorCode || 'ERROR'}: ${lastError?.message || 'Unknown error'}`;

      await this.queueRepo.markRetryOrFailed(item.id, errorMsg, nextAttempt, false, nextScheduledAtIso);
      await this.queueRepo.logSync({
        school_id: item.school_id,
        sync_queue_id: item.id,
        status: 'RETRY',
        response_payload: JSON.stringify(lastError),
        duration_ms: totalDurationMs
      });
      return 'RETRY';
    }

    // Max retries exceeded or non-retryable error: Mark as FAILED / Dead Letter
    const permanentMsg = `[FAILED/DEAD_LETTER] ${lastError?.errorCode || 'PERMANENT_ERROR'}: ${lastError?.message || 'Error occurred'}`;
    await this.queueRepo.markRetryOrFailed(item.id, permanentMsg, nextAttempt, true);
    await this.queueRepo.logSync({
      school_id: item.school_id,
      sync_queue_id: item.id,
      status: 'ERROR',
      response_payload: JSON.stringify(lastError),
      duration_ms: totalDurationMs
    });
    return 'FAILED';
  }

  /**
   * Manual admin retry for a FAILED record.
   */
  async adminRetry(id: number, schoolId: string): Promise<boolean> {
    return await this.queueRepo.adminRetry(id, schoolId);
  }

  /**
   * Returns sync queue observability summary for a school.
   */
  async getStatusSummary(schoolId: string): Promise<SyncStatusSummary> {
    return await this.queueRepo.getStatusSummary(schoolId);
  }
}
