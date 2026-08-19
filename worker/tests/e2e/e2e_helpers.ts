import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import worker from '../../src/index';
import { Env, SyncQueueRecord, SyncPayloadEnvelope } from '../../src/types';
import { E2E_CONFIG } from './e2e_config';
import { buildCanonicalString, generateHmacSignature, verifyHmacSignature, verifyTimestampWindow } from '../../src/utils/hmac';

// ============================================================================
// 1. D1 SQLITE DATABASE EMULATOR
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

  const d1: D1Database = {
    prepare(query: string): D1PreparedStatement {
      return createPreparedStatement(query);
    },
    async exec(query: string): Promise<D1ExecResult> {
      try {
        db.exec(query);
        return { count: 1, duration: 1 };
      } catch (err: any) {
        throw new Error(`D1 exec error: ${err.message}`);
      }
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      db.exec('BEGIN TRANSACTION;');
      try {
        const results: D1Result<T>[] = [];
        for (const stmt of statements) {
          const res = await stmt.run<T>();
          results.push(res);
        }
        db.exec('COMMIT;');
        return results;
      } catch (err: any) {
        db.exec('ROLLBACK;');
        throw err;
      }
    },
    async dump(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    }
  };

  return d1;
}

export async function setupDatabase(d1: D1Database): Promise<void> {
  const schemaSql = fs.readFileSync(path.join(__dirname, '../../migrations/0001_initial_schema.sql'), 'utf-8');
  await d1.exec(schemaSql);
  const indexSql = fs.readFileSync(path.join(__dirname, '../../migrations/0002_indexes.sql'), 'utf-8');
  await d1.exec(indexSql);
  const seedSql = fs.readFileSync(path.join(__dirname, '../../migrations/0003_seed.sql'), 'utf-8');
  await d1.exec(seedSql);

  // Setup School B for multi-tenant isolation tests
  await d1.prepare(`
    INSERT OR IGNORE INTO schools (id, name, npsn, is_active)
    VALUES (?, ?, ?, 1);
  `).bind(E2E_CONFIG.SCHOOL_B.id, E2E_CONFIG.SCHOOL_B.name, E2E_CONFIG.SCHOOL_B.npsn).run();

  await d1.prepare(`
    INSERT OR IGNORE INTO users (id, school_id, username, password_hash, role, is_active)
    VALUES ('usr_admin_sch_b', ?, 'admin_merdeka', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'ADMIN', 1);
  `).bind(E2E_CONFIG.SCHOOL_B.id).run();
}

// ============================================================================
// 2. SIMULATED GOOGLE APPS SCRIPT SPREADSHEET REPLICA ENGINE
// ============================================================================

export interface SheetRowRecord {
  primaryKey: string;
  schoolId: string;
  data: any[];
  updatedAt: string;
}

export class MockGasSpreadsheetEngine {
  // schoolId -> tabName -> Map<PK, SheetRowRecord>
  public spreadsheets: Record<string, Record<string, Map<string, SheetRowRecord>>> = {};
  public cache: Map<string, string> = new Map();
  public locked: boolean = false;
  public force503: boolean = false;
  public secret: string = E2E_CONFIG.SECRETS.SYNC;

  constructor() {
    this.initSchool(E2E_CONFIG.SCHOOL_A.id);
    this.initSchool(E2E_CONFIG.SCHOOL_B.id);
  }

  initSchool(schoolId: string) {
    const tabs = ['Guru', 'Siswa', 'Kelas', 'Mapel', 'Penugasan', 'Presensi', 'Penilaian', 'Nilai', 'Jurnal'];
    this.spreadsheets[schoolId] = {};
    for (const t of tabs) {
      this.spreadsheets[schoolId][t] = new Map();
    }
  }

  reset() {
    this.cache.clear();
    this.locked = false;
    this.force503 = false;
    for (const schoolId of Object.keys(this.spreadsheets)) {
      for (const tab of Object.keys(this.spreadsheets[schoolId])) {
        this.spreadsheets[schoolId][tab].clear();
      }
    }
  }

  getRows(schoolId: string, tabName: string): SheetRowRecord[] {
    const sheet = this.spreadsheets[schoolId]?.[tabName];
    if (!sheet) return [];
    return Array.from(sheet.values());
  }

  getRow(schoolId: string, tabName: string, pk: string): SheetRowRecord | undefined {
    return this.spreadsheets[schoolId]?.[tabName]?.get(pk);
  }

  async handlePost(headers: Record<string, string>, rawBody: string): Promise<{ status: number; body: any }> {
    const signature = headers['x-sync-signature'] || headers['X-Sync-Signature'];
    const timestampStr = headers['x-sync-timestamp'] || headers['X-Sync-Timestamp'];
    const schoolId = headers['x-sync-school-id'] || headers['X-Sync-School-Id'];
    const requestId = headers['x-sync-request-id'] || headers['X-Sync-Request-Id'];

    if (!signature || !timestampStr || !schoolId || !requestId) {
      return {
        status: 401,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'MISSING_SYNC_HEADERS',
          message: 'Required sync headers (signature, timestamp, school-id, request-id) are missing',
          retryable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Timestamp verification (±300s window)
    const timeCheck = verifyTimestampWindow(timestampStr, Date.now(), E2E_CONFIG.REPLAY_WINDOW_SECONDS);
    if (!timeCheck.valid) {
      return {
        status: 401,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'EXPIRED_TIMESTAMP',
          message: timeCheck.reason,
          retryable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    // HMAC Signature verification
    const canonical = buildCanonicalString(timestampStr, requestId, schoolId, rawBody);
    const validSig = await verifyHmacSignature(canonical, signature, this.secret);
    if (!validSig) {
      return {
        status: 401,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'INVALID_SIGNATURE',
          message: 'HMAC signature verification failed',
          retryable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (this.force503 || this.locked) {
      return {
        status: 503,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'SPREADSHEET_LOCKED',
          message: 'Spreadsheet write lock could not be acquired within timeout window',
          retryable: true,
          timestamp: new Date().toISOString()
        }
      };
    }

    let envelope: SyncPayloadEnvelope;
    try {
      envelope = JSON.parse(rawBody);
    } catch {
      return {
        status: 400,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'INVALID_JSON',
          message: 'Failed to parse JSON payload',
          retryable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!envelope.entity || !envelope.action || !envelope.payload) {
      return {
        status: 400,
        body: {
          success: false,
          status: 'FAILED',
          errorCode: 'INVALID_PAYLOAD',
          message: 'Missing required envelope fields (entity, action, payload)',
          retryable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Idempotency check via Script Cache
    const cacheKey = `SYNC_REQ_${envelope.requestId}`;
    if (this.cache.has(cacheKey)) {
      return {
        status: 200,
        body: {
          success: true,
          requestId: envelope.requestId,
          syncQueueId: envelope.syncQueueId,
          status: 'SYNCED',
          message: 'Idempotent response: Request already processed.',
          processedRows: 0,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Ensure school sheet is initialized
    if (!this.spreadsheets[schoolId]) {
      this.initSchool(schoolId);
    }

    // Route Entity Upserts
    let tabName = 'Guru';
    if (envelope.entity === 'STUDENT') tabName = 'Siswa';
    else if (envelope.entity === 'CLASS') tabName = 'Kelas';
    else if (envelope.entity === 'SUBJECT') tabName = 'Mapel';
    else if (envelope.entity === 'ASSIGNMENT') tabName = 'Penugasan';
    else if (envelope.entity === 'ATTENDANCE') tabName = 'Presensi';
    else if (envelope.entity === 'ASSESSMENT') tabName = 'Penilaian';
    else if (envelope.entity === 'GRADE') tabName = 'Nilai';
    else if (envelope.entity === 'JOURNAL') tabName = 'Jurnal';

    const sheet = this.spreadsheets[schoolId][tabName];
    let processedRows = 0;

    if (envelope.entity === 'ATTENDANCE' && Array.isArray(envelope.payload?.records)) {
      for (const rec of envelope.payload.records) {
        const studentId = rec.studentId || rec.student_id;
        const pk = rec.id || rec.recordId || `${envelope.entityId}_${studentId}`;
        const rowData = [
          pk,
          envelope.payload.sessionId || envelope.payload.session_id || envelope.entityId,
          schoolId,
          envelope.payload.date || '',
          envelope.payload.meetingNo || envelope.payload.meeting_no || 1,
          envelope.payload.className || '',
          envelope.payload.subjectName || '',
          envelope.payload.teacherName || '',
          envelope.payload.topic || '',
          studentId || '',
          rec.studentNis || rec.nis || '',
          rec.studentName || rec.name || '',
          rec.status || 'HADIR',
          rec.notes || '',
          envelope.timestamp
        ];
        sheet.set(pk, { primaryKey: pk, schoolId, data: rowData, updatedAt: envelope.timestamp });
        processedRows++;
      }
    } else if (envelope.entity === 'GRADE' && Array.isArray(envelope.payload?.grades)) {
      for (const g of envelope.payload.grades) {
        const studentId = g.studentId || g.student_id;
        const pk = g.id || g.gradeId || `${envelope.entityId}_${studentId}`;
        const rowData = [
          pk,
          envelope.payload.assessmentId || envelope.payload.assessment_id || envelope.entityId,
          schoolId,
          envelope.payload.title || '',
          envelope.payload.type || '',
          envelope.payload.date || envelope.payload.assessment_date || '',
          envelope.payload.passingGrade || envelope.payload.passing_score || 75.0,
          envelope.payload.weight || 1.0,
          envelope.payload.className || '',
          envelope.payload.subjectName || '',
          envelope.payload.teacherName || '',
          studentId || '',
          g.studentNis || '',
          g.studentName || '',
          g.score || 0,
          (g.score || 0) >= (envelope.payload.passingGrade || envelope.payload.passing_score || 75.0) ? 'TUNTAS' : 'REMEDIAL',
          g.feedback || '',
          envelope.timestamp
        ];
        sheet.set(pk, { primaryKey: pk, schoolId, data: rowData, updatedAt: envelope.timestamp });
        processedRows++;
      }
    } else {
      const pk = envelope.entityId || envelope.payload?.id || 'pk_auto';
      const rowData = [
        pk,
        schoolId,
        envelope.payload.nip || envelope.payload.nis || envelope.payload.code || envelope.payload.name || '',
        envelope.payload.name || envelope.payload.title || '',
        envelope.payload.specialization || envelope.payload.grade_level || envelope.payload.passing_grade || '',
        (envelope.payload.is_active === 0 || envelope.payload.is_active === false) ? 0 : 1,
        envelope.timestamp
      ];
      sheet.set(pk, { primaryKey: pk, schoolId, data: rowData, updatedAt: envelope.timestamp });
      processedRows = 1;
    }

    // Save to Idempotency Cache
    this.cache.set(cacheKey, 'SYNCED');

    return {
      status: 200,
      body: {
        success: true,
        requestId: envelope.requestId,
        syncQueueId: envelope.syncQueueId,
        status: 'SYNCED',
        processedRows,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ============================================================================
// 3. WORKER API CALL HELPER
// ============================================================================

export async function callWorkerApi(
  env: Env,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const req = new Request(`https://api.worker.local${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  };

  const res = await worker.fetch(req, env, ctx);
  const status = res.status;
  const json = await res.json().catch(() => null);

  return { status, json, headers: Object.fromEntries(res.headers.entries()) };
}
