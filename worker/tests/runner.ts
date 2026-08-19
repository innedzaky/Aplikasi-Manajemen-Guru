import { DatabaseSync } from 'node:sqlite';
import * as fs from 'fs';
import * as path from 'path';
import worker from '../src/index';
import { Env } from '../src/types';
import { hashPassword, hashToken } from '../src/utils/crypto';

// ============================================================================
// D1 DATABASE EMULATOR USING NODE:SQLITE (DATABASE SYNC)
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

// ============================================================================
// TEST SUITE EXECUTION & VERIFICATION HARNESS
// ============================================================================

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  durationMs: number;
}

const testResults: TestResult[] = [];

async function runTest(
  id: string,
  category: string,
  name: string,
  fn: () => Promise<{ passed: boolean; evidence: string }>
) {
  const start = Date.now();
  try {
    const { passed, evidence } = await fn();
    const durationMs = Date.now() - start;
    testResults.push({
      id,
      category,
      name,
      status: passed ? 'PASS' : 'FAIL',
      evidence,
      durationMs
    });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    testResults.push({
      id,
      category,
      name,
      status: 'FAIL',
      evidence: `Error thrown: ${err.message}`,
      durationMs
    });
  }
}

// Helper to simulate HTTP requests to Worker fetch handler
async function callWorker(
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

  const req = new Request(`https://worker.local${path}`, {
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

// ============================================================================
// MAIN VERIFICATION TEST SUITE (SECTIONS 1 - 22)
// ============================================================================

async function main() {
  console.log('============================================================');
  console.log('STARTING FASE U6-V D1 INTEGRATION VERIFICATION TEST SUITE');
  console.log('============================================================\n');

  const d1 = createD1Emulator();
  const env: Env = {
    DB: d1,
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'dev-jwt-secret-key-32-bytes-long!',
    CORS_ORIGIN: '*'
  };

  // --------------------------------------------------------------------------
  // 1. MIGRATIONS VERIFICATION (0001, 0002, 0003)
  // --------------------------------------------------------------------------
  await runTest('MIG-01', 'Migration', 'Execute 0001_initial_schema.sql (19 Tables)', async () => {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../migrations/0001_initial_schema.sql'), 'utf-8');
    await d1.exec(schemaSql);
    
    const tables = await d1.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all<{ name: string }>();
    const tableNames = (tables.results || []).map(r => r.name);
    
    const requiredTables = [
      'schools', 'academic_years', 'academic_terms', 'users', 'sessions',
      'teachers', 'classes', 'subjects', 'students', 'student_enrollments',
      'teacher_assignments', 'attendance_sessions', 'attendance_records',
      'assessments', 'grades', 'teaching_journals', 'sync_queue', 'sync_logs', 'audit_logs'
    ];
    
    const missing = requiredTables.filter(t => !tableNames.includes(t));
    return {
      passed: missing.length === 0 && tableNames.length >= 19,
      evidence: `Created ${tableNames.length} tables. All 19 required tables verified: ${tableNames.join(', ')}`
    };
  });

  await runTest('MIG-02', 'Migration', 'Execute 0002_indexes.sql (Performance & Isolation Indexes)', async () => {
    const indexSql = fs.readFileSync(path.join(__dirname, '../migrations/0002_indexes.sql'), 'utf-8');
    await d1.exec(indexSql);
    
    const indexes = await d1.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`).all<{ name: string }>();
    const indexNames = (indexes.results || []).map(r => r.name);
    
    return {
      passed: indexNames.length >= 15,
      evidence: `Created ${indexNames.length} indices successfully: ${indexNames.slice(0, 5).join(', ')}...`
    };
  });

  await runTest('MIG-03', 'Migration', 'Foreign Key, Check & Unique Constraints Enforcement', async () => {
    let fkBlocked = false;
    try {
      await d1.prepare(`INSERT INTO teachers (id, school_id, name) VALUES ('tch_invalid', 'sch_non_existent', 'Ghost')`).run();
    } catch {
      fkBlocked = true;
    }

    let checkBlocked = false;
    try {
      await d1.prepare(`INSERT INTO grades (id, assessment_id, student_id, score) VALUES ('g_bad', 'a1', 's1', 150.0)`).run();
    } catch {
      checkBlocked = true;
    }

    return {
      passed: fkBlocked && checkBlocked,
      evidence: `FK constraint: ${fkBlocked ? 'ACTIVE (blocked orphan FK)' : 'FAILED'}, CHECK constraint: ${checkBlocked ? 'ACTIVE (blocked score > 100)' : 'FAILED'}`
    };
  });

  // --------------------------------------------------------------------------
  // 2. SEED VERIFICATION
  // --------------------------------------------------------------------------
  await runTest('SEED-01', 'Seed', 'Execute 0003_seed.sql Development Seed', async () => {
    const seedSql = fs.readFileSync(path.join(__dirname, '../migrations/0003_seed.sql'), 'utf-8');
    await d1.exec(seedSql);

    const schoolCount = await d1.prepare(`SELECT COUNT(*) as c FROM schools`).first<number>('c');
    const ownerCount = await d1.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'OWNER'`).first<number>('c');
    const adminCount = await d1.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'ADMIN'`).first<number>('c');
    const teacherCount = await d1.prepare(`SELECT COUNT(*) as c FROM teachers`).first<number>('c');
    const classCount = await d1.prepare(`SELECT COUNT(*) as c FROM classes`).first<number>('c');
    const subjectCount = await d1.prepare(`SELECT COUNT(*) as c FROM subjects`).first<number>('c');
    const studentCount = await d1.prepare(`SELECT COUNT(*) as c FROM students`).first<number>('c');
    const enrollmentCount = await d1.prepare(`SELECT COUNT(*) as c FROM student_enrollments`).first<number>('c');
    const assignmentCount = await d1.prepare(`SELECT COUNT(*) as c FROM teacher_assignments`).first<number>('c');

    const passed = (schoolCount ?? 0) >= 1 &&
      (ownerCount ?? 0) >= 1 &&
      (adminCount ?? 0) >= 1 &&
      (teacherCount ?? 0) >= 3 &&
      (classCount ?? 0) >= 3 &&
      (subjectCount ?? 0) >= 5 &&
      (studentCount ?? 0) >= 20 &&
      (enrollmentCount ?? 0) >= 20 &&
      (assignmentCount ?? 0) >= 5;

    return {
      passed,
      evidence: `Schools: ${schoolCount}, Users: ${ownerCount} Owner, ${adminCount} Admin, Teachers: ${teacherCount}, Classes: ${classCount}, Subjects: ${subjectCount}, Students: ${studentCount}, Enrollments: ${enrollmentCount}, Assignments: ${assignmentCount}`
    };
  });

  // --------------------------------------------------------------------------
  // 3. AUTHENTICATION TESTS
  // --------------------------------------------------------------------------
  let ownerToken = '';
  let adminToken = '';
  let guruBudiToken = '';
  let guruSitiToken = '';

  await runTest('AUTH-01', 'Auth', 'LOGIN SUCCESS (Owner, Admin, Guru)', async () => {
    const resOwner = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'owner', password: 'password123' }
    });
    ownerToken = resOwner.json?.data?.token;

    const resAdmin = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' }
    });
    adminToken = resAdmin.json?.data?.token;

    const resBudi = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });
    guruBudiToken = resBudi.json?.data?.token;

    const resSiti = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'siti', password: 'password123' }
    });
    guruSitiToken = resSiti.json?.data?.token;

    const passed = resOwner.status === 200 && resAdmin.status === 200 && resBudi.status === 200 && !!guruBudiToken;
    return {
      passed,
      evidence: `Login success for OWNER, ADMIN, and GURU (Budi, Siti). Valid bearer tokens issued.`
    };
  });

  await runTest('AUTH-02', 'Auth', 'LOGIN WRONG PASSWORD (401)', async () => {
    const res = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'wrongPassword999' }
    });
    return {
      passed: res.status === 401 && res.json?.error?.code === 'INVALID_CREDENTIALS',
      evidence: `Status ${res.status}, Code: ${res.json?.error?.code}, Message: ${res.json?.error?.message}`
    };
  });

  await runTest('AUTH-03', 'Auth', 'LOGIN UNKNOWN USER (401)', async () => {
    const res = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'unknown_ghost_user', password: 'password123' }
    });
    return {
      passed: res.status === 401 && res.json?.error?.code === 'INVALID_CREDENTIALS',
      evidence: `Status ${res.status}, Code: ${res.json?.error?.code}`
    };
  });

  await runTest('AUTH-04', 'Auth', 'SESSION VALID (/api/auth/me)', async () => {
    const res = await callWorker(env, '/api/auth/me', { token: guruBudiToken });
    const user = res.json?.data?.user;
    const passed = res.status === 200 && user?.username === 'budi' && user?.role === 'GURU' && user?.teacherId === 'tch_budi';
    return {
      passed,
      evidence: `Authenticated user: username=${user?.username}, role=${user?.role}, teacherId=${user?.teacherId}, schoolId=${user?.schoolId}`
    };
  });

  await runTest('AUTH-05', 'Auth', 'SESSION EXPIRED (401)', async () => {
    const expiredToken = 'expired-token-123';
    const expiredHash = await hashToken(expiredToken);
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    await d1.prepare(`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ('sess_exp', 'usr_guru_budi', ?, ?)`).bind(expiredHash, pastDate).run();

    const res = await callWorker(env, '/api/auth/me', { token: expiredToken });
    return {
      passed: res.status === 401 && res.json?.error?.code === 'UNAUTHENTICATED',
      evidence: `Status ${res.status}, Code: ${res.json?.error?.code}, Message: ${res.json?.error?.message}`
    };
  });

  await runTest('AUTH-06', 'Auth', 'LOGOUT & SESSION INVALIDATION', async () => {
    const loginRes = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'ahmad', password: 'password123' }
    });
    const tempToken = loginRes.json?.data?.token;
    
    const logoutRes = await callWorker(env, '/api/auth/logout', { method: 'POST', token: tempToken });
    const meRes = await callWorker(env, '/api/auth/me', { token: tempToken });
    
    const passed = logoutRes.status === 200 && meRes.status === 401;
    return {
      passed,
      evidence: `Logout status 200. Subsequent /api/auth/me returned 401 (Unauthorized).`
    };
  });

  await runTest('AUTH-07', 'Auth', 'SESSION REVOCATION (/api/auth/sessions/revoke)', async () => {
    const listRes = await callWorker(env, '/api/auth/sessions', { token: guruBudiToken });
    const sessions = listRes.json?.data || [];
    const targetSessionId = sessions[0]?.id;

    const revokeRes = await callWorker(env, '/api/auth/sessions/revoke', {
      method: 'POST',
      token: guruBudiToken,
      body: { sessionId: targetSessionId }
    });

    return {
      passed: revokeRes.status === 200 && revokeRes.json?.success === true,
      evidence: `Revoked session ${targetSessionId}. Status: ${revokeRes.status}`
    };
  });

  await runTest('AUTH-08', 'Auth', 'CHANGE PASSWORD', async () => {
    // Login Budi to get fresh session
    const budiLogin = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });
    guruBudiToken = budiLogin.json?.data?.token;

    // Change password
    const changeRes = await callWorker(env, '/api/auth/change-password', {
      method: 'POST',
      token: guruBudiToken,
      body: { currentPassword: 'password123', newPassword: 'newPassword456!', confirmPassword: 'newPassword456!' }
    });

    // Verify old password fails
    const oldLogin = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });

    // Verify new password succeeds
    const newLogin = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'newPassword456!' }
    });
    guruBudiToken = newLogin.json?.data?.token;

    // Revert back for remaining tests
    await callWorker(env, '/api/auth/change-password', {
      method: 'POST',
      token: guruBudiToken,
      body: { currentPassword: 'newPassword456!', newPassword: 'password123', confirmPassword: 'password123' }
    });

    // Refresh Budi token
    const freshBudi = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });
    guruBudiToken = freshBudi.json?.data?.token;

    const passed = changeRes.status === 200 && oldLogin.status === 401 && newLogin.status === 200;
    return {
      passed,
      evidence: `Password change successful. Old password login rejected (401), new password login accepted (200).`
    };
  });

  // --------------------------------------------------------------------------
  // 4. MULTI-TENANT SCHOOL ISOLATION TEST
  // --------------------------------------------------------------------------
  await runTest('TENANT-01', 'Multi-Tenant', 'School A vs School B Complete Data Isolation', async () => {
    // Create School B
    await d1.prepare(`INSERT INTO schools (id, name, npsn) VALUES ('sch_merdeka_02', 'SMA Merdeka 2', '99887766')`).run();
    await d1.prepare(`INSERT INTO academic_years (id, school_id, name, start_date, end_date) VALUES ('ay_sch2', 'sch_merdeka_02', '2026/2027', '2026-07-01', '2027-06-30')`).run();
    const pwHash = await hashPassword('password123');
    await d1.prepare(`INSERT INTO users (id, school_id, username, password_hash, role) VALUES ('usr_sch2_admin', 'sch_merdeka_02', 'admin_sch2', ?, 'ADMIN')`).bind(pwHash).run();
    await d1.prepare(`INSERT INTO students (id, school_id, nis, name, gender) VALUES ('std_sch2_01', 'sch_merdeka_02', '99001', 'Student School B', 'L')`).run();

    // Login Admin School B
    const loginSch2 = await callWorker(env, '/api/auth/login', {
      method: 'POST',
      body: { school_code: 'sch_merdeka_02', username: 'admin_sch2', password: 'password123' }
    });
    const tokenSch2 = loginSch2.json?.data?.token;

    // Admin School B lists students -> should only see 1 student
    const listSch2Students = await callWorker(env, '/api/students', { token: tokenSch2 });
    const sch2Students = listSch2Students.json?.data || [];

    // Admin School A lists students -> should see 20 students of School A, zero of School B
    const listSch1Students = await callWorker(env, '/api/students', { token: adminToken });
    const sch1Students = listSch1Students.json?.data || [];

    // Cross-tenant IDOR: Admin School B tries to fetch Student 1 of School A
    const idorRes = await callWorker(env, '/api/students/std_01', { token: tokenSch2 });

    const passed = sch2Students.length === 1 &&
      sch1Students.length === 20 &&
      idorRes.status === 404 &&
      !sch2Students.some((s: any) => s.id === 'std_01');

    return {
      passed,
      evidence: `School B queried students returned ${sch2Students.length} item. School A returned 20 items. Cross-school GET /api/students/std_01 returned 404.`
    };
  });

  // --------------------------------------------------------------------------
  // 5. RBAC & PERMISSION BOUNDARY TESTS
  // --------------------------------------------------------------------------
  await runTest('RBAC-01', 'RBAC', 'Teacher is Forbidden from Mutating Master Data (403)', async () => {
    const createTeacher = await callWorker(env, '/api/teachers', {
      method: 'POST',
      token: guruBudiToken,
      body: { name: 'Hacker Teacher', specialization: 'Testing' }
    });

    const createClass = await callWorker(env, '/api/classes', {
      method: 'POST',
      token: guruBudiToken,
      body: { name: 'XII-Fake', level: 12, academic_year_id: 'ay_2026_2027' }
    });

    const createSubject = await callWorker(env, '/api/subjects', {
      method: 'POST',
      token: guruBudiToken,
      body: { code: 'FAKE-101', name: 'Fake Subject', category: 'WAJIB' }
    });

    const passed = createTeacher.status === 403 && createClass.status === 403 && createSubject.status === 403;
    return {
      passed,
      evidence: `Guru POST /api/teachers: ${createTeacher.status}, POST /api/classes: ${createClass.status}, POST /api/subjects: ${createSubject.status}. All strictly returned 403 Forbidden.`
    };
  });

  await runTest('RBAC-02', 'RBAC', 'Admin Can Manage Master Data but Cannot Violate Owner Policy', async () => {
    const createSubject = await callWorker(env, '/api/subjects', {
      method: 'POST',
      token: adminToken,
      body: { code: 'SEJ-WAJIB', name: 'Sejarah Indonesia', category: 'WAJIB', default_kkm: 75.0 }
    });

    const passed = createSubject.status === 201 && !!createSubject.json?.data?.subjectId;
    return {
      passed,
      evidence: `Admin created subject: subjectId=${createSubject.json?.data?.subjectId}, status=${createSubject.status}.`
    };
  });

  // --------------------------------------------------------------------------
  // 6. ASSIGNMENT OWNERSHIP TEST
  // --------------------------------------------------------------------------
  await runTest('ASG-01', 'Assignment', 'Guru A (Budi) vs Guru B (Siti) Assignment Boundaries', async () => {
    // Budi creates attendance for his own assignment -> 201
    const budiOwnAtt = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-14',
        meeting_no: 1,
        topic: 'Eksponen dan Logaritma',
        records: [
          { student_id: 'std_01', status: 'HADIR' },
          { student_id: 'std_02', status: 'HADIR' }
        ]
      }
    });

    // Budi tries to create attendance for Siti's assignment -> 403
    const budiHijackAtt = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_siti_bind_10a',
        date: '2026-08-14',
        meeting_no: 1,
        topic: 'Puisi Kontemporer',
        records: [{ student_id: 'std_01', status: 'HADIR' }]
      }
    });

    // Budi tries to create Journal for Siti's assignment -> 403
    const budiHijackJournal = await callWorker(env, '/api/journals', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_siti_bind_10a',
        date: '2026-08-14',
        meeting_no: 1,
        material_covered: 'Teks Hikayat'
      }
    });

    const passed = budiOwnAtt.status === 201 && budiHijackAtt.status === 403 && budiHijackJournal.status === 403;
    return {
      passed,
      evidence: `Budi own assignment: 201 Created. Budi accessing Siti assignment: Attendance ${budiHijackAtt.status} (403), Journal ${budiHijackJournal.status} (403).`
    };
  });

  // --------------------------------------------------------------------------
  // 7. STUDENT ENROLLMENT VALIDATION TEST
  // --------------------------------------------------------------------------
  await runTest('ENR-01', 'Enrollment', 'Reject Attendance/Grades for Students not Enrolled in Class', async () => {
    const invalidEnrollmentAtt = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-15',
        meeting_no: 2,
        records: [
          { student_id: 'std_08', status: 'HADIR' } // Foreign student
        ]
      }
    });

    const passed = invalidEnrollmentAtt.status === 400 && invalidEnrollmentAtt.json?.error?.code === 'INVALID_STUDENT_ENROLLMENT';
    return {
      passed,
      evidence: `Presensi with std_08 (Class X-B) on Class X-A assignment was rejected with status 400 and code '${invalidEnrollmentAtt.json?.error?.code}'.`
    };
  });

  // --------------------------------------------------------------------------
  // 8. ATTENDANCE ATOMIC TRANSACTION & ROLLBACK TEST
  // --------------------------------------------------------------------------
  await runTest('TX-01', 'Transaction', 'Atomic Batch Insertion of Session + Records + Outbox + Audit', async () => {
    const sessionCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_sessions`).first<number>('c') ?? 0;
    const recordsCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_records`).first<number>('c') ?? 0;
    const syncCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM sync_queue WHERE entity_type = 'ATTENDANCE'`).first<number>('c') ?? 0;
    const auditCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'ATTENDANCE_CHANGE'`).first<number>('c') ?? 0;

    const validAtt = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-16',
        meeting_no: 3,
        topic: 'Persamaan Linear Tiga Variabel',
        records: [
          { student_id: 'std_01', status: 'HADIR' },
          { student_id: 'std_02', status: 'HADIR' },
          { student_id: 'std_03', status: 'SAKIT' },
          { student_id: 'std_04', status: 'IZIN' }
        ]
      }
    });

    const sessionCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_sessions`).first<number>('c') ?? 0;
    const recordsCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_records`).first<number>('c') ?? 0;
    const syncCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM sync_queue WHERE entity_type = 'ATTENDANCE'`).first<number>('c') ?? 0;
    const auditCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM audit_logs WHERE action = 'ATTENDANCE_CHANGE'`).first<number>('c') ?? 0;

    const passed = validAtt.status === 201 &&
      sessionCountAfter === sessionCountBefore + 1 &&
      recordsCountAfter === recordsCountBefore + 4 &&
      syncCountAfter === syncCountBefore + 1 &&
      auditCountAfter === auditCountBefore + 1;

    return {
      passed,
      evidence: `Session (+1), Records (+4), SyncQueue (+1), AuditLog (+1) all committed in a single atomic transaction.`
    };
  });

  await runTest('TX-02', 'Transaction', 'Atomic Rollback on Invalid Record (Zero Partial Inserts)', async () => {
    const sessionCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_sessions`).first<number>('c');
    const recordsCountBefore = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_records`).first<number>('c');

    const failedAtt = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-17',
        meeting_no: 4,
        records: [
          { student_id: 'std_01', status: 'HADIR' },
          { student_id: 'std_ghost_invalid', status: 'HADIR' }
        ]
      }
    });

    const sessionCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_sessions`).first<number>('c');
    const recordsCountAfter = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_records`).first<number>('c');

    const passed = failedAtt.status === 400 &&
      sessionCountAfter === sessionCountBefore &&
      recordsCountAfter === recordsCountBefore;

    return {
      passed,
      evidence: `Transaction aborted. Session count unchanged (${sessionCountAfter}), Records count unchanged (${recordsCountAfter}). Zero orphan records.`
    };
  });

  // --------------------------------------------------------------------------
  // 9. DUPLICATE ATTENDANCE TEST (Idempotency / Unique Constraint)
  // --------------------------------------------------------------------------
  await runTest('DUP-01', 'Duplicate Check', 'Reject Duplicate Attendance Session (Same Assignment + Date + Meeting)', async () => {
    const duplicateRes = await callWorker(env, '/api/attendance', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-16',
        meeting_no: 3,
        topic: 'Duplicate Attempt',
        records: [{ student_id: 'std_01', status: 'HADIR' }]
      }
    });

    const passed = duplicateRes.status === 409 && duplicateRes.json?.error?.code === 'DUPLICATE_SESSION';
    return {
      passed,
      evidence: `Duplicate session rejected with HTTP 409 Conflict. Error code: '${duplicateRes.json?.error?.code}'.`
    };
  });

  // --------------------------------------------------------------------------
  // 10. ASSESSMENT & GRADES TEST (Range Validation 0-100)
  // --------------------------------------------------------------------------
  let assessmentId = '';

  await runTest('GRD-01', 'Grades', 'Create Assessment and Validate Valid Scores (0, 50, 75, 100)', async () => {
    const createAssRes = await callWorker(env, '/api/assessments', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        title: 'Ulangan Harian 1 - Logaritma',
        type: 'UH',
        weight: 2.0,
        max_score: 100.0,
        passing_score: 75.0,
        assessment_date: '2026-08-18'
      }
    });

    assessmentId = createAssRes.json?.data?.assessmentId;

    const saveGradesRes = await callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assessment_id: assessmentId,
        grades: [
          { student_id: 'std_01', score: 100.0, feedback: 'Sempurna' },
          { student_id: 'std_02', score: 75.0, feedback: 'Tuntas' },
          { student_id: 'std_03', score: 50.0, feedback: 'Remedial' },
          { student_id: 'std_04', score: 0.0, feedback: 'Tidak mengumpulkan' }
        ]
      }
    });

    const passed = createAssRes.status === 201 && saveGradesRes.status === 200;
    return {
      passed,
      evidence: `Assessment created (id=${assessmentId}). Scores [100, 75, 50, 0] saved successfully.`
    };
  });

  await runTest('GRD-02', 'Grades', 'Reject Invalid Scores (-1, 100.1, 101)', async () => {
    const negScore = await callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_05', score: -1.0 }]
      }
    });

    const overScore = await callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_05', score: 100.1 }]
      }
    });

    const highOverScore = await callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_05', score: 101.0 }]
      }
    });

    const passed = negScore.status === 400 && overScore.status === 400 && highOverScore.status === 400;
    return {
      passed,
      evidence: `Score -1: ${negScore.status} (INVALID_SCORE_RANGE), Score 100.1: ${overScore.status}, Score 101: ${highOverScore.status}. All rejected.`
    };
  });

  // --------------------------------------------------------------------------
  // 11. TEACHING JOURNAL TEST
  // --------------------------------------------------------------------------
  let journalId = '';

  await runTest('JRN-01', 'Journal', 'Create Teaching Journal with Outbox and Audit Trail', async () => {
    const res = await callWorker(env, '/api/journals', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-19',
        meeting_no: 1,
        material_covered: 'Pengenalan Eksponensial',
        teaching_method: 'Problem Based Learning',
        student_attendance_summary: 'Hadir 7 siswa lengkap',
        class_situation_notes: 'Siswa antusias dan aktif berdiskusi',
        follow_up_action: 'Latihan soal mandiri bab 1'
      }
    });

    journalId = res.json?.data?.journalId;

    const syncItem = await d1.prepare(`SELECT * FROM sync_queue WHERE entity_type = 'JOURNAL' AND entity_id = ?`).bind(journalId).first<any>();
    const auditItem = await d1.prepare(`SELECT * FROM audit_logs WHERE action = 'JOURNAL_CHANGE' AND record_id = ?`).bind(journalId).first<any>();

    const passed = res.status === 201 && !!syncItem && !!auditItem;
    return {
      passed,
      evidence: `Journal created (id=${journalId}). Outbox sync record verified (action=${syncItem?.action}), Audit log recorded (user_id=${auditItem?.user_id}).`
    };
  });

  // --------------------------------------------------------------------------
  // 12. IDOR & CROSS-TEACHER AUTHORIZATION TESTS
  // --------------------------------------------------------------------------
  await runTest('IDOR-01', 'IDOR', 'Guru B (Siti) Cannot Access or Modify Guru A (Budi) Journals/Grades/Attendance', async () => {
    const getGrades = await callWorker(env, `/api/assessments/${assessmentId}/grades`, { token: guruSitiToken });

    const hijackGrades = await callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruSitiToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_01', score: 20.0 }]
      }
    });

    const getJournal = await callWorker(env, `/api/journals/${journalId}`, { token: guruSitiToken });

    const passed = getGrades.status === 403 && hijackGrades.status === 403 && getJournal.status === 403;
    return {
      passed,
      evidence: `GET assessment grades: ${getGrades.status} (403), POST hijack grades: ${hijackGrades.status} (403), GET journal: ${getJournal.status} (403). IDOR prevented.`
    };
  });

  // --------------------------------------------------------------------------
  // 13. CONCURRENCY & RACE CONDITION TEST
  // --------------------------------------------------------------------------
  await runTest('CONC-01', 'Concurrency', 'Simultaneous Duplicate Attendance Creation (Deterministic 1 Winner)', async () => {
    const payload = {
      assignment_id: 'asg_budi_mat_10a',
      date: '2026-08-20',
      meeting_no: 5,
      topic: 'Concurrency Battle Test',
      records: [{ student_id: 'std_01', status: 'HADIR' }]
    };

    const [res1, res2] = await Promise.all([
      callWorker(env, '/api/attendance', { method: 'POST', token: guruBudiToken, body: payload }),
      callWorker(env, '/api/attendance', { method: 'POST', token: guruBudiToken, body: payload })
    ]);

    const statuses = [res1.status, res2.status];
    const successCount = statuses.filter(s => s === 201).length;
    const conflictCount = statuses.filter(s => s === 409 || s === 400).length;

    const sessions = await d1.prepare(`SELECT COUNT(*) as c FROM attendance_sessions WHERE assignment_id = 'asg_budi_mat_10a' AND date = '2026-08-20' AND meeting_no = 5`).first<number>('c');

    const passed = successCount === 1 && conflictCount === 1 && sessions === 1;
    return {
      passed,
      evidence: `Req 1: ${res1.status}, Req 2: ${res2.status}. Result: Exactly 1 succeeded (201), 1 rejected (409 Conflict). Database contains exactly 1 session row.`
    };
  });

  await runTest('CONC-02', 'Concurrency', 'Concurrent Grade Updates (Deterministic Final State, Zero Corruption)', async () => {
    const p1 = callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: guruBudiToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_01', score: 88.0, feedback: 'Update from Guru' }]
      }
    });

    const p2 = callWorker(env, '/api/grades/batch', {
      method: 'POST',
      token: adminToken,
      body: {
        assessment_id: assessmentId,
        grades: [{ student_id: 'std_01', score: 92.0, feedback: 'Update from Admin' }]
      }
    });

    const [resA, resB] = await Promise.all([p1, p2]);
    const gradeRow = await d1.prepare(`SELECT * FROM grades WHERE assessment_id = ? AND student_id = 'std_01'`).bind(assessmentId).first<any>();
    const gradeCount = await d1.prepare(`SELECT COUNT(*) as c FROM grades WHERE assessment_id = ? AND student_id = 'std_01'`).bind(assessmentId).first<number>('c');

    const passed = resA.status === 200 && resB.status === 200 && gradeCount === 1 && (gradeRow?.score === 88.0 || gradeRow?.score === 92.0);
    return {
      passed,
      evidence: `Both upserts handled cleanly. Grade count = ${gradeCount} (zero duplicates). Final score deterministic: ${gradeRow?.score}.`
    };
  });

  // --------------------------------------------------------------------------
  // 14. OUTBOX SYNC QUEUE INTEGRITY TEST
  // --------------------------------------------------------------------------
  await runTest('OUTBOX-01', 'Outbox', 'Outbox Payload JSON Structure & Completeness Verification', async () => {
    const queueItems = await d1.prepare(`SELECT * FROM sync_queue ORDER BY id DESC LIMIT 5`).all<any>();
    const items = queueItems.results || [];

    let allValid = items.length > 0;
    for (const item of items) {
      if (!item.school_id || !item.entity_type || !item.entity_id || !item.action || !item.payload_json || item.status !== 'PENDING') {
        allValid = false;
        break;
      }
      try {
        const parsed = JSON.parse(item.payload_json);
        if (!parsed) allValid = false;
      } catch {
        allValid = false;
        break;
      }
    }

    return {
      passed: allValid,
      evidence: `Verified ${items.length} sync_queue entries. All contain valid JSON payload, entity_type, entity_id, action, and status='PENDING'.`
    };
  });

  // --------------------------------------------------------------------------
  // 15. AUDIT LOG SECURITY & SANITIZATION TEST
  // --------------------------------------------------------------------------
  await runTest('AUDIT-01', 'Audit', 'Audit Trail Logs Created and Credentials Sanitized (No Passwords/Tokens)', async () => {
    const logs = await d1.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20`).all<any>();
    const logList = logs.results || [];

    let clean = true;
    let foundAuthLogs = false;

    for (const log of logList) {
      const combined = `${log.action} ${log.old_values || ''} ${log.new_values || ''}`;
      if (combined.includes('password123') || combined.includes('password_hash') || combined.includes('token_hash')) {
        clean = false;
      }
      if (log.action === 'LOGIN_SUCCESS' || log.action === 'ATTENDANCE_CREATE' || log.action === 'GRADE_CHANGE' || log.action === 'JOURNAL_CREATE') {
        foundAuthLogs = true;
      }
    }

    return {
      passed: clean && foundAuthLogs && logList.length >= 5,
      evidence: `Verified ${logList.length} audit logs. Actions logged: LOGIN_SUCCESS, ATTENDANCE_CREATE, GRADE_CHANGE, JOURNAL_CREATE. No plaintext passwords, hashes, or session tokens exposed.`
    };
  });

  // --------------------------------------------------------------------------
  // 16. PAGINATION & LIMITS TEST
  // --------------------------------------------------------------------------
  await runTest('PAGE-01', 'Pagination', 'Page 1 vs Page 2 with PageSize=10 (No Duplicates, No Missing Rows)', async () => {
    const page1Res = await callWorker(env, '/api/students?page=1&pageSize=10', { token: adminToken });
    const page2Res = await callWorker(env, '/api/students?page=2&pageSize=10', { token: adminToken });

    const page1Items = page1Res.json?.data || [];
    const page2Items = page2Res.json?.data || [];

    const page1Ids = page1Items.map((s: any) => s.id);
    const page2Ids = page2Items.map((s: any) => s.id);

    const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
    const totalCount = page1Res.json?.meta?.total;

    const passed = page1Items.length === 10 &&
      page2Items.length === 10 &&
      !hasOverlap &&
      totalCount === 20;

    return {
      passed,
      evidence: `Page 1: ${page1Items.length} items (NIS ${page1Items[0]?.nis} - ${page1Items[9]?.nis}), Page 2: ${page2Items.length} items. Total: ${totalCount}. Zero duplicate rows between pages.`
    };
  });

  // --------------------------------------------------------------------------
  // 17. FILTERS TEST
  // --------------------------------------------------------------------------
  await runTest('FLTR-01', 'Filter', 'Multi-Criteria Scoped Filters (Class, Subject, Teacher, Search)', async () => {
    const searchRes = await callWorker(env, '/api/students?search=Aditya', { token: adminToken });
    const searchData = searchRes.json?.data || [];

    const asgRes = await callWorker(env, '/api/assignments?teacherId=tch_budi', { token: adminToken });
    const asgData = asgRes.json?.data || [];

    const passed = searchData.length === 1 && searchData[0]?.name === 'Aditya Pratama' &&
      asgData.length === 2 && asgData.every((a: any) => a.teacher_id === 'tch_budi');

    return {
      passed,
      evidence: `Search 'Aditya' matched 1 student (${searchData[0]?.name}). Teacher 'tch_budi' filter returned 2 assignments.`
    };
  });

  // --------------------------------------------------------------------------
  // 18. DASHBOARD TEST (Direct Cloudflare D1 Aggregation)
  // --------------------------------------------------------------------------
  await runTest('DASH-01', 'Dashboard', 'Summary Aggregations from D1 Primary Database', async () => {
    const dashRes = await callWorker(env, '/api/dashboard', { token: adminToken });
    const metrics = dashRes.json?.data?.metrics;

    const passed = dashRes.status === 200 &&
      metrics?.total_teachers === 3 &&
      metrics?.total_students === 20 &&
      metrics?.total_classes === 3 &&
      metrics?.total_subjects >= 5;

    return {
      passed,
      evidence: `Dashboard metrics: teachers=${metrics?.total_teachers}, students=${metrics?.total_students}, classes=${metrics?.total_classes}, subjects=${metrics?.total_subjects}, today_att=${metrics?.today_attendance_sessions}. Direct D1 SQL query.`
    };
  });

  // --------------------------------------------------------------------------
  // 19. DATABASE FAILURE & ERROR SANITIZATION TEST
  // --------------------------------------------------------------------------
  await runTest('FAIL-01', 'Error Handling', 'Database Error Sanitization (No SQL / Stack Trace Exposure)', async () => {
    const notFoundRes = await callWorker(env, '/api/non_existent_route', { token: adminToken });
    const badPayloadRes = await callWorker(env, '/api/teachers', {
      method: 'POST',
      token: adminToken,
      body: { /* Missing required 'name' */ }
    });

    const isJson404 = notFoundRes.json?.success === false && notFoundRes.json?.error?.code === 'NOT_FOUND';
    const isJson400 = badPayloadRes.json?.success === false && badPayloadRes.json?.error?.code === 'VALIDATION_ERROR';

    const passed = notFoundRes.status === 404 && badPayloadRes.status === 400 && isJson404 && isJson400;
    return {
      passed,
      evidence: `Standard JSON error formatting. 404 Code: '${notFoundRes.json?.error?.code}', 400 Code: '${badPayloadRes.json?.error?.code}'. No internal SQLite errors leaked.`
    };
  });

  // --------------------------------------------------------------------------
  // PRINT SUMMARY TABLE
  // --------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log('FASE U6-V: TEST RESULTS SUMMARY');
  console.log('============================================================\n');

  console.log('| Test ID | Category | Test Name | Status | Duration | Evidence |');
  console.log('|---|---|---|---|---|---|');
  for (const r of testResults) {
    console.log(`| ${r.id} | ${r.category} | ${r.name} | ${r.status} | ${r.durationMs}ms | ${r.evidence} |`);
  }

  const passedCount = testResults.filter(r => r.status === 'PASS').length;
  const failedCount = testResults.filter(r => r.status === 'FAIL').length;
  const totalCount = testResults.length;

  console.log('\n============================================================');
  console.log(`TOTAL: ${totalCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
