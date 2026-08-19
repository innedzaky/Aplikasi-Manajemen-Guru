/**
 * =========================================================================
 * sync.ts - Types & Interfaces for Cloudflare D1 & Google Sheets Sync Hub
 * =========================================================================
 */

export type DatabaseEngine = 'cloudflare_d1' | 'google_sheets' | 'demo';

export type SyncDirection = 'd1_to_sheets' | 'sheets_to_d1';

export type SyncTrigger = 'manual' | 'realtime' | 'cron_hourly' | 'cron_daily';

export interface ISyncLog {
  id: string;
  timestamp: string;
  direction: SyncDirection;
  source: string;
  target: string;
  status: 'success' | 'failed' | 'partial';
  recordsCount: {
    presensi: number;
    nilai: number;
    jurnal: number;
    master: number;
  };
  durationMs: number;
  message: string;
  triggeredBy: SyncTrigger;
  errorDetail?: string;
}

export interface IDatabaseConfig {
  primaryEngine: DatabaseEngine;
  d1WorkerUrl: string;
  d1ApiToken: string;
  gasWebAppUrl: string;
  autoSyncEnabled: boolean;
  syncSchedule: 'realtime' | 'hourly' | 'daily_16' | 'daily_night';
  lastSyncTimestamp: string | null;
  autoBackupOnMutation: boolean;
}

export interface ISyncStats {
  d1PresensiCount: number;
  d1NilaiCount: number;
  d1JurnalCount: number;
  d1MasterCount: number;
  sheetsPresensiCount: number;
  sheetsNilaiCount: number;
  sheetsJurnalCount: number;
  sheetsMasterCount: number;
  lastSyncTime: string | null;
  d1LatencyMs: number | null;
  gasLatencyMs: number | null;
  d1Online: boolean;
  gasOnline: boolean;
}
