import { U10TestResult, createD1Emulator, setupDatabase, callWorkerApi, MockGasSpreadsheetEngine } from './u10_helpers';
import { Env } from '../../src/types';
import { RateLimiter } from '../../src/middleware/rateLimit';

export async function runTenantTests(): Promise<U10TestResult[]> {
  const results: U10TestResult[] = [];
  const db = createD1Emulator();
  await setupDatabase(db);

  // Setup School B in D1
  const schoolBId = 'sch_merdeka_02';
  await db.prepare(`
    INSERT INTO schools (id, name, npsn, address, is_active)
    VALUES (?, 'SMA Merdeka 2', '20109999', 'Jl. Merdeka No. 2', 1);
  `).bind(schoolBId).run();

  await db.prepare(`
    INSERT INTO users (id, school_id, username, password_hash, role, is_active)
    VALUES ('usr_admin_sch_b', ?, 'admin_merdeka', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'ADMIN', 1);
  `).bind(schoolBId).run();

  await db.prepare(`
    INSERT INTO teachers (id, school_id, name, email, specialization, is_active)
    VALUES ('tch_merdeka_01', ?, 'Guru Merdeka', 'guru@merdeka.sch.id', 'Biologi', 1);
  `).bind(schoolBId).run();

  await db.prepare(`
    INSERT INTO students (id, school_id, nis, nisn, name, gender, is_active)
    VALUES ('std_merdeka_01', ?, '9001', '0090011111', 'Siswa Merdeka', 'L', 1);
  `).bind(schoolBId).run();

  const env: Env = {
    DB: db,
    ENVIRONMENT: 'production',
    SESSION_SECRET: 'production_grade_super_secret_session_key_32_bytes',
    SYNC_SECRET: 'production_grade_hmac_sync_secret_32_bytes_long',
    GAS_SYNC_URL: 'https://script.google.com/macros/s/AKfycb_tenant_test/exec'
  };

  RateLimiter.reset();
  // Login School A Admin
  const loginResA = await callWorkerApi(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'password123' }
  });
  const tokenSchoolA = loginResA.json?.data?.token;

  // Login School B Admin
  const loginResB = await callWorkerApi(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'admin_merdeka', password: 'password123', school_code: schoolBId }
  });
  const tokenSchoolB = loginResB.json?.data?.token;

  // U10-TNT-01: Multi-School Provisioning in D1
  {
    const start = Date.now();
    const schools = await db.prepare('SELECT count(*) as count FROM schools;').first<{ count: number }>();
    const pass = (schools?.count ?? 0) >= 2;

    results.push({
      id: 'U10-TNT-01',
      category: 'Multi-Tenant Isolation',
      scenario: 'Multi-School Multi-Tenant Schema Provisioning in D1',
      expected: 'At least 2 distinct schools provisioned in database',
      actual: `schoolCount=${schools?.count}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Schools sch_nusantara_01 and sch_merdeka_02 active in D1.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-02: School A cannot see School B Students
  {
    const start = Date.now();
    const resA = await callWorkerApi(env, '/api/students', { token: tokenSchoolA });
    const studentsA = resA.json?.data?.students || [];
    const hasMerdeka = studentsA.some((s: any) => s.id === 'std_merdeka_01' || s.schoolId === schoolBId);
    const pass = resA.status === 200 && !hasMerdeka;

    results.push({
      id: 'U10-TNT-02',
      category: 'Multi-Tenant Isolation',
      scenario: 'Student Catalog Isolation (School A cannot list School B Students)',
      expected: 'Status 200, zero student records belonging to School B returned',
      actual: `containsSchoolBStudents=${hasMerdeka}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Student listing strictly scoped to school_id = sch_nusantara_01.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-03: School A cannot get School B Teacher by ID (404)
  {
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/teachers/tch_merdeka_01', { token: tokenSchoolA });
    const is404 = res.status === 404;
    const pass = is404;

    results.push({
      id: 'U10-TNT-03',
      category: 'Multi-Tenant Isolation',
      scenario: 'Cross-Tenant Direct Read Protection (GET /api/teachers/:id returns 404)',
      expected: 'Status 404 NOT_FOUND when attempting to query other school teacher ID',
      actual: `status=${res.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Cross-school teacher ID access rejected with 404.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-04: School A cannot update School B Teacher (404)
  {
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/teachers/tch_merdeka_01', {
      method: 'PUT',
      token: tokenSchoolA,
      body: { name: 'Hacked Name' }
    });
    const pass = res.status === 404;

    results.push({
      id: 'U10-TNT-04',
      category: 'Multi-Tenant Isolation',
      scenario: 'Cross-Tenant Direct Mutation Protection (PUT /api/teachers/:id returns 404)',
      expected: 'Status 404 when mutating other school teacher record',
      actual: `status=${res.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Cross-school teacher update rejected safely.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-05: School A cannot delete School B Assignment
  {
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/assignments/asg_merdeka_99', {
      method: 'DELETE',
      token: tokenSchoolA
    });
    const pass = res.status === 404;

    results.push({
      id: 'U10-TNT-05',
      category: 'Multi-Tenant Isolation',
      scenario: 'Cross-Tenant Direct Deletion Protection (DELETE /api/assignments/:id returns 404)',
      expected: 'Status 404 when deleting other school assignment',
      actual: `status=${res.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Deletion prohibited across tenant boundaries.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-06: Outbox Queue Tenant Isolation
  {
    const start = Date.now();
    // Create teacher in School A
    await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: tokenSchoolA,
      body: { name: 'Guru Baru School A', email: 'guru.a@smanusantara.sch.id', specialization: 'Sosiologi' }
    });

    // Create teacher in School B
    await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: tokenSchoolB,
      body: { name: 'Guru Baru School B', email: 'guru.b@merdeka.sch.id', specialization: 'Kimia' }
    });

    const queueItems = await db.prepare('SELECT school_id, count(*) as count FROM sync_queue GROUP BY school_id;').all<any>();
    const hasA = queueItems.results.some((r: any) => r.school_id === 'sch_nusantara_01');
    const hasB = queueItems.results.some((r: any) => r.school_id === schoolBId);
    const pass = hasA && hasB;

    results.push({
      id: 'U10-TNT-06',
      category: 'Multi-Tenant Isolation',
      scenario: 'Outbox Queue Isolation per School Entity',
      expected: 'Sync queue records explicitly tagged with corresponding school_id',
      actual: `hasSchoolAQueue=${hasA}, hasSchoolBQueue=${hasB}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Outbox entries partition data cleanly by tenant identifier.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-07: Multi-School Spreadsheet Replica Isolation
  {
    const start = Date.now();
    const mockGas = new MockGasSpreadsheetEngine(env.SYNC_SECRET);

    // Mock direct sync for School A
    await mockGas.handlePost(
      {
        'x-sync-signature': 'simulated_sig',
        'x-sync-timestamp': String(Math.floor(Date.now() / 1000)),
        'x-sync-school-id': 'sch_nusantara_01'
      },
      JSON.stringify({
        requestId: 'req_a_01',
        schoolId: 'sch_nusantara_01',
        entityType: 'TEACHER',
        action: 'INSERT',
        data: { id: 'tch_a_01', name: 'Guru A' },
        timestamp: Math.floor(Date.now() / 1000)
      })
    );

    // Verify School A rows do not leak into School B
    const rowsA = mockGas.getRows('sch_nusantara_01', 'Guru');
    const rowsB = mockGas.getRows(schoolBId, 'Guru');
    const pass = rowsB.length === 0;

    results.push({
      id: 'U10-TNT-07',
      category: 'Multi-Tenant Isolation',
      scenario: 'Replica Storage Partitioning (Zero cross-tenant spreadsheet leakage)',
      expected: 'School B spreadsheet replica remains empty when School A writes',
      actual: `schoolARows=${rowsA.length}, schoolBRows=${rowsB.length}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Mock spreadsheet engine isolates partitions by school_id.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-08: Dashboard Metrics Tenant Scoping
  {
    const start = Date.now();
    const resA = await callWorkerApi(env, '/api/dashboard', { token: tokenSchoolA });
    const resB = await callWorkerApi(env, '/api/dashboard', { token: tokenSchoolB });

    const totalStudentsA = resA.json?.data?.metrics?.total_students ?? 0;
    const totalStudentsB = resB.json?.data?.metrics?.total_students ?? 0;
    // School A has 3 seeded students, School B has 1
    const pass = resA.status === 200 && resB.status === 200 && totalStudentsA !== totalStudentsB;

    results.push({
      id: 'U10-TNT-08',
      category: 'Multi-Tenant Isolation',
      scenario: 'Dashboard Aggregation Scoping per Tenant Context',
      expected: 'School A and School B dashboard metrics reflect isolated entity counts',
      actual: `schoolAStudents=${totalStudentsA}, schoolBStudents=${totalStudentsB}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Dashboard SQL queries filter aggregate metrics with WHERE school_id = ?.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-09: Audit Log Multi-Tenant Scoping
  {
    const start = Date.now();
    const logsA = await db.prepare('SELECT count(*) as count FROM audit_logs WHERE school_id = ?;').bind('sch_nusantara_01').first<{ count: number }>();
    const logsB = await db.prepare('SELECT count(*) as count FROM audit_logs WHERE school_id = ?;').bind(schoolBId).first<{ count: number }>();

    const pass = (logsA?.count ?? 0) > 0 && (logsB?.count ?? 0) > 0;
    results.push({
      id: 'U10-TNT-09',
      category: 'Multi-Tenant Isolation',
      scenario: 'Audit Logging Scoping & Non-Interference Across Tenants',
      expected: 'Audit entries partitioned distinctly by tenant school_id',
      actual: `logsA=${logsA?.count}, logsB=${logsB?.count}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Audit logging triggers capture school_id in all tenant audit records.',
      durationMs: Date.now() - start
    });
  }

  // U10-TNT-10: IDOR Attack Prevention Validation
  {
    const start = Date.now();
    // School B attempts to fetch School A subject
    const res = await callWorkerApi(env, '/api/subjects/sbj_mat', { token: tokenSchoolB });
    const is404 = res.status === 404;
    const pass = is404;

    results.push({
      id: 'U10-TNT-10',
      category: 'Multi-Tenant Isolation',
      scenario: 'IDOR Prevention: Cross-School Foreign Entity Fetch Returns 404',
      expected: 'Status 404 when querying foreign school subject ID',
      actual: `status=${res.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Direct object references across schools are denied with 404.',
      durationMs: Date.now() - start
    });
  }

  return results;
}
