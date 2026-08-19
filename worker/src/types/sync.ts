export type SyncEntityType =
  | 'TEACHER'
  | 'STUDENT'
  | 'CLASS'
  | 'SUBJECT'
  | 'ASSIGNMENT'
  | 'ATTENDANCE'
  | 'ASSESSMENT'
  | 'GRADE'
  | 'JOURNAL';

export type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH_INSERT';

export type SyncStatus = 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';

export interface SyncQueueRecord {
  id: number;
  school_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  action: SyncAction;
  payload_json: string;
  status: SyncStatus;
  retry_count: number;
  scheduled_at: string;
  processed_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface SyncPayloadEnvelope<T = any> {
  requestId: string;
  syncQueueId: number;
  schoolId: string;
  entity: SyncEntityType;
  action: SyncAction;
  entityId: string;
  timestamp: string;
  batchNumber?: number;
  totalBatches?: number;
  payload: T;
}

export interface GasSyncResponse {
  success: boolean;
  requestId: string;
  syncQueueId?: number;
  status: 'SYNCED' | 'FAILED';
  processedRows?: number;
  errorCode?: string;
  message?: string;
  retryable?: boolean;
  timestamp: string;
}

export interface SyncAlert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'STALE_PROCESSING' | 'QUEUE_BUILDUP' | 'HIGH_FAILURE_RATE' | 'DEAD_LETTER_ACCUMULATION' | 'MISSING_HEARTBEAT';
  message: string;
  count?: number;
}

export interface SyncStatusSummary {
  schoolId: string;
  pending: number;
  processing: number;
  synced: number;
  failed: number;
  deadLetter: number;
  staleProcessing?: number;
  lastSuccessfulSync: string | null;
  averageLatencyMs: number | null;
  healthStatus?: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  alerts?: SyncAlert[];
}

export interface SyncLogRecord {
  id?: number;
  school_id: string;
  sync_queue_id?: number | null;
  status: 'SUCCESS' | 'ERROR' | 'RETRY';
  response_payload?: string | null;
  duration_ms: number;
  created_at?: string;
}
