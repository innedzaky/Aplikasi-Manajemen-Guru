import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import worker from '../../src/index';
import { Env, SyncPayloadEnvelope, SyncQueueRecord } from '../../src/types';
import { buildCanonicalString, generateHmacSignature, verifyHmacSignature, verifyTimestampWindow } from '../../src/utils/hmac';

// ============================================================================
// 1. D1 SQLITE DATABASE EMULATOR (NODE:SQLITE)
// ============================================================================

export function createD1Emulator(): D1Database {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  function createPreparedStatement(sql: string, params: any[] = []): D1PreparedStatement {
    return {
      bind(...values: any[]): D1PreparedStatement {
        return createPreparedStatement(sql, values);
      },
      async first<T = unknown>(colName?: string): Promise<T | null> {
        try {
          const stmt = db.prepare(sql);
          const cleanParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : (p === undefined ? null : p));
          const row = stmt.get(...cleanParams) as any;
          if (!row) return null;
          if (colName) return row[colName] ?? null;
          return row as T;
        } catch (err: any) {
          throw new Error(`D1 query error in first(): ${err.message} [SQL: ${sql}]`);
        }
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        try {
          const stmt = db.prepare(sql);
          const cleanParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : (p === undefined ? null : p));
          const results = stmt.all(...cleanParams) as T[];
          return {
            results: results || [],
            success: true,
            meta: { duration: 1, changes: 0 }
          };
        } catch (err: any) {
          throw new Error(`D1 query error in all(): ${err.message} [SQL: ${sql}]`);
        }
      },
      async run<T = unknown>(): Promise<D1Result<T>> {
        try {
          const stmt = db.prepare(sql);
          const cleanParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : (p === undefined ? null : p));
          const info = stmt.run(...cleanParams);
          return {
            results: [],
            success: true,
            meta: {
              changes: Number(info.changes),
              last_row_id: Number(info.lastInsertRowid),
              duration: 1
            }
          };
        } catch (err: any) {
          throw new Error(`D1 query error in run(): ${err.message} [SQL: ${sql}]`);
        }
      },
      async raw<T = unknown>(): Promise<T[]> {
        const stmt = db.prepare(sql);
        const cleanParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : (p === undefined ? null : p));
        return (stmt.all(...cleanParams) as any[]).map(row => Object.values(row)) as T[];
      }
    };
  }

  return {
    prepare(query: string): D1PreparedStatement {
      return createPreparedStatement(query);
    },
    async dump(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      db.exec('BEGIN TRANSACTION;');
      try {
        for (const stmt of statements) {
          const res = await stmt.run<T>();
          results.push(res);
        }
        db.exec('COMMIT;');
        return results;
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    },
    async exec(query: string): Promise<D1ExecResult> {
      db.exec(query);
      return { count: 1, duration: 1 };
    }
  } as unknown as D1Database;
}

// ============================================================================
// 2. DATABASE INITIALIZATION HELPER
// ============================================================================

export async function setupDatabase(d1: D1Database): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'worker', 'migrations');
  const schemaSql = fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf-8');
  await d1.exec(schemaSql);

  const indexSql = fs.readFileSync(path.join(migrationsDir, '0002_indexes.sql'), 'utf-8');
  await d1.exec(indexSql);

  const seedSql = fs.readFileSync(path.join(migrationsDir, '0003_seed.sql'), 'utf-8');
  await d1.exec(seedSql);
}

// ============================================================================
// 3. API WORKER DISPATCHER
// ============================================================================

export interface WorkerCallResponse {
  status: number;
  headers: Headers;
  json: any;
  text: string;
}

export async function callWorkerApi(
  env: Env,
  path: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    headers?: Record<string, string>;
    ip?: string;
  } = {}
): Promise<WorkerCallResponse> {
  const method = options.method || 'GET';
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (options.token) {
    reqHeaders['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.ip) {
    reqHeaders['CF-Connecting-IP'] = options.ip;
  }

  const req = new Request(`http://localhost:3000${path}`, {
    method,
    headers: reqHeaders,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const res = await worker.fetch(req, env, {} as ExecutionContext);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    json,
    text
  };
}

// ============================================================================
// 4. MOCK GOOGLE APPS SCRIPT SPREADSHEET REPLICA ENGINE
// ============================================================================

export interface MockSpreadsheetRow {
  [key: string]: any;
}

export class MockGasSpreadsheetEngine {
  private sheets: Map<string, Map<string, MockSpreadsheetRow[]>> = new Map();
  private processedRequestIds: Set<string> = new Set();
  private syncSecret: string = 'production_grade_hmac_sync_secret_32_bytes_long';
  public shouldSimulate503: boolean = false;
  public shouldSimulateLockTimeout: boolean = false;
  public shouldSimulatePermanentError: boolean = false;

  constructor(syncSecret?: string) {
    if (syncSecret) this.syncSecret = syncSecret;
  }

  private getSchoolSheet(schoolId: string, sheetName: string): MockSpreadsheetRow[] {
    if (!this.sheets.has(schoolId)) {
      this.sheets.set(schoolId, new Map());
    }
    const schoolMap = this.sheets.get(schoolId)!;
    if (!schoolMap.has(sheetName)) {
      schoolMap.set(sheetName, []);
    }
    return schoolMap.get(sheetName)!;
  }

  public getRows(schoolId: string, sheetName: string): MockSpreadsheetRow[] {
    return [...this.getSchoolSheet(schoolId, sheetName)];
  }

  public clear(schoolId?: string): void {
    if (schoolId) {
      this.sheets.delete(schoolId);
    } else {
      this.sheets.clear();
      this.processedRequestIds.clear();
    }
  }

  public async handlePost(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<{ status: number; body: any }> {
    if (this.shouldSimulate503) {
      return { status: 503, body: { success: false, error: 'Google Apps Script temporary service unavailable', retryable: true } };
    }
    if (this.shouldSimulateLockTimeout) {
      return { status: 503, body: { success: false, error: 'Spreadsheet lock acquisition timeout', errorCode: 'SPREADSHEET_LOCKED', retryable: true } };
    }
    if (this.shouldSimulatePermanentError) {
      return { status: 400, body: { success: false, error: 'Permanent schema validation failure in target replica', retryable: false } };
    }

    const signature = headers['x-sync-signature'] || headers['X-Sync-Signature'];
    const timestampStr = headers['x-sync-timestamp'] || headers['X-Sync-Timestamp'];
    const schoolIdHeader = headers['x-sync-school-id'] || headers['X-Sync-School-Id'];

    if (!signature || !timestampStr || !schoolIdHeader) {
      return { status: 401, body: { success: false, error: 'Missing security headers', errorCode: 'UNAUTHORIZED' } };
    }

    let reqTimeMs = new Date(timestampStr).getTime();
    if (isNaN(reqTimeMs)) {
      const num = Number(timestampStr);
      reqTimeMs = num > 1e11 ? num : num * 1000;
    }
    const deltaSeconds = Math.abs(Date.now() - reqTimeMs) / 1000;
    if (isNaN(reqTimeMs) || deltaSeconds > 300) {
      return { status: 401, body: { success: false, error: 'Timestamp expired or out of allowed drift window', errorCode: 'EXPIRED_TIMESTAMP' } };
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { success: false, error: 'Invalid JSON payload structure', errorCode: 'INVALID_JSON' } };
    }

    const timestampVal = timestampStr || payload.timestamp || Math.floor(Date.now() / 1000);
    const canonical = buildCanonicalString(timestampVal, payload.requestId, payload.schoolId, rawBody);
    const isValidSig = await verifyHmacSignature(canonical, signature, this.syncSecret);
    if (!isValidSig) {
      return { status: 401, body: { success: false, error: 'Invalid HMAC signature', errorCode: 'INVALID_SIGNATURE' } };
    }

    // Idempotency check
    if (this.processedRequestIds.has(payload.requestId)) {
      return {
        status: 200,
        body: {
          success: true,
          data: {
            requestId: payload.requestId,
            status: 'IDEMPOTENT_SKIPPED',
            recordsProcessed: 0,
            message: 'Duplicate delivery recognized; skipped duplicate processing cleanly'
          }
        }
      };
    }

    this.processedRequestIds.add(payload.requestId);

    const entityType = payload.entity || payload.entityType || 'TEACHER';
    const sheetName = this.mapEntityTypeToSheet(entityType);
    const rows = this.getSchoolSheet(payload.schoolId, sheetName);

    const payloadData = payload.payload !== undefined ? payload.payload : payload.data;
    const records = Array.isArray(payloadData) ? payloadData : (payloadData ? [payloadData] : []);
    let writeCount = 0;

    for (const record of records) {
      if (!record) continue;
      const pk = record.id || record.session_id || record.canonical_id;
      if (payload.action === 'INSERT') {
        const existingIdx = rows.findIndex(r => (r.id || r.session_id || r.canonical_id) === pk);
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], ...record, _synced_at: new Date().toISOString() };
        } else {
          rows.push({ ...record, _synced_at: new Date().toISOString() });
        }
        writeCount++;
      } else if (payload.action === 'UPDATE') {
        const existingIdx = rows.findIndex(r => (r.id || r.session_id || r.canonical_id) === pk);
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], ...record, _updated_at: new Date().toISOString() };
        } else {
          rows.push({ ...record, _synced_at: new Date().toISOString() });
        }
        writeCount++;
      } else if (payload.action === 'DELETE') {
        const existingIdx = rows.findIndex(r => (r.id || r.session_id || r.canonical_id) === pk);
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], _deleted: true, _deleted_at: new Date().toISOString() };
        }
        writeCount++;
      } else if (payload.action === 'BATCH_INSERT') {
        rows.push({ ...record, _synced_at: new Date().toISOString() });
        writeCount++;
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        data: {
          requestId: payload.requestId,
          recordsProcessed: writeCount,
          sheetName,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  private mapEntityTypeToSheet(entityType: string): string {
    switch (entityType) {
      case 'TEACHER': return 'Guru';
      case 'STUDENT': return 'Siswa';
      case 'CLASS': return 'Kelas';
      case 'SUBJECT': return 'Mapel';
      case 'ASSIGNMENT': return 'Penugasan';
      case 'ATTENDANCE': return 'Presensi';
      case 'ASSESSMENT': return 'Penilaian';
      case 'GRADE': return 'Nilai';
      case 'JOURNAL': return 'Jurnal';
      default: return 'Master';
    }
  }
}

// ============================================================================
// 5. TEST RESULT INTERFACE & REPORTER
// ============================================================================

export interface U10TestResult {
  id: string;
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  durationMs: number;
}
