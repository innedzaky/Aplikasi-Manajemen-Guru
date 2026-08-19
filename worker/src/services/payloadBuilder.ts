import { SyncQueueRecord, SyncPayloadEnvelope } from '../types';

export const MAX_RECORDS_PER_BATCH = 50;

/**
 * Builds one or more standard payload envelopes from a D1 SyncQueueRecord.
 * Automatically chunks large record arrays (> 50 items) into multiple envelopes.
 */
export function buildSyncPayloadEnvelopes(item: SyncQueueRecord): SyncPayloadEnvelope[] {
  let parsedPayload: any;
  try {
    parsedPayload = JSON.parse(item.payload_json);
  } catch (err: any) {
    throw new Error(`Failed to parse payload_json for sync_queue ID ${item.id}: ${err.message}`);
  }

  const nowIso = new Date().toISOString();

  // If payload contains a 'records' or 'grades' array larger than MAX_RECORDS_PER_BATCH, chunk it
  const arrayField = Array.isArray(parsedPayload?.records)
    ? 'records'
    : Array.isArray(parsedPayload?.grades)
    ? 'grades'
    : null;

  if (arrayField && parsedPayload[arrayField].length > MAX_RECORDS_PER_BATCH) {
    const originalArray = parsedPayload[arrayField] as any[];
    const totalBatches = Math.ceil(originalArray.length / MAX_RECORDS_PER_BATCH);
    const envelopes: SyncPayloadEnvelope[] = [];

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const start = batchIdx * MAX_RECORDS_PER_BATCH;
      const end = start + MAX_RECORDS_PER_BATCH;
      const chunk = originalArray.slice(start, end);

      const chunkedPayload = {
        ...parsedPayload,
        [arrayField]: chunk,
        _batchInfo: {
          batchNumber: batchIdx + 1,
          totalBatches,
          batchRecordCount: chunk.length,
          totalRecordCount: originalArray.length
        }
      };

      const requestId = `sync_${item.school_id}_${item.id}_b${batchIdx + 1}_${Date.now()}`;

      envelopes.push({
        requestId,
        syncQueueId: item.id,
        schoolId: item.school_id,
        entity: item.entity_type,
        action: item.action,
        entityId: item.entity_id,
        timestamp: nowIso,
        batchNumber: batchIdx + 1,
        totalBatches,
        payload: chunkedPayload
      });
    }

    return envelopes;
  }

  // Single envelope for standard / <= 50 records payload
  const requestId = `sync_${item.school_id}_${item.id}_${Date.now()}`;
  return [
    {
      requestId,
      syncQueueId: item.id,
      schoolId: item.school_id,
      entity: item.entity_type,
      action: item.action,
      entityId: item.entity_id,
      timestamp: nowIso,
      batchNumber: 1,
      totalBatches: 1,
      payload: parsedPayload
    }
  ];
}
