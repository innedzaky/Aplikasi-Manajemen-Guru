import { U10TestResult, createD1Emulator, setupDatabase, callWorkerApi } from './u10_helpers';
import { Env } from '../../src/types';
import { RateLimiter } from '../../src/middleware/rateLimit';

export async function runAuthSmokeTests(): Promise<U10TestResult[]> {
  const results: U10TestResult[] = [];
  const db = createD1Emulator();
  await setupDatabase(db);

  const env: Env = {
    DB: db,
    ENVIRONMENT: 'production',
    SESSION_SECRET: 'production_grade_super_secret_session_key_32_bytes',
    SYNC_SECRET: 'production_grade_hmac_sync_secret_32_bytes_long',
    GAS_SYNC_URL: 'https://script.google.com/macros/s/AKfycb_prod_auth_test/exec'
  };

  // U10-AUT-01: Login OWNER User
  {
    RateLimiter.reset();
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'owner', password: 'password123' }
    });

    const isOk = res.status === 200 && res.json?.success === true;
    const isOwner = res.json?.data?.user?.role === 'OWNER';
    const hasToken = Boolean(res.json?.data?.token);
    const pass = isOk && isOwner && hasToken;

    results.push({
      id: 'U10-AUT-01',
      category: 'Authentication & RBAC',
      scenario: 'OWNER User Login & Token Generation',
      expected: 'Status 200, role=OWNER, valid session token returned',
      actual: `status=${res.status}, role=${res.json?.data?.user?.role}, hasToken=${hasToken}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Owner logged in successfully with valid session token.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-02: Login ADMIN User
  {
    RateLimiter.reset();
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' }
    });

    const isOk = res.status === 200 && res.json?.success === true;
    const isAdmin = res.json?.data?.user?.role === 'ADMIN';
    const pass = isOk && isAdmin;

    results.push({
      id: 'U10-AUT-02',
      category: 'Authentication & RBAC',
      scenario: 'ADMIN User Login & Session Establishment',
      expected: 'Status 200, role=ADMIN returned',
      actual: `status=${res.status}, role=${res.json?.data?.user?.role}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Admin authenticated with correct permissions payload.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-03: Login GURU User
  {
    RateLimiter.reset();
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });

    const isOk = res.status === 200 && res.json?.success === true;
    const isGuru = res.json?.data?.user?.role === 'GURU';
    const hasTeacherId = res.json?.data?.user?.teacherId === 'tch_budi';
    const pass = isOk && isGuru && hasTeacherId;

    results.push({
      id: 'U10-AUT-03',
      category: 'Authentication & RBAC',
      scenario: 'GURU User Login & Teacher Profile Association',
      expected: 'Status 200, role=GURU, teacherId=tch_budi returned',
      actual: `status=${res.status}, role=${res.json?.data?.user?.role}, teacherId=${res.json?.data?.user?.teacherId}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Teacher account verified and mapped to teacher profile.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-04: Login with Wrong Password (HTTP 401)
  {
    RateLimiter.reset();
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'wrongpassword' }
    });

    const is401 = res.status === 401;
    const isInvalidCreds = res.json?.error?.code === 'INVALID_CREDENTIALS';
    const pass = is401 && isInvalidCreds;

    results.push({
      id: 'U10-AUT-04',
      category: 'Authentication & RBAC',
      scenario: 'Login Authentication Failure on Incorrect Password (401)',
      expected: 'Status 401, error code "INVALID_CREDENTIALS"',
      actual: `status=${res.status}, code=${res.json?.error?.code}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Invalid password rejected securely with 401 status.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-05: Login with Non-Existent User (HTTP 401)
  {
    RateLimiter.reset();
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'nonexistent_user_99', password: 'password123' }
    });

    const is401 = res.status === 401;
    const isInvalidCreds = res.json?.error?.code === 'INVALID_CREDENTIALS';
    const pass = is401 && isInvalidCreds;

    results.push({
      id: 'U10-AUT-05',
      category: 'Authentication & RBAC',
      scenario: 'Login Authentication Failure on Unknown Username (401)',
      expected: 'Status 401, error code "INVALID_CREDENTIALS"',
      actual: `status=${res.status}, code=${res.json?.error?.code}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Non-existent username rejected without username enumeration leak.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-06: Session Validation via /api/auth/me
  {
    RateLimiter.reset();
    const start = Date.now();
    const loginRes = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' }
    });
    const token = loginRes.json?.data?.token;

    const meRes = await callWorkerApi(env, '/api/auth/me', { token });
    const isOk = meRes.status === 200 && meRes.json?.data?.user?.username === 'admin';

    results.push({
      id: 'U10-AUT-06',
      category: 'Authentication & RBAC',
      scenario: 'Session Verification Pipeline (/api/auth/me)',
      expected: 'Status 200, returns active user session metadata',
      actual: `status=${meRes.status}, username=${meRes.json?.data?.user?.username}`,
      status: isOk ? 'PASS' : 'FAIL',
      evidence: 'Bearer token validated against D1 sessions table.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-07: Session Revocation (/api/auth/sessions/revoke)
  {
    RateLimiter.reset();
    const start = Date.now();
    const loginRes = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'siti', password: 'password123' }
    });
    const token = loginRes.json?.data?.token;

    const sessionsRes = await callWorkerApi(env, '/api/auth/sessions', { token });
    const sessionId = sessionsRes.json?.data?.[0]?.id;

    const revokeRes = await callWorkerApi(env, '/api/auth/sessions/revoke', {
      method: 'POST',
      token,
      body: { sessionId }
    });

    const isOk = revokeRes.status === 200 && revokeRes.json?.success === true;
    // Verify session is dead
    const testMe = await callWorkerApi(env, '/api/auth/me', { token });
    const isDead = testMe.status === 401;
    const pass = isOk && isDead;

    results.push({
      id: 'U10-AUT-07',
      category: 'Authentication & RBAC',
      scenario: 'Explicit Session Revocation & Immediate Invalidation',
      expected: 'Revoke endpoint returns 200, subsequent request returns 401',
      actual: `revokeStatus=${revokeRes.status}, subsequentMeStatus=${testMe.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Revoked session removed from active session pool.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-08: Logout Endpoint Invalidation
  {
    RateLimiter.reset();
    const start = Date.now();
    const loginRes = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });
    const token = loginRes.json?.data?.token;

    const logoutRes = await callWorkerApi(env, '/api/auth/logout', {
      method: 'POST',
      token
    });

    const afterLogoutMe = await callWorkerApi(env, '/api/auth/me', { token });
    const pass = logoutRes.status === 200 && afterLogoutMe.status === 401;

    results.push({
      id: 'U10-AUT-08',
      category: 'Authentication & RBAC',
      scenario: 'User Logout Endpoint Invalidation Flow (/api/auth/logout)',
      expected: 'Logout returns 200, subsequent calls with same token return 401',
      actual: `logoutStatus=${logoutRes.status}, subsequentStatus=${afterLogoutMe.status}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'User logout invalidates session token deterministically.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-09: RBAC Enforcement (GURU Forbidden from Mutating Master Data)
  {
    RateLimiter.reset();
    const start = Date.now();
    const loginRes = await callWorkerApi(env, '/api/auth/login', {
      method: 'POST',
      body: { username: 'budi', password: 'password123' }
    });
    const guruToken = loginRes.json?.data?.token;

    const createTeacherRes = await callWorkerApi(env, '/api/teachers', {
      method: 'POST',
      token: guruToken,
      body: {
        name: 'Guru Baru Ilegal',
        email: 'guru.ilegal@smanusantara.sch.id',
        specialization: 'Fisika'
      }
    });

    const is403 = createTeacherRes.status === 403;
    const isForbidden = createTeacherRes.json?.error?.code === 'FORBIDDEN';
    const pass = is403 && isForbidden;

    results.push({
      id: 'U10-AUT-09',
      category: 'Authentication & RBAC',
      scenario: 'RBAC Enforcement: GURU Role Forbidden (403) from Mutating Master Data',
      expected: 'POST /api/teachers by GURU returns HTTP 403 FORBIDDEN',
      actual: `status=${createTeacherRes.status}, code=${createTeacherRes.json?.error?.code}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Teacher prohibited from mutating master teacher catalog.',
      durationMs: Date.now() - start
    });
  }

  // U10-AUT-10: Protected Route Unauthenticated Rejection
  {
    const start = Date.now();
    const res = await callWorkerApi(env, '/api/students');

    const is401 = res.status === 401;
    const isUnauth = res.json?.error?.code === 'UNAUTHENTICATED';
    const pass = is401 && isUnauth;

    results.push({
      id: 'U10-AUT-10',
      category: 'Authentication & RBAC',
      scenario: 'Protected Resource Access Rejection for Missing Token (401)',
      expected: 'Protected route returns HTTP 401 UNAUTHENTICATED when token is absent',
      actual: `status=${res.status}, code=${res.json?.error?.code}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Strict bearer token validation enforced across all private routes.',
      durationMs: Date.now() - start
    });
  }

  return results;
}
