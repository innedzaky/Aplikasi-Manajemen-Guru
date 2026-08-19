import { SyncQueueRecord, SyncStatusSummary, SyncLogRecord } from '../types';

export class SyncQueueRepository {
  constructor(private db: D1Database) {}

  /**
   * Prepares statement for inserting a new sync queue item (Outbox pattern).
   */
  prepareInsert(item: {
    school_id: string;
    entity_type: SyncQueueRecord['entity_type'];
    entity_id: string;
    action: SyncQueueRecord['action'];
    payload_json: string;
    status?: SyncQueueRecord['status'];
    scheduled_at?: string;
  }): D1PreparedStatement {
    const query = `
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, scheduled_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
    `;
    return this.db.prepare(query).bind(
      item.school_id,
      item.entity_type,
      item.entity_id,
      item.action,
      item.payload_json,
      item.status || 'PENDING',
      item.scheduled_at || new Date().toISOString()
    );
  }

  /**
   * Recovers items stuck in PROCESSING status for longer than staleMinutes (default: 5 minutes).
   */
  async recoverStaleProcessing(staleMinutes: number = 5): Promise<number> {
    const query = `
      UPDATE sync_queue
      SET status = 'PENDING',
          error_message = 'Recovered from stale PROCESSING state'
      WHERE status = 'PROCESSING'
        AND datetime(processed_at) < datetime('now', '-' || ? || ' minutes');
    `;
    const result = await this.db.prepare(query).bind(staleMinutes).run();
    return result.meta?.changes ?? 0;
  }

  /**
   * Atomically claims a batch of PENDING records for processing.
   * Concurrency-safe: Only records transitioned from PENDING -> PROCESSING are returned.
   */
  async claimPendingBatch(limit: number = 10): Promise<SyncQueueRecord[]> {
    const selectQuery = `
      SELECT id, school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, processed_at, error_message, created_at
      FROM sync_queue
      WHERE status = 'PENDING'
        AND datetime(scheduled_at) <= datetime('now')
      ORDER BY id ASC
      LIMIT ?;
    `;

    const candidates = await this.db.prepare(selectQuery).bind(limit).all<SyncQueueRecord>();
    const items = candidates.results || [];
    if (items.length === 0) return [];

    const claimedItems: SyncQueueRecord[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const updateQuery = `
        UPDATE sync_queue
        SET status = 'PROCESSING',
            processed_at = datetime('now')
        WHERE id = ? AND status = 'PENDING';
      `;
      const updateRes = await this.db.prepare(updateQuery).bind(item.id).run();
      if ((updateRes.meta?.changes ?? 0) > 0) {
        claimedItems.push({
          ...item,
          status: 'PROCESSING',
          processed_at: now
        });
      }
    }

    return claimedItems;
  }

  /**
   * Marks a queue record as SYNCED upon successful Google Apps Script acknowledgment.
   */
  async markSynced(id: number): Promise<boolean> {
    const query = `
      UPDATE sync_queue
      SET status = 'SYNCED',
          processed_at = datetime('now'),
          error_message = NULL
      WHERE id = ?;
    `;
    const result = await this.db.prepare(query).bind(id).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  /**
   * Marks a queue record for retry (PENDING with backoff scheduled_at) or permanent failure (FAILED / Dead Letter).
   */
  async markRetryOrFailed(
    id: number,
    errorMessage: string,
    newRetryCount: number,
    isPermanent: boolean,
    nextScheduledAtIso?: string
  ): Promise<boolean> {
    if (isPermanent || !nextScheduledAtIso) {
      const query = `
        UPDATE sync_queue
        SET status = 'FAILED',
            retry_count = ?,
            processed_at = datetime('now'),
            error_message = ?
        WHERE id = ?;
      `;
      const result = await this.db.prepare(query).bind(newRetryCount, errorMessage, id).run();
      return (result.meta?.changes ?? 0) > 0;
    }

    const query = `
      UPDATE sync_queue
      SET status = 'PENDING',
          retry_count = ?,
          scheduled_at = ?,
          processed_at = datetime('now'),
          error_message = ?
      WHERE id = ?;
    `;
    const result = await this.db.prepare(query).bind(newRetryCount, nextScheduledAtIso, errorMessage, id).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  /**
   * Records a sync operation log in the audit/observability table `sync_logs`.
   */
  async logSync(log: SyncLogRecord): Promise<void> {
    const query = `
      INSERT INTO sync_logs (school_id, sync_queue_id, status, response_payload, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'));
    `;
    await this.db.prepare(query).bind(
      log.school_id,
      log.sync_queue_id ?? null,
      log.status,
      log.response_payload ?? null,
      log.duration_ms
    ).run();
  }

  /**
   * Manual retry endpoint query for OWNER / ADMIN: Re-queues a FAILED record to PENDING.
   */
  async adminRetry(id: number, schoolId: string): Promise<boolean> {
    const query = `
      UPDATE sync_queue
      SET status = 'PENDING',
          scheduled_at = datetime('now'),
          error_message = 'Manually re-queued by admin'
      WHERE id = ? AND school_id = ? AND status = 'FAILED';
    `;
    const result = await this.db.prepare(query).bind(id, schoolId).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  /**
   * Gets sync queue status summary, latency observability, and failure detection alerts for a school.
   */
  async getStatusSummary(schoolId: string): Promise<SyncStatusSummary> {
    const countQuery = `
      SELECT
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'SYNCED' THEN 1 ELSE 0 END) as synced_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'FAILED' AND retry_count >= 5 THEN 1 ELSE 0 END) as dead_letter_count,
        SUM(CASE WHEN status = 'PROCESSING' AND datetime(scheduled_at) < datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as stale_processing_count
      FROM sync_queue
      WHERE school_id = ?;
    `;
    const counts = await this.db.prepare(countQuery).bind(schoolId).first<any>();

    const lastSyncQuery = `
      SELECT created_at
      FROM sync_logs
      WHERE school_id = ? AND status = 'SUCCESS'
      ORDER BY id DESC
      LIMIT 1;
    `;
    const lastSync = await this.db.prepare(lastSyncQuery).bind(schoolId).first<{ created_at: string }>();

    const avgLatencyQuery = `
      SELECT AVG(duration_ms) as avg_duration
      FROM sync_logs
      WHERE school_id = ? AND status = 'SUCCESS'
        AND datetime(created_at) >= datetime('now', '-24 hours');
    `;
    const avgLatency = await this.db.prepare(avgLatencyQuery).bind(schoolId).first<{ avg_duration: number }>();

    const pending = counts?.pending_count || 0;
    const processing = counts?.processing_count || 0;
    const synced = counts?.synced_count || 0;
    const failed = counts?.failed_count || 0;
    const deadLetter = counts?.dead_letter_count || 0;
    const staleProcessing = counts?.stale_processing_count || 0;

    // Failure Detection & Observability Alerts
    const alerts: any[] = [];
    if (deadLetter > 0) {
      alerts.push({
        level: 'CRITICAL',
        type: 'DEAD_LETTER_ACCUMULATION',
        message: `Terdapat ${deadLetter} antrean dalam status Dead Letter (FAILED > 5 retries) yang memerlukan perhatian Admin.`,
        count: deadLetter
      });
    }

    if (staleProcessing > 0) {
      alerts.push({
        level: 'WARNING',
        type: 'STALE_PROCESSING',
        message: `Terdeteksi ${staleProcessing} item antrean macet dalam status PROCESSING > 5 menit.`,
        count: staleProcessing
      });
    }

    if (pending > 50) {
      alerts.push({
        level: 'WARNING',
        type: 'QUEUE_BUILDUP',
        message: `Penumpukan antrean sinkronisasi terdeteksi (${pending} item pending).`,
        count: pending
      });
    }

    if (failed > 10) {
      alerts.push({
        level: 'WARNING',
        type: 'HIGH_FAILURE_RATE',
        message: `Tingkat kegagalan antrean tinggi (${failed} item gagal).`,
        count: failed
      });
    }

    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (deadLetter > 0 || staleProcessing > 5) {
      healthStatus = 'CRITICAL';
    } else if (failed > 0 || pending > 50 || staleProcessing > 0) {
      healthStatus = 'DEGRADED';
    }

    return {
      schoolId,
      pending,
      processing,
      synced,
      failed,
      deadLetter,
      staleProcessing,
      lastSuccessfulSync: lastSync?.created_at || null,
      averageLatencyMs: avgLatency?.avg_duration ? Math.round(avgLatency.avg_duration) : null,
      healthStatus,
      alerts
    };
  }

  async getPendingCount(schoolId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM sync_queue
      WHERE school_id = ? AND status = 'PENDING';
    `;
    const result = await this.db.prepare(query).bind(schoolId).first<{ total: number }>();
    return result?.total || 0;
  }
}
