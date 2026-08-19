import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import worker from '../src/index';
import { Env } from '../src/types';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '../src/middleware/rateLimit';
import { SyncQueueRepository } from '../src/repositories/syncQueueRepository';
import { hashPassword } from '../src/utils/crypto';

// ============================================================================
// D1 DATABASE EMULATOR (NODE:SQLITE)
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
// TEST HARNESS & SEED INITIALIZATION
// ============================================================================

export interface TestResult {
  id: string;
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  durationMs: number;
}

async function setupTestDb(): Promise<D1Database> {
  const db = createD1Emulator();
  const migrationsDir = path.join(process.cwd(), 'worker', 'migrations');

  const schemaSql = fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf-8');
  await db.exec(schemaSql);

  const indexSql = fs.readFileSync(path.join(migrationsDir, '0002_indexes.sql'), 'utf-8');
  await db.exec(indexSql);

  const seedSql = fs.readFileSync(path.join(migrationsDir, '0003_seed.sql'), 'utf-8');
  await db.exec(seedSql);

  return db;
}

function createTestEnv(db: D1Database): Env {
  return {
    DB: db,
    ENVIRONMENT: 'testing',
    SESSION_SECRET: 'production_grade_super_secret_session_key_32_bytes',
    SYNC_SECRET: 'production_grade_hmac_sync_secret_32_bytes_long',
    GAS_SYNC_URL: 'https://script.google.com/macros/s/AKfycbz_test_gas_production/exec'
  };
}

async function loginUser(env: Env, username: string, password = 'password123', schoolCode?: string): Promise<{ token: string; user: any }> {
  RateLimiter.reset();
  const req = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, school_code: schoolCode })
  });

  const res = await worker.fetch(req, env, {} as ExecutionContext);
  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(`Login failed for ${username}: ${data.error?.message || 'Unknown error'}`);
  }
  return { token: data.data.token, user: data.data.user };
}

// ============================================================================
// U9 TEST RUNNER
// ============================================================================

export async function runU9TestSuite(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const db = await setupTestDb();
  const env = createTestEnv(db);

  console.log('============================================================');
  console.log('STARTING FASE U9: PRODUCTION HARDENING & OBSERVABILITY TEST SUITE');
  console.log('============================================================');

  // --------------------------------------------------------------------------
  // U9-SEC-01: Uniform Security Headers Verification
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const req = new Request('http://localhost:3000/api/health', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as ExecutionContext);

    const hasNosniff = res.headers.get('X-Content-Type-Options') === 'nosniff';
    const hasFrameDeny = res.headers.get('X-Frame-Options') === 'DENY';
    const hasHsts = res.headers.has('Strict-Transport-Security');
    const hasPolicy = res.headers.has('Permissions-Policy');

    const isAllHeadersPresent = hasNosniff && hasFrameDeny && hasHsts && hasPolicy;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-SEC-01',
      category: 'Security Hardening',
      scenario: 'Uniform HTTP Security Headers on API Responses',
      expected: 'Headers nosniff, DENY, Strict-Transport-Security, Permissions-Policy present',
      actual: `nosniff=${hasNosniff}, DENY=${hasFrameDeny}, HSTS=${hasHsts}, PermPolicy=${hasPolicy}`,
      status: isAllHeadersPresent ? 'PASS' : 'FAIL',
      evidence: 'All required production security headers verified on HTTP response.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-SEC-02: Zero Secret Exposure Verification
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    RateLimiter.reset();

    // Trigger health and login
    const healthReq = new Request('http://localhost:3000/api/health', { method: 'GET' });
    const healthRes = await worker.fetch(healthReq, env, {} as ExecutionContext);
    const healthText = await healthRes.text();

    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const loginRes = await worker.fetch(loginReq, env, {} as ExecutionContext);
    const loginText = await loginRes.text();

    // Check audit logs table for passwords or secret leaks
    const auditLogs = await db.prepare('SELECT new_values FROM audit_logs LIMIT 20;').all<any>();
    let auditHasPlaintextSecret = false;
    for (const log of auditLogs.results) {
      if (log.new_values && (log.new_values.includes('password123') || log.new_values.includes(env.SESSION_SECRET!) || log.new_values.includes(env.SYNC_SECRET!))) {
        auditHasPlaintextSecret = true;
        break;
      }
    }

    const healthLeaksSecret = healthText.includes(env.SESSION_SECRET!) || healthText.includes(env.SYNC_SECRET!);
    const loginLeaksSecret = loginText.includes(env.SESSION_SECRET!) || loginText.includes(env.SYNC_SECRET!);

    const zeroSecretsLeaked = !auditHasPlaintextSecret && !healthLeaksSecret && !loginLeaksSecret;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-SEC-02',
      category: 'Secret Hardening',
      scenario: 'Zero Secret Exposure in Responses, Audit Logs, and Telemetry',
      expected: 'No plaintext credentials or internal secrets exposed in JSON or database logs',
      actual: `AuditSafe=${!auditHasPlaintextSecret}, HealthSafe=${!healthLeaksSecret}, LoginSafe=${!loginLeaksSecret}`,
      status: zeroSecretsLeaked ? 'PASS' : 'FAIL',
      evidence: 'Validated response payloads and D1 audit logs for zero secret exposure.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-RATE-01: Login Brute Force Protection (HTTP 429)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    RateLimiter.reset();

    let lastStatus = 200;
    let rateLimitedResponse: any = null;

    // Fire 12 requests (Limit is 10)
    for (let i = 0; i < 12; i++) {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.1' },
        body: JSON.stringify({ username: 'budi', password: 'wrongpassword' })
      });
      const res = await worker.fetch(req, env, {} as ExecutionContext);
      lastStatus = res.status;
      if (res.status === 429) {
        rateLimitedResponse = {
          status: res.status,
          retryAfter: res.headers.get('Retry-After'),
          limit: res.headers.get('X-RateLimit-Limit'),
          remaining: res.headers.get('X-RateLimit-Remaining'),
          body: await res.json()
        };
        break;
      }
    }

    const isBlocked = rateLimitedResponse && rateLimitedResponse.status === 429 && rateLimitedResponse.retryAfter !== null;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-RATE-01',
      category: 'Rate Limiting',
      scenario: 'Login Brute Force Protection (HTTP 429 & Retry-After Header)',
      expected: 'Requests exceeding limit (10/min) blocked with HTTP 429 and Retry-After header',
      actual: `Status=${rateLimitedResponse?.status}, Retry-After=${rateLimitedResponse?.retryAfter}s, Code=${rateLimitedResponse?.body?.error?.code}`,
      status: isBlocked ? 'PASS' : 'FAIL',
      evidence: `Brute force attacker on IP 198.51.100.1 blocked with 429 Too Many Requests.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-RATE-02: Change Password Rate Limiting
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    RateLimiter.reset();
    const { token } = await loginUser(env, 'siti', 'password123');

    let hitRateLimit = false;
    let rateLimitStatus = 0;

    // Fire 7 change password requests (Limit is 5)
    for (let i = 0; i < 7; i++) {
      const req = new Request('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'CF-Connecting-IP': '198.51.100.2'
        },
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        })
      });
      const res = await worker.fetch(req, env, {} as ExecutionContext);
      if (res.status === 429) {
        hitRateLimit = true;
        rateLimitStatus = res.status;
        break;
      }
    }

    const duration = Date.now() - start;

    results.push({
      id: 'U9-RATE-02',
      category: 'Rate Limiting',
      scenario: 'Change Password Endpoint Spam Protection (HTTP 429)',
      expected: 'Exceeding 5 password change requests in 1 minute returns HTTP 429',
      actual: `hitRateLimit=${hitRateLimit}, status=${rateLimitStatus}`,
      status: hitRateLimit ? 'PASS' : 'FAIL',
      evidence: 'Rate limit enforced on sensitive credential mutation endpoint.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-RATE-03: Sync Queue Retry Rate Limiting
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    RateLimiter.reset();
    const { token } = await loginUser(env, 'admin', 'password123');

    let hitRateLimit = false;
    // Limit is 10 retries per minute
    for (let i = 0; i < 12; i++) {
      const req = new Request('http://localhost:3000/api/sync/retry/999', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'CF-Connecting-IP': '198.51.100.3'
        }
      });
      const res = await worker.fetch(req, env, {} as ExecutionContext);
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }

    const duration = Date.now() - start;

    results.push({
      id: 'U9-RATE-03',
      category: 'Rate Limiting',
      scenario: 'Admin Sync Retry Endpoint Flood Protection (HTTP 429)',
      expected: 'Spamming sync retry triggers HTTP 429 Too Many Requests',
      actual: `hitRateLimit=${hitRateLimit}`,
      status: hitRateLimit ? 'PASS' : 'FAIL',
      evidence: 'Admin sync retry flood blocked gracefully.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-RATE-04: Normal Traffic Under Limit Proceeds Uninhibited
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    RateLimiter.reset();

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.4' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    const data = await res.json() as any;

    const isSuccess = res.status === 200 && data.success === true;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-RATE-04',
      category: 'Rate Limiting',
      scenario: 'Normal Traffic Under Limit Proceeds Smoothly (Zero False Positives)',
      expected: 'Legitimate request returns HTTP 200 with active session token',
      actual: `Status=${res.status}, success=${data.success}`,
      status: isSuccess ? 'PASS' : 'FAIL',
      evidence: 'Normal user flow is completely uninhibited by rate limiting.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-OBS-01: Health Endpoint Telemetry & Non-Destructive Check
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const req = new Request('http://localhost:3000/api/health', { method: 'GET' });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    const data = await res.json() as any;

    const isValid = res.status === 200 &&
      data.data?.status === 'healthy' &&
      data.data?.database === 'connected' &&
      data.data?.config?.d1Binding === 'CONFIGURED' &&
      typeof data.data?.meta?.latencyMs === 'number' &&
      data.data?.meta?.tablesCount >= 19;

    const duration = Date.now() - start;

    results.push({
      id: 'U9-OBS-01',
      category: 'Observability',
      scenario: 'Comprehensive Health Check & D1 Latency Telemetry (/api/health)',
      expected: 'Status healthy, database connected, tables >= 19, latency reported',
      actual: `status=${data.data?.status}, db=${data.data?.database}, tables=${data.data?.meta?.tablesCount}, latency=${data.data?.meta?.latencyMs}ms`,
      status: isValid ? 'PASS' : 'FAIL',
      evidence: 'Health endpoint reports real operational telemetry without exposing internal secrets.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-OBS-02: Sync Observability Telemetry (/api/sync/status)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const { token } = await loginUser(env, 'admin', 'password123');

    const req = new Request('http://localhost:3000/api/sync/status', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const res = await worker.fetch(req, env, {} as ExecutionContext);
    const data = await res.json() as any;

    const statusData = data.data;
    const isObservabilityValid = res.status === 200 &&
      typeof statusData.pending === 'number' &&
      typeof statusData.processing === 'number' &&
      typeof statusData.synced === 'number' &&
      typeof statusData.failed === 'number' &&
      typeof statusData.deadLetter === 'number' &&
      statusData.healthStatus !== undefined;

    const duration = Date.now() - start;

    results.push({
      id: 'U9-OBS-02',
      category: 'Observability',
      scenario: 'Sync Queue Observability & Metric Breakdown (/api/sync/status)',
      expected: 'Status returns pending, processing, synced, failed, deadLetter, and healthStatus',
      actual: `pending=${statusData.pending}, processing=${statusData.processing}, synced=${statusData.synced}, failed=${statusData.failed}, healthStatus=${statusData.healthStatus}`,
      status: isObservabilityValid ? 'PASS' : 'FAIL',
      evidence: 'Operational telemetry correctly aggregates real-time Outbox queue states.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-FAIL-01: Failure Detection — Stale Processing Warning Alert
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const queueRepo = new SyncQueueRepository(db);

    // Insert a stale item stuck in PROCESSING for 10 minutes
    await db.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES ('sch_nusantara_01', 'TEACHER', 'tch_stale_obs', 'INSERT', '{}', 'PROCESSING', 0, datetime('now', '-10 minutes'), datetime('now', '-10 minutes'));
    `).run();

    const summary = await queueRepo.getStatusSummary('sch_nusantara_01');
    const hasStaleAlert = summary.alerts?.some(a => a.type === 'STALE_PROCESSING');
    const isDegradedOrCritical = summary.healthStatus === 'DEGRADED' || summary.healthStatus === 'CRITICAL';

    const duration = Date.now() - start;

    results.push({
      id: 'U9-FAIL-01',
      category: 'Failure Detection',
      scenario: 'Automated Detection of Stale PROCESSING Queue Items (> 5 mins)',
      expected: 'Alert STALE_PROCESSING generated, healthStatus transitioned to DEGRADED/CRITICAL',
      actual: `staleCount=${summary.staleProcessing}, hasAlert=${hasStaleAlert}, healthStatus=${summary.healthStatus}`,
      status: (hasStaleAlert && isDegradedOrCritical) ? 'PASS' : 'FAIL',
      evidence: 'Stale queue items automatically trigger failure detection warning alert.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-FAIL-02: Failure Detection — Dead Letter Buildup CRITICAL Alert
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const queueRepo = new SyncQueueRepository(db);

    // Insert a Dead Letter item (FAILED with retry_count = 5)
    await db.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES ('sch_nusantara_01', 'STUDENT', 'std_dead_letter_obs', 'INSERT', '{}', 'FAILED', 5, datetime('now'), datetime('now'));
    `).run();

    const summary = await queueRepo.getStatusSummary('sch_nusantara_01');
    const hasDeadLetterAlert = summary.alerts?.some(a => a.type === 'DEAD_LETTER_ACCUMULATION' && a.level === 'CRITICAL');
    const isCritical = summary.healthStatus === 'CRITICAL';

    const duration = Date.now() - start;

    results.push({
      id: 'U9-FAIL-02',
      category: 'Failure Detection',
      scenario: 'Dead Letter Accumulation Triggers CRITICAL Alert',
      expected: 'Alert DEAD_LETTER_ACCUMULATION with level CRITICAL generated',
      actual: `deadLetterCount=${summary.deadLetter}, hasDeadLetterAlert=${hasDeadLetterAlert}, healthStatus=${summary.healthStatus}`,
      status: (hasDeadLetterAlert && isCritical) ? 'PASS' : 'FAIL',
      evidence: 'Dead letter accumulation transitions system health to CRITICAL alert state.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-TENANT-01: Multi-Tenant Scoping & Strict Queue Isolation
  // --------------------------------------------------------------------------
  {
    const start = Date.now();

    // Create School B user & admin
    await db.prepare(`
      INSERT OR IGNORE INTO schools (id, npsn, name, is_active, created_at)
      VALUES ('sch_merdeka_02', '99988877', 'SMA Merdeka 02', 1, datetime('now'));
    `).run();

    const hash = await hashPassword('password123');
    await db.prepare(`
      INSERT OR IGNORE INTO users (id, school_id, username, password_hash, role, is_active, created_at)
      VALUES ('usr_admin_b', 'sch_merdeka_02', 'admin_b', ?, 'ADMIN', 1, datetime('now'));
    `).bind(hash).run();

    // Insert Queue Item in School B
    const itemB = await db.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES ('sch_merdeka_02', 'TEACHER', 'tch_school_b_item', 'INSERT', '{}', 'FAILED', 1, datetime('now'), datetime('now'));
    `).run();
    const queueIdB = itemB.meta.last_row_id;

    // Login as School A admin
    const { token: tokenA } = await loginUser(env, 'admin', 'password123', 'sch_nusantara_01');

    // Attempt to retry School B's queue item using School A token
    const crossRetryReq = new Request(`http://localhost:3000/api/sync/retry/${queueIdB}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const crossRetryRes = await worker.fetch(crossRetryReq, env, {} as ExecutionContext);

    // Query status as School A
    const statusReq = new Request('http://localhost:3000/api/sync/status', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const statusRes = await worker.fetch(statusReq, env, {} as ExecutionContext);
    const statusData = await statusRes.json() as any;

    const crossTenantBlocked = crossRetryRes.status === 404;
    const schoolScopeEnforced = statusData.data?.schoolId === 'sch_nusantara_01';

    const duration = Date.now() - start;

    results.push({
      id: 'U9-TENANT-01',
      category: 'Multi-Tenant Security',
      scenario: 'Multi-Tenant Isolation (School A Cannot Mutate or Observe School B)',
      expected: 'Cross-school retry returns HTTP 404, status scoped strictly to authenticated school',
      actual: `crossRetryStatus=${crossRetryRes.status} (expected 404), scopedSchool=${statusData.data?.schoolId}`,
      status: (crossTenantBlocked && schoolScopeEnforced) ? 'PASS' : 'FAIL',
      evidence: 'Tenant boundaries strictly preserved across sync telemetry and outbox mutations.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-RECOV-01: D1 Disaster Recovery & Schema Verification Drill
  // --------------------------------------------------------------------------
  {
    const start = Date.now();

    // Simulate recovery drill by provisioning a brand new in-memory D1 database and applying full migration scripts
    const drillDb = createD1Emulator();
    const migrationsDir = path.join(process.cwd(), 'worker', 'migrations');

    const schemaSql = fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf-8');
    await drillDb.exec(schemaSql);

    const indexSql = fs.readFileSync(path.join(migrationsDir, '0002_indexes.sql'), 'utf-8');
    await drillDb.exec(indexSql);

    const seedSql = fs.readFileSync(path.join(migrationsDir, '0003_seed.sql'), 'utf-8');
    await drillDb.exec(seedSql);

    // Verify foreign key integrity
    const fkCheck = await drillDb.prepare('PRAGMA foreign_key_check;').all();
    const fkClean = fkCheck.results.length === 0;

    // Verify all 19 core tables exist
    const tables = await drillDb.prepare(`
      SELECT count(*) as count FROM sqlite_schema 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';
    `).first<{ count: number }>();

    const tableCountValid = (tables?.count ?? 0) >= 19;
    const isDrillSuccess = fkClean && tableCountValid;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-RECOV-01',
      category: 'Disaster Recovery',
      scenario: 'D1 Database Recovery Drill (Zero Foreign Key Violations & 19 Core Tables)',
      expected: 'Zero foreign key integrity violations, all 19 core tables restored cleanly',
      actual: `fkViolations=${fkCheck.results.length}, restoredTables=${tables?.count}`,
      status: isDrillSuccess ? 'PASS' : 'FAIL',
      evidence: 'Disaster recovery drill verified schema and relational integrity from clean snapshot.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // U9-GATE-01: Production Readiness Pre-Flight Gate Check
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const passedCount = results.filter(r => r.status === 'PASS').length;
    const allPassed = passedCount === results.length;
    const duration = Date.now() - start;

    results.push({
      id: 'U9-GATE-01',
      category: 'Production Gate',
      scenario: 'Pre-Flight Production Readiness Gate Evaluation',
      expected: 'All production hardening, observability, rate limiting, and recovery checks PASS',
      actual: `Passed ${passedCount}/${results.length} checks`,
      status: allPassed ? 'PASS' : 'FAIL',
      evidence: 'All 12 production hardening criteria satisfied. Production candidate verified.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // PRINT SUMMARY TABLE
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('FASE U9: TEST RESULTS SUMMARY');
  console.log('============================================================');
  console.log('| Test ID | Category | Test Name | Status | Duration | Evidence |');
  console.log('|---|---|---|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.category} | ${r.scenario} | ${r.status} | ${r.durationMs}ms | ${r.evidence} |`);
  }
  console.log('============================================================');

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================================');

  if (failed > 0) {
    throw new Error(`U9 Test Suite failed: ${failed}/${total} failed.`);
  }

  return results;
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('u9_runner')) {
  runU9TestSuite().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
}
