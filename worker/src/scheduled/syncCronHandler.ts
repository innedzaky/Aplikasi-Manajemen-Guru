import { Env, ScheduledEvent } from '../types';
import { SyncService } from '../services/syncService';

/**
 * Cloudflare Worker Scheduled Event Handler (Cron Trigger)
 * Invoked periodically (every 1-2 minutes) to process pending sync_queue records.
 */
export async function handleScheduledSync(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const syncService = new SyncService(env);

  // Use waitUntil so worker doesn't terminate before async processing completes
  ctx.waitUntil(
    (async () => {
      try {
        const result = await syncService.processBatch(10);
        console.log(`[CRON_SYNC] Batch processed: claimed=${result.claimedCount}, synced=${result.syncedCount}, retry=${result.retryCount}, failed=${result.failedCount}`);
      } catch (err: any) {
        console.error('[CRON_SYNC_ERROR] Unhandled error during scheduled sync:', err);
      }
    })()
  );
}
