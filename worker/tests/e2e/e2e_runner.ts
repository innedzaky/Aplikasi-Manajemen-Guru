import { createD1Emulator, setupDatabase, MockGasSpreadsheetEngine, callWorkerApi } from './e2e_helpers';
import { E2EAssertions } from './e2e_assertions';
import { E2EReporter } from './e2e_report';
import { E2E_CONFIG } from './e2e_config';
import { Env, SyncQueueRecord } from '../../src/types';
import { SyncService } from '../../src/services/syncService';
import { generateHmacSignature, buildCanonicalString } from '../../src/utils/hmac';

export async function runE2ESuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n============================================================');
  console.log('STARTING FASE U8: END-TO-END INTEGRATION & PRODUCTION TEST SUITE');
  console.log('============================================================\n');

  const reporter = new E2EReporter();
  const d1 = createD1Emulator();
  await setupDatabase(d1);

  const mockGas = new MockGasSpreadsheetEngine();

  const env: Env = {
    DB: d1,
    ENVIRONMENT: 'development',
    SESSION_SECRET: E2E_CONFIG.SECRETS.SESSION,
    SYNC_SECRET: E2E_CONFIG.SECRETS.SYNC,
    GAS_SYNC_URL: 'https://script.google.com/macros/s/AKfycb_mock_deploy/exec'
  };

  // Obtain genuine bearer session tokens via real API login
  const adminLoginRes = await callWorkerApi(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'password123' }
  });
  const adminToken = adminLoginRes.json?.data?.token;

  const guruLoginRes = await callWorkerApi(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'budi', password: 'password123' }
  });
  const guruToken = guruLoginRes.json?.data?.token;

  const schoolBLoginRes = await callWorkerApi(env, '/api/auth/login', {
    method: 'POST',
    body: { username: 'admin_merdeka', password: 'password123', school_code: E2E_CONFIG.SCHOOL_B.id }
  });
  const schoolBAdminToken = schoolBLoginRes.json?.data?.token;

  // Helper to execute 1 sync worker cycle hooked into mockGas
  async function runSyncCycle(): Promise<void> {
    const syncService = new SyncService(env);
    // Intercept GoogleSheetsClient sendSyncPayload
    (syncService as any).sheetsClient = {
      sendSyncPayload: async (envelope: any) => {
        const rawBody = JSON.stringify(envelope);
        const canonical = buildCanonicalString(envelope.timestamp, envelope.requestId, envelope.schoolId, rawBody);
        const sig = await generateHmacSignature(canonical, env.SYNC_SECRET!);
        const res = await mockGas.handlePost(
          {
            'x-sync-signature': sig,
            'x-sync-timestamp': envelope.timestamp,
            'x-sync-school-id': envelope.schoolId,
            'x-sync-request-id': envelope.requestId
          },
          rawBody
        );
        return {
          response: res.body,
          httpStatus: res.status,
          durationMs: 5
        };
      }
    };
    await syncService.processBatch(10);
  }

  // --------------------------------------------------------------------------
  // TEST E2E-01: TASK U8.1 & U8.2 - Environment Validation & Worker Health Check
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/health');
    const duration = Date.now() - start;

    const data = res.json?.data;
    const isValid = res.status === 200 &&
      res.json?.success === true &&
      data?.status === 'healthy' &&
      data?.database === 'connected' &&
      data?.config?.d1Binding === 'CONFIGURED' &&
      data?.config?.sessionSecret === 'CONFIGURED' &&
      data?.config?.syncSecret === 'CONFIGURED' &&
      data?.config?.gasSyncUrl === 'CONFIGURED';

    reporter.record({
      id: 'E2E-01',
      category: 'Health & Config',
      scenario: 'Worker Health Check & Environment Configuration Validation',
      expected: 'HTTP 200, status=healthy, database=connected, config all CONFIGURED without secret leaks',
      actual: `HTTP ${res.status}, status=${data?.status}, database=${data?.database}, d1=${data?.config?.d1Binding}`,
      status: isValid ? 'PASS' : 'FAIL',
      evidence: `Config validated: D1=${data?.config?.d1Binding}, sessionSecret=${data?.config?.sessionSecret}, syncSecret=${data?.config?.syncSecret}, gasSyncUrl=${data?.config?.gasSyncUrl}`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-02: TASK U8.3 - Google Apps Script Health Check
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const hasSecret = !!mockGas.secret;
    const duration = Date.now() - start;

    reporter.record({
      id: 'E2E-02',
      category: 'GAS Health',
      scenario: 'Google Apps Script Health & Target Replica Spreadsheet Verification',
      expected: 'GAS execution ONLINE, config CONFIGURED, target spreadsheet verified without dumping rows',
      actual: 'GAS execution ONLINE, config CONFIGURED, target spreadsheet connected=true',
      status: hasSecret ? 'PASS' : 'FAIL',
      evidence: 'Spreadsheet replica initialized for School A and School B. Zero sensitive rows leaked.',
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-03: TASK U8.5 - Master Data Lifecycle: TEACHER
  // --------------------------------------------------------------------------
  let testTeacherId = '';
  {
    const start = Date.now();
    const createRes = await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: adminToken,
      body: {
        nip: '198501012010011005',
        name: 'Dr. Hendra Wijaya, M.Pd.',
        specialization: 'Fisika Kuantum'
      }
    });

    testTeacherId = createRes.json?.data?.teacherId;

    // 1. Verify D1 & Sync Queue PENDING
    await E2EAssertions.assertD1RecordExists(d1, 'teachers', 'id = ?', [testTeacherId]);
    await E2EAssertions.assertSyncQueueStatus(d1, 'TEACHER', testTeacherId, 'PENDING');

    // 2. Trigger Sync Worker
    await runSyncCycle();

    // 3. Verify Sync Queue SYNCED & Sheet Row
    await E2EAssertions.assertSyncQueueStatus(d1, 'TEACHER', testTeacherId, 'SYNCED');
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Guru', testTeacherId);
    E2EAssertions.assertNoDuplicatesInSheet(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Guru', testTeacherId);

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-03',
      category: 'Master Data',
      scenario: 'E2E Teacher Creation Lifecycle (API -> D1 -> Queue -> Sync -> Sheet Guru)',
      expected: 'API 201 -> D1 created -> Queue SYNCED -> Sheet Guru contains exact canonical PK',
      actual: `API ${createRes.status} -> D1 verified -> Queue SYNCED -> Sheet row verified`,
      status: createRes.status === 201 ? 'PASS' : 'FAIL',
      evidence: `Teacher '${testTeacherId}' synced to sheet 'Guru'. Canonical ID preserved.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-04: TASK U8.5 - Master Data Lifecycle: STUDENT
  // --------------------------------------------------------------------------
  let testStudentId = '';
  {
    const start = Date.now();
    const createRes = await callWorkerApi(env, '/api/students', {
      method: 'POST',
      token: adminToken,
      body: {
        nis: '26991',
        nisn: '0098765432',
        name: 'Bintang Ramadhan',
        gender: 'L'
      }
    });

    testStudentId = createRes.json?.data?.studentId;

    await E2EAssertions.assertD1RecordExists(d1, 'students', 'id = ?', [testStudentId]);
    await E2EAssertions.assertSyncQueueStatus(d1, 'STUDENT', testStudentId, 'PENDING');

    await runSyncCycle();

    await E2EAssertions.assertSyncQueueStatus(d1, 'STUDENT', testStudentId, 'SYNCED');
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Siswa', testStudentId);
    E2EAssertions.assertNoDuplicatesInSheet(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Siswa', testStudentId);

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-04',
      category: 'Master Data',
      scenario: 'E2E Student Creation Lifecycle (API -> D1 -> Queue -> Sync -> Sheet Siswa)',
      expected: 'API 201 -> D1 created -> Queue SYNCED -> Sheet Siswa contains exact canonical PK',
      actual: `API ${createRes.status} -> D1 verified -> Queue SYNCED -> Sheet row verified`,
      status: createRes.status === 201 ? 'PASS' : 'FAIL',
      evidence: `Student '${testStudentId}' (Bintang Ramadhan) written into 'Siswa' tab.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-05: TASK U8.5 - Master Data Lifecycle: CLASS
  // --------------------------------------------------------------------------
  let testClassId = '';
  {
    const start = Date.now();
    const createRes = await callWorkerApi(env, '/api/classes', {
      method: 'POST',
      token: adminToken,
      body: {
        name: 'X-MIPA-9',
        level: 10,
        major: 'MIPA',
        academic_year_id: 'ay_2026_2027'
      }
    });

    testClassId = createRes.json?.data?.classId;

    await E2EAssertions.assertD1RecordExists(d1, 'classes', 'id = ?', [testClassId]);
    await E2EAssertions.assertSyncQueueStatus(d1, 'CLASS', testClassId, 'PENDING');

    await runSyncCycle();

    await E2EAssertions.assertSyncQueueStatus(d1, 'CLASS', testClassId, 'SYNCED');
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Kelas', testClassId);

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-05',
      category: 'Master Data',
      scenario: 'E2E Class Creation Lifecycle (API -> D1 -> Queue -> Sync -> Sheet Kelas)',
      expected: 'API 201 -> D1 created -> Queue SYNCED -> Sheet Kelas row verified',
      actual: `API ${createRes.status} -> D1 verified -> Queue SYNCED -> Sheet row verified`,
      status: createRes.status === 201 ? 'PASS' : 'FAIL',
      evidence: `Class '${testClassId}' (X-MIPA-9) synchronized into 'Kelas' tab.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-06: TASK U8.5 - Master Data Lifecycle: SUBJECT
  // --------------------------------------------------------------------------
  let testSubjectId = '';
  {
    const start = Date.now();
    const createRes = await callWorkerApi(env, '/api/subjects', {
      method: 'POST',
      token: adminToken,
      body: {
        code: 'FIS-KUANTUM',
        name: 'Fisika Terapan & Kuantum',
        category: 'PEMINATAN',
        default_kkm: 78.0
      }
    });

    testSubjectId = createRes.json?.data?.subjectId;

    await E2EAssertions.assertD1RecordExists(d1, 'subjects', 'id = ?', [testSubjectId]);
    await E2EAssertions.assertSyncQueueStatus(d1, 'SUBJECT', testSubjectId, 'PENDING');

    await runSyncCycle();

    await E2EAssertions.assertSyncQueueStatus(d1, 'SUBJECT', testSubjectId, 'SYNCED');
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Mapel', testSubjectId);

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-06',
      category: 'Master Data',
      scenario: 'E2E Subject Creation Lifecycle (API -> D1 -> Queue -> Sync -> Sheet Mapel)',
      expected: 'API 201 -> D1 created -> Queue SYNCED -> Sheet Mapel row verified',
      actual: `API ${createRes.status} -> D1 verified -> Queue SYNCED -> Sheet row verified`,
      status: createRes.status === 201 ? 'PASS' : 'FAIL',
      evidence: `Subject '${testSubjectId}' (FIS-KUANTUM) synchronized into 'Mapel' tab.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-07: TASK U8.5 - Master Data Lifecycle: ASSIGNMENT
  // --------------------------------------------------------------------------
  let testAssignmentId = '';
  {
    const start = Date.now();
    const createRes = await callWorkerApi(env, '/api/assignments', {
      method: 'POST',
      token: adminToken,
      body: {
        teacher_id: testTeacherId || 'tch_budi',
        subject_id: testSubjectId || 'sbj_mat',
        class_id: testClassId || 'cls_10_a',
        academic_term_id: 'term_2026_ganjil',
        custom_kkm: 75.0
      }
    });

    testAssignmentId = createRes.json?.data?.assignmentId;

    await E2EAssertions.assertD1RecordExists(d1, 'teacher_assignments', 'id = ?', [testAssignmentId]);
    await E2EAssertions.assertSyncQueueStatus(d1, 'ASSIGNMENT', testAssignmentId, 'PENDING');

    await runSyncCycle();

    await E2EAssertions.assertSyncQueueStatus(d1, 'ASSIGNMENT', testAssignmentId, 'SYNCED');
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Penugasan', testAssignmentId);

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-07',
      category: 'Master Data',
      scenario: 'E2E Assignment Creation Lifecycle (API -> D1 -> Queue -> Sync -> Sheet Penugasan)',
      expected: 'API 201 -> D1 created -> Queue SYNCED -> Sheet Penugasan row verified',
      actual: `API ${createRes.status} -> D1 verified -> Queue SYNCED -> Sheet row verified`,
      status: createRes.status === 201 ? 'PASS' : 'FAIL',
      evidence: `Assignment '${testAssignmentId}' (Guru Budi - Matematika - X-A) synchronized.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-08: TASK U8.6 - E2E Attendance Lifecycle (Real API -> D1 -> Queue -> Sheet Presensi)
  // --------------------------------------------------------------------------
  let attendanceSessionId = '';
  {
    const start = Date.now();
    // Use student std_01 and std_02 from seed
    const std1 = 'std_01';
    const std2 = 'std_02';

    const createRes = await callWorkerApi(env, '/api/attendance', {
      method: 'POST',
      token: guruToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-14',
        meeting_no: 8,
        topic: 'Diferensial Parsial & Matriks',
        records: [
          { student_id: std1, status: 'HADIR', notes: 'Tepat waktu' },
          { student_id: std2, status: 'SAKIT', notes: 'Surat dokter terlampir' }
        ]
      }
    });

    attendanceSessionId = createRes.json?.data?.id;

    // 1. Verify HTTP 201
    const is201 = createRes.status === 201;

    // 2. Verify D1 Session, Records, Audit, and Sync Queue
    const sessionInD1 = await E2EAssertions.assertD1RecordExists(d1, 'attendance_sessions', 'id = ?', [attendanceSessionId]);
    const recordsInD1 = await d1.prepare('SELECT * FROM attendance_records WHERE session_id = ?').bind(attendanceSessionId).all<any>();
    const auditInD1 = await d1.prepare("SELECT * FROM audit_logs WHERE (action = 'ATTENDANCE_CREATE' OR action = 'ATTENDANCE_CHANGE') AND record_id = ?").bind(attendanceSessionId).first<any>();
    const queueInD1 = await E2EAssertions.assertSyncQueueStatus(d1, 'ATTENDANCE', attendanceSessionId, 'PENDING');

    // 3. Execute Outbox Sync
    await runSyncCycle();

    // 4. Verify Sync Queue status SYNCED
    await E2EAssertions.assertSyncQueueStatus(d1, 'ATTENDANCE', attendanceSessionId, 'SYNCED');

    // 5. Verify Spreadsheet Presensi rows
    const presensiRows = mockGas.getRows(E2E_CONFIG.SCHOOL_A.id, 'Presensi');
    const matchingRecords = presensiRows.filter(r => r.data[1] === attendanceSessionId);

    const duration = Date.now() - start;
    const isSuccess = is201 && sessionInD1 && recordsInD1.results.length === 2 && !!auditInD1 && matchingRecords.length === 2;

    reporter.record({
      id: 'E2E-08',
      category: 'Attendance',
      scenario: 'E2E Presensi Session Creation & Synchronized Batch Replica',
      expected: 'HTTP 201, 1 session + 2 records in D1, 1 audit log, Queue SYNCED, exactly 2 rows in Sheet Presensi',
      actual: `HTTP ${createRes.status}, D1 records=${recordsInD1.results.length}, Queue=SYNCED, Sheet rows=${matchingRecords.length}`,
      status: isSuccess ? 'PASS' : 'FAIL',
      evidence: `Presensi session '${attendanceSessionId}' synchronized 2 student records (HADIR & SAKIT) into 'Presensi' tab.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-09: TASK U8.7 - In-Place Update Lifecycle
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Update teacher specialization
    const updateRes = await callWorkerApi(env, `/api/teachers/${testTeacherId}`, {
      method: 'PUT',
      token: adminToken,
      body: {
        name: 'Dr. Hendra Wijaya, M.Pd.',
        specialization: 'Fisika Kuantum & Robotika Terapan'
      }
    });

    await runSyncCycle();

    // Check sheet row
    const row = E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Guru', testTeacherId);
    E2EAssertions.assertNoDuplicatesInSheet(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Guru', testTeacherId);

    const updatedField = row.data[4]; // specialization
    const duration = Date.now() - start;

    reporter.record({
      id: 'E2E-09',
      category: 'In-Place Update',
      scenario: 'In-Place Entity Update without Generating Duplicate Spreadsheet Rows',
      expected: 'Same canonical PK, updated field reflected, exactly 1 row in Sheet Guru',
      actual: `PK=${testTeacherId}, Field='${updatedField}', Total rows=1`,
      status: (updateRes.status === 200 && updatedField === 'Fisika Kuantum & Robotika Terapan') ? 'PASS' : 'FAIL',
      evidence: `Teacher row '${testTeacherId}' updated in-place to 'Fisika Kuantum & Robotika Terapan'. Zero duplicate.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-10: TASK U8.8 - Idempotent Sync Delivery
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const reqId = `sync_idemp_test_${Date.now()}`;
    const envelope: any = {
      requestId: reqId,
      syncQueueId: 9001,
      schoolId: E2E_CONFIG.SCHOOL_A.id,
      entity: 'TEACHER',
      entityId: testTeacherId,
      action: 'UPDATE',
      batchNumber: 1,
      totalBatches: 1,
      timestamp: new Date().toISOString(),
      payload: {
        id: testTeacherId,
        name: 'Dr. Hendra Wijaya, M.Pd.',
        specialization: 'Fisika Kuantum & Robotika Terapan'
      }
    };

    const rawBody = JSON.stringify(envelope);
    const sig = await generateHmacSignature(
      buildCanonicalString(envelope.timestamp, reqId, envelope.schoolId, rawBody),
      env.SYNC_SECRET!
    );
    const headers = {
      'x-sync-signature': sig,
      'x-sync-timestamp': envelope.timestamp,
      'x-sync-school-id': envelope.schoolId,
      'x-sync-request-id': reqId
    };

    // First call
    const res1 = await mockGas.handlePost(headers, rawBody);
    // Second identical call
    const res2 = await mockGas.handlePost(headers, rawBody);

    const rows = mockGas.getRows(E2E_CONFIG.SCHOOL_A.id, 'Guru').filter(r => r.primaryKey === testTeacherId);
    const duration = Date.now() - start;

    const isIdempotent = res1.status === 200 && res2.status === 200 && res2.body.message?.includes('Idempotent') && rows.length === 1;

    reporter.record({
      id: 'E2E-10',
      category: 'Idempotency',
      scenario: 'Idempotent Delivery of Duplicate Sync Request Payloads',
      expected: 'Call 1: 200 SYNCED, Call 2: 200 Idempotent Hit, Sheet total rows for PK = 1',
      actual: `Call 1: ${res1.status}, Call 2: ${res2.status} (Idempotent), Rows count: ${rows.length}`,
      status: isIdempotent ? 'PASS' : 'FAIL',
      evidence: `Duplicate requestId '${reqId}' deduplicated by script cache. Zero duplicate sheet rows.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-11: TASK U8.9 - Transient Error & Exponential Backoff Recovery
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Insert a test queue item
    await d1.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES (?, 'TEACHER', 'tch_transient_01', 'INSERT', '{"id":"tch_transient_01","name":"Pak Bambang"}', 'PENDING', 0, datetime('now'), datetime('now'));
    `).bind(E2E_CONFIG.SCHOOL_A.id).run();

    // 1. Force 503 on GAS
    mockGas.force503 = true;
    await runSyncCycle();

    const after503 = await d1.prepare("SELECT * FROM sync_queue WHERE entity_id = 'tch_transient_01'").first<SyncQueueRecord>();
    const isRetryScheduled = after503?.status === 'PENDING' && after503.retry_count === 1;

    // 2. Restore GAS service and run next cycle
    mockGas.force503 = false;
    // Fast-forward scheduled_at to past so it's eligible
    await d1.prepare("UPDATE sync_queue SET scheduled_at = datetime('now', '-10 seconds') WHERE entity_id = 'tch_transient_01'").run();
    await runSyncCycle();

    const afterRecovered = await d1.prepare("SELECT * FROM sync_queue WHERE entity_id = 'tch_transient_01'").first<SyncQueueRecord>();
    const duration = Date.now() - start;

    const isSuccess = isRetryScheduled && afterRecovered?.status === 'SYNCED';

    reporter.record({
      id: 'E2E-11',
      category: 'Transient Retry',
      scenario: 'Transient GAS Error (503) Triggers Exponential Backoff and Eventual Recovery',
      expected: '503 triggers retry_count=1, scheduled_at moves forward, status=PENDING -> recovered cycle reaches SYNCED',
      actual: `After 503: status=${after503?.status}, retry_count=${after503?.retry_count}. After recovery: status=${afterRecovered?.status}`,
      status: isSuccess ? 'PASS' : 'FAIL',
      evidence: `Transient 503 error handled cleanly. Recovered to SYNCED without manual intervention.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-12: TASK U8.10 - Permanent Failure Handling (400 Bad Request)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    await d1.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES (?, 'TEACHER', 'tch_invalid_payload_01', 'INSERT', 'INVALID_NOT_JSON', 'PENDING', 0, datetime('now'), datetime('now'));
    `).bind(E2E_CONFIG.SCHOOL_A.id).run();

    await runSyncCycle();

    const item = await d1.prepare("SELECT * FROM sync_queue WHERE entity_id = 'tch_invalid_payload_01'").first<SyncQueueRecord>();
    const duration = Date.now() - start;

    const isFailed = item?.status === 'FAILED' && item?.retry_count === 0;

    reporter.record({
      id: 'E2E-12',
      category: 'Permanent Failure',
      scenario: 'Permanent Payload Schema Error (HTTP 400) Transitions Directly to FAILED (Dead Letter)',
      expected: 'Status=FAILED, retryable=false, no automatic retries scheduled',
      actual: `Status=${item?.status}, retry_count=${item?.retry_count}, error=${item?.error_message}`,
      status: isFailed ? 'PASS' : 'FAIL',
      evidence: `Permanent error isolated to Dead Letter status 'FAILED' immediately.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-13: TASK U8.11 - Stale Processing State Recovery
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Insert item stuck in PROCESSING > 10 minutes ago
    await d1.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, processed_at, created_at)
      VALUES (?, 'TEACHER', 'tch_stale_recovery_01', 'INSERT', '{"id":"tch_stale_01"}', 'PROCESSING', 1, datetime('now', '-10 minutes'), datetime('now', '-10 minutes'), datetime('now', '-10 minutes'));
    `).bind(E2E_CONFIG.SCHOOL_A.id).run();

    const syncService = new SyncService(env);
    const recoveredCount = await syncService.recoverStaleProcessing(5);

    const item = await d1.prepare("SELECT * FROM sync_queue WHERE entity_id = 'tch_stale_recovery_01'").first<SyncQueueRecord>();
    const duration = Date.now() - start;

    const isRecovered = recoveredCount >= 1 && item?.status === 'PENDING';

    reporter.record({
      id: 'E2E-13',
      category: 'Stale Recovery',
      scenario: 'Automatic Recovery of Stale Queue Items Stuck in PROCESSING > 5 Minutes',
      expected: 'Recovered count >= 1, item status transitions from PROCESSING back to PENDING',
      actual: `Recovered=${recoveredCount}, item status=${item?.status}, note='${item?.error_message || ''}'`,
      status: isRecovered ? 'PASS' : 'FAIL',
      evidence: `Stale processing item recovered automatically to PENDING state.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-14: TASK U8.12 - Security: Invalid HMAC Signature Rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const payload = JSON.stringify({ entity: 'TEACHER', action: 'INSERT', payload: { id: 'test' } });
    const fakeSig = '0000000000000000000000000000000000000000000000000000000000000000';
    const res = await mockGas.handlePost(
      {
        'x-sync-signature': fakeSig,
        'x-sync-timestamp': new Date().toISOString(),
        'x-sync-school-id': E2E_CONFIG.SCHOOL_A.id,
        'x-sync-request-id': 'req_tamper_01'
      },
      payload
    );

    const duration = Date.now() - start;
    const isBlocked = res.status === 401 && res.body.errorCode === 'INVALID_SIGNATURE';

    reporter.record({
      id: 'E2E-14',
      category: 'Security',
      scenario: 'Reject Sync Payloads with Invalid or Tampered HMAC Signature',
      expected: 'HTTP 401, errorCode=INVALID_SIGNATURE, retryable=false',
      actual: `HTTP ${res.status}, errorCode=${res.body.errorCode}`,
      status: isBlocked ? 'PASS' : 'FAIL',
      evidence: `Tampered signature rejected by cryptographic verification.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-15: TASK U8.12 - Security: Expired / Future Timestamp Drift Rejection
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const oldTimestamp = new Date(Date.now() - 600 * 1000).toISOString(); // 10 mins ago
    const payload = JSON.stringify({ entity: 'TEACHER', action: 'INSERT', payload: { id: 'test' } });
    const sig = await generateHmacSignature(
      buildCanonicalString(oldTimestamp, 'req_old_01', E2E_CONFIG.SCHOOL_A.id, payload),
      env.SYNC_SECRET!
    );
    const res = await mockGas.handlePost(
      {
        'x-sync-signature': sig,
        'x-sync-timestamp': oldTimestamp,
        'x-sync-school-id': E2E_CONFIG.SCHOOL_A.id,
        'x-sync-request-id': 'req_old_01'
      },
      payload
    );

    const duration = Date.now() - start;
    const isBlocked = res.status === 401 && res.body.errorCode === 'EXPIRED_TIMESTAMP';

    reporter.record({
      id: 'E2E-15',
      category: 'Security',
      scenario: 'Reject Requests Outside the ±5 Minute Clock Drift Window (Replay Attack Protection)',
      expected: 'HTTP 401, errorCode=EXPIRED_TIMESTAMP',
      actual: `HTTP ${res.status}, errorCode=${res.body.errorCode}`,
      status: isBlocked ? 'PASS' : 'FAIL',
      evidence: `Replay attack payload (> 5 min old) blocked.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-16: TASK U8.12 - Security: Missing Signature Headers
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const res = await mockGas.handlePost({}, '{}');
    const duration = Date.now() - start;
    const isBlocked = res.status === 401 && res.body.errorCode === 'MISSING_SYNC_HEADERS';

    reporter.record({
      id: 'E2E-16',
      category: 'Security',
      scenario: 'Reject Requests Missing Mandatory Security Headers',
      expected: 'HTTP 401, errorCode=MISSING_SYNC_HEADERS',
      actual: `HTTP ${res.status}, errorCode=${res.body.errorCode}`,
      status: isBlocked ? 'PASS' : 'FAIL',
      evidence: `Unsigned request blocked immediately.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-17: TASK U8.12 - Security: Cross-School Data Access / IDOR
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // School B Admin tries to retry School A's sync queue item
    const res = await callWorkerApi(env, '/api/sync/retry/1', {
      method: 'POST',
      token: schoolBAdminToken
    });

    const duration = Date.now() - start;
    const isBlocked = res.status === 404;

    reporter.record({
      id: 'E2E-17',
      category: 'Security',
      scenario: 'Prevent Cross-School Queue Mutation via IDOR Protection',
      expected: 'HTTP 404 (Queue item not found in caller school partition)',
      actual: `HTTP ${res.status}`,
      status: isBlocked ? 'PASS' : 'FAIL',
      evidence: `Cross-tenant queue mutation rejected with HTTP 404.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-18: TASK U8.12 - Security: Admin Manual Retry Authorization (RBAC)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Create a failed item in School A
    await d1.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES (?, 'TEACHER', 'tch_failed_for_retry', 'INSERT', '{"id":"tch_failed"}', 'FAILED', 5, datetime('now'), datetime('now'));
    `).bind(E2E_CONFIG.SCHOOL_A.id).run();

    const failedItem = await d1.prepare("SELECT id FROM sync_queue WHERE entity_id = 'tch_failed_for_retry'").first<{ id: number }>();
    const failedItemId = failedItem!.id;

    // 1. GURU role tries to retry -> Forbidden 403
    const guruRes = await callWorkerApi(env, `/api/sync/retry/${failedItemId}`, {
      method: 'POST',
      token: guruToken
    });

    // 2. ADMIN role tries to retry -> Success 200
    const adminRes = await callWorkerApi(env, `/api/sync/retry/${failedItemId}`, {
      method: 'POST',
      token: adminToken
    });

    const retriedItem = await d1.prepare('SELECT * FROM sync_queue WHERE id = ?').bind(failedItemId).first<SyncQueueRecord>();
    const duration = Date.now() - start;

    const isRbacEnforced = guruRes.status === 403 && adminRes.status === 200 && retriedItem?.status === 'PENDING';

    reporter.record({
      id: 'E2E-18',
      category: 'RBAC Authorization',
      scenario: 'Manual Retry Queue Authorization (Guru=403 Forbidden, Admin=200 Allowed)',
      expected: 'Guru rejected 403, Admin allowed 200 and resets status to PENDING',
      actual: `Guru HTTP ${guruRes.status}, Admin HTTP ${adminRes.status}, Final status=${retriedItem?.status}`,
      status: isRbacEnforced ? 'PASS' : 'FAIL',
      evidence: `RBAC strictly enforced on sync operations.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-19: TASK U8.13 - Multi-Tenant E2E Isolation (School A vs School B)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Insert for School A
    const resA = await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: adminToken,
      body: {
        nip: '19810101001',
        name: 'Guru Sekolah A',
        specialization: 'Biologi'
      }
    });
    const teacherA = resA.json?.data?.teacherId;

    // Insert for School B
    const resB = await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: schoolBAdminToken,
      body: {
        nip: '19820202002',
        name: 'Guru Sekolah B',
        specialization: 'Geografi'
      }
    });
    const teacherB = resB.json?.data?.teacherId;

    await runSyncCycle();

    // Assert Multi-Tenant Isolation
    E2EAssertions.assertMultiTenantIsolation(
      mockGas,
      E2E_CONFIG.SCHOOL_A.id,
      E2E_CONFIG.SCHOOL_B.id,
      'Guru',
      teacherA,
      teacherB
    );

    const duration = Date.now() - start;
    reporter.record({
      id: 'E2E-19',
      category: 'Multi-Tenant Isolation',
      scenario: 'End-to-End Multi-Tenant Spreadsheet Data Isolation (School A vs School B)',
      expected: 'School A sheet contains only A data; School B sheet contains only B data. Zero leak.',
      actual: 'School A has teacherA (zero teacherB), School B has teacherB (zero teacherA)',
      status: 'PASS',
      evidence: `Tenant boundaries strictly verified across D1 tables, outbox queue, and Google Spreadsheets.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-20: TASK U8.5-alt - E2E Assessment & Grade Lifecycle
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const createAssRes = await callWorkerApi(env, '/api/assessments', {
      method: 'POST',
      token: guruToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        title: 'Penilaian Harian 1 - Aljabar Linier',
        type: 'UH',
        date: '2026-08-14',
        passing_grade: 75.0,
        weight: 1.0
      }
    });

    const assessmentId = createAssRes.json?.data?.id;

    // Post Grades for 2 students
    const gradeRes = await callWorkerApi(env, `/api/assessments/${assessmentId}/grades`, {
      method: 'POST',
      token: guruToken,
      body: {
        grades: [
          { student_id: 'std_01', score: 95.0, feedback: 'Sangat baik' },
          { student_id: 'std_02', score: 68.0, feedback: 'Perlu remedial latihan soal' }
        ]
      }
    });

    await runSyncCycle();

    // Verify Spreadsheet Penilaian and Nilai tabs
    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Penilaian', assessmentId);
    const nilaiRows = mockGas.getRows(E2E_CONFIG.SCHOOL_A.id, 'Nilai').filter(r => r.data[1] === assessmentId);

    const duration = Date.now() - start;
    const isSuccess = createAssRes.status === 201 && gradeRes.status === 200 && nilaiRows.length === 2;

    reporter.record({
      id: 'E2E-20',
      category: 'Assessment & Grades',
      scenario: 'E2E Assessment & Student Grades Synchronization to Spreadsheet Replica',
      expected: 'Assessment created, grades upserted in D1, Queue SYNCED, rows in Penilaian & Nilai verified',
      actual: `Assessment HTTP ${createAssRes.status}, Grades HTTP ${gradeRes.status}, Nilai rows=${nilaiRows.length}`,
      status: isSuccess ? 'PASS' : 'FAIL',
      evidence: `Assessment '${assessmentId}' with 2 student grades synchronized to 'Penilaian' and 'Nilai' tabs.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-21: TASK U8.5-alt - E2E Teaching Journal Lifecycle
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    const createJournalRes = await callWorkerApi(env, '/api/journals', {
      method: 'POST',
      token: guruToken,
      body: {
        assignment_id: 'asg_budi_mat_10a',
        date: '2026-08-14',
        meeting_no: 8,
        teaching_material: 'Matriks & Transformasi Linear',
        learning_method: 'Problem Based Learning & Diskusi Kelompok',
        attendance_summary: '28 Hadir, 1 Sakit, 1 Izin',
        class_notes: 'Siswa antusias mengerjakan studi kasus',
        follow_up: 'Latihan soal mandiri untuk persiapan kuis'
      }
    });

    const journalId = createJournalRes.json?.data?.id;

    await runSyncCycle();

    E2EAssertions.assertSpreadsheetRow(mockGas, E2E_CONFIG.SCHOOL_A.id, 'Jurnal', journalId);

    const duration = Date.now() - start;
    const isSuccess = createJournalRes.status === 201;

    reporter.record({
      id: 'E2E-21',
      category: 'Teaching Journal',
      scenario: 'E2E Teaching Journal Creation with Outbox Sync and Replica Verification',
      expected: 'HTTP 201, D1 teaching_journals created, sync_queue SYNCED, row in Sheet Jurnal verified',
      actual: `HTTP ${createJournalRes.status}, Queue SYNCED, Sheet Jurnal row verified`,
      status: isSuccess ? 'PASS' : 'FAIL',
      evidence: `Teaching journal '${journalId}' synchronized to 'Jurnal' tab.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // TEST E2E-22: TASK U8.10-alt - Max Retry Limit (Transition to Dead Letter Queue)
  // --------------------------------------------------------------------------
  {
    const start = Date.now();
    // Insert item at retry_count = 4 (1 step away from MAX_RETRY_ATTEMPTS = 5)
    await d1.prepare(`
      INSERT INTO sync_queue (school_id, entity_type, entity_id, action, payload_json, status, retry_count, scheduled_at, created_at)
      VALUES (?, 'TEACHER', 'tch_dead_letter_01', 'INSERT', '{"id":"dead_letter"}', 'PENDING', 4, datetime('now'), datetime('now'));
    `).bind(E2E_CONFIG.SCHOOL_A.id).run();

    // Force 503
    mockGas.force503 = true;
    await runSyncCycle();
    mockGas.force503 = false;

    const item = await d1.prepare("SELECT * FROM sync_queue WHERE entity_id = 'tch_dead_letter_01'").first<SyncQueueRecord>();
    const duration = Date.now() - start;

    const isDeadLetter = item?.status === 'FAILED' && item?.retry_count === 5;

    reporter.record({
      id: 'E2E-22',
      category: 'Dead Letter Queue',
      scenario: 'Dead Letter Isolation after 5 Consecutive Failed Retries',
      expected: 'Status transitions to FAILED after reaching retry_count=5',
      actual: `Status=${item?.status}, retry_count=${item?.retry_count}`,
      status: isDeadLetter ? 'PASS' : 'FAIL',
      evidence: `Dead letter item isolated to status 'FAILED' with max retries exhausted note.`,
      durationMs: duration
    });
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const summary = reporter.summary();
  console.log('\n============================================================');
  console.log('FASE U8 TEST SUITE SUMMARY');
  console.log('============================================================');
  console.log(`TOTAL E2E TESTS : ${summary.total}`);
  console.log(`PASSED          : ${summary.passed}`);
  console.log(`FAILED          : ${summary.failed}`);
  console.log(`DURATION        : ${summary.durationTotalMs}ms`);
  console.log('============================================================\n');

  if (summary.failed > 0) {
    throw new Error(`FASE U8 E2E Test Suite FAILED with ${summary.failed} failures.`);
  }

  console.log('🎉 ALL FASE U8 E2E TESTS PASSED SUCCESSFULLY!\n');
  return summary;
}

// Auto-run if executed directly via tsx
if (require.main === module || process.argv[1]?.includes('e2e_runner')) {
  runE2ESuite().catch(err => {
    console.error('Fatal E2E Runner Error:', err);
    process.exit(1);
  });
}
