import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { hashPassword, verifyPassword, hashToken, generateSecureToken } from '../utils/crypto';
import { logAudit } from '../utils/audit';
import { AuthenticatedRequest, extractToken } from '../middleware/auth';
import { getSecurityHeaders } from '../middleware/security';

const SESSION_DURATION_HOURS = 24;

export class AuthController {
  /**
   * POST /api/auth/login
   * Design: Single School default identifier with optional school_code fallback.
   */
  static async login(request: Request, env: Env): Promise<Response> {
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const userAgent = request.headers.get('User-Agent') || 'Unknown';

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Format JSON tidak valid.', 400);
    }

    const { username, password, school_code } = body;
    if (!username || !password) {
      return errorResponse('VALIDATION_ERROR', 'Username dan password wajib diisi.', 400);
    }

    // 1. Resolve School Scope
    let schoolQuery = `SELECT id, name FROM schools LIMIT 1;`;
    let schoolParams: any[] = [];

    if (school_code) {
      schoolQuery = `SELECT id, name FROM schools WHERE npsn = ? OR id = ? LIMIT 1;`;
      schoolParams = [school_code, school_code];
    }

    const school = await env.DB.prepare(schoolQuery).bind(...schoolParams).first<{ id: string; name: string }>();
    if (!school) {
      return errorResponse('INVALID_CREDENTIALS', 'Username atau password salah.', 401);
    }

    // 2. Fetch User by School + Username
    const userQuery = `
      SELECT 
        u.id, u.school_id, u.username, u.password_hash, u.role, u.is_active,
        t.id as teacher_id, COALESCE(t.name, u.username) as full_name, t.nip, t.specialization
      FROM users u
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE u.school_id = ? AND u.username = ?
      LIMIT 1;
    `;

    const user = await env.DB.prepare(userQuery).bind(school.id, username.trim()).first<any>();
    if (!user || user.is_active !== 1) {
      await logAudit(env, {
        schoolId: school.id,
        action: 'LOGIN_FAILED',
        tableName: 'users',
        ipAddress,
        newValues: { username }
      });
      return errorResponse('INVALID_CREDENTIALS', 'Username atau password salah.', 401);
    }

    // 3. Verify Password using Constant-Time verification
    const isPasswordMatch = await verifyPassword(password, user.password_hash);
    if (!isPasswordMatch) {
      await logAudit(env, {
        schoolId: school.id,
        userId: user.id,
        action: 'LOGIN_FAILED',
        tableName: 'users',
        ipAddress
      });
      return errorResponse('INVALID_CREDENTIALS', 'Username atau password salah.', 401);
    }

    // 4. Create New Session in D1
    const sessionId = crypto.randomUUID();
    const rawToken = generateSecureToken();
    const tokenHash = await hashToken(rawToken);

    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 3600 * 1000).toISOString();

    const insertSessionQuery = `
      INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    await env.DB.prepare(insertSessionQuery)
      .bind(sessionId, user.id, tokenHash, ipAddress, userAgent, expiresAt)
      .run();

    // 5. Update user last_login_at
    await env.DB.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?;`).bind(user.id).run();

    // 6. Log successful audit
    await logAudit(env, {
      schoolId: school.id,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      tableName: 'sessions',
      recordId: sessionId,
      ipAddress
    });

    // 7. Prepare Secure Cookie Header + JSON Bearer Token payload
    const isProd = env.ENVIRONMENT === 'production';
    const cookieHeader = `session_token=${rawToken}; Path=/; Max-Age=${SESSION_DURATION_HOURS * 3600}; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Lax`;

    const securityHeaders = getSecurityHeaders(env);

    return jsonResponse(
      {
        token: rawToken,
        user: {
          id: user.id,
          schoolId: user.school_id,
          schoolName: school.name,
          username: user.username,
          name: user.full_name,
          role: user.role,
          teacherId: user.teacher_id || null,
          nip: user.nip || null,
          specialization: user.specialization || null
        },
        expiresAt
      },
      200,
      {
        ...securityHeaders,
        'Set-Cookie': cookieHeader
      }
    );
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const token = extractToken(request);
    if (token) {
      const tokenHash = await hashToken(token);
      await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?;`).bind(tokenHash).run();
    }

    if (request.user) {
      await logAudit(env, {
        schoolId: request.user.schoolId,
        userId: request.user.userId,
        action: 'LOGOUT',
        tableName: 'sessions',
        recordId: request.user.sessionId
      });
    }

    const clearCookie = `session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
    return jsonResponse({ message: 'Logout berhasil.' }, 200, {
      ...getSecurityHeaders(env),
      'Set-Cookie': clearCookie
    });
  }

  /**
   * GET /api/auth/me
   */
  static async me(request: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!request.user) {
      return errorResponse('UNAUTHENTICATED', 'Sesi tidak aktif.', 401);
    }

    const query = `
      SELECT 
        u.id, u.school_id, s.name as school_name, u.username, u.role, u.is_active, u.last_login_at,
        t.id as teacher_id, COALESCE(t.name, u.username) as name, t.nip, t.email, t.phone, t.specialization
      FROM users u
      JOIN schools s ON s.id = u.school_id
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE u.id = ? AND u.school_id = ?
      LIMIT 1;
    `;

    const user = await env.DB.prepare(query).bind(request.user.userId, request.user.schoolId).first<any>();
    if (!user) {
      return errorResponse('NOT_FOUND', 'Data pengguna tidak ditemukan.', 404);
    }

    // If teacher, fetch their active assignments
    let assignments: any[] = [];
    if (user.teacher_id) {
      const asgQuery = `
        SELECT 
          ta.id as assignment_id,
          ta.subject_id, sub.name as subject_name,
          ta.class_id, cls.name as class_name,
          ta.academic_term_id, term.name as term_name, ay.name as academic_year_name,
          COALESCE(ta.custom_kkm, sub.default_kkm) as kkm
        FROM teacher_assignments ta
        JOIN subjects sub ON sub.id = ta.subject_id
        JOIN classes cls ON cls.id = ta.class_id
        JOIN academic_terms term ON term.id = ta.academic_term_id
        JOIN academic_years ay ON ay.id = term.academic_year_id
        WHERE ta.teacher_id = ? AND ta.school_id = ? AND term.is_active = 1
        ORDER BY cls.name, sub.name;
      `;
      const asgResult = await env.DB.prepare(asgQuery).bind(user.teacher_id, request.user.schoolId).all();
      assignments = asgResult.results;
    }

    return jsonResponse({
      user: {
        id: user.id,
        schoolId: user.school_id,
        schoolName: user.school_name,
        username: user.username,
        role: user.role,
        name: user.name,
        teacherId: user.teacher_id || null,
        nip: user.nip || null,
        email: user.email || null,
        phone: user.phone || null,
        specialization: user.specialization || null,
        lastLoginAt: user.last_login_at
      },
      assignments
    }, 200, getSecurityHeaders(env));
  }

  /**
   * POST /api/auth/change-password
   */
  static async changePassword(request: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!request.user) {
      return errorResponse('UNAUTHENTICATED', 'Sesi tidak aktif.', 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Format payload tidak valid.', 400);
    }

    const { currentPassword, newPassword, confirmPassword } = body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('VALIDATION_ERROR', 'Semua field kata sandi wajib diisi.', 400);
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('VALIDATION_ERROR', 'Konfirmasi kata sandi baru tidak cocok.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('VALIDATION_ERROR', 'Kata sandi baru minimal 6 karakter.', 400);
    }

    // Fetch existing password hash
    const user = await env.DB.prepare(`SELECT id, password_hash FROM users WHERE id = ?;`).bind(request.user.userId).first<{ id: string; password_hash: string }>();
    if (!user) {
      return errorResponse('NOT_FOUND', 'User tidak ditemukan.', 404);
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return errorResponse('INVALID_CREDENTIALS', 'Kata sandi saat ini salah.', 400);
    }

    // Hash new password using PBKDF2
    const newHash = await hashPassword(newPassword);

    // Update password in DB
    await env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?;`).bind(newHash, user.id).run();

    // Invalidate all other sessions except current active session
    await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?;`).bind(user.id, request.user.sessionId).run();

    await logAudit(env, {
      schoolId: request.user.schoolId,
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      tableName: 'users',
      recordId: user.id
    });

    return jsonResponse({ message: 'Kata sandi berhasil diperbarui. Sesi perangkat lain telah dicabut.' }, 200, getSecurityHeaders(env));
  }

  /**
   * GET /api/auth/sessions
   */
  static async listSessions(request: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!request.user) {
      return errorResponse('UNAUTHENTICATED', 'Sesi tidak aktif.', 401);
    }

    const query = `
      SELECT id, ip_address, user_agent, expires_at, created_at
      FROM sessions
      WHERE user_id = ? AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC;
    `;

    const sessions = await env.DB.prepare(query).bind(request.user.userId).all();
    const formatted = sessions.results.map((s: any) => ({
      ...s,
      isCurrent: s.id === request.user?.sessionId
    }));

    return jsonResponse(formatted, 200, getSecurityHeaders(env));
  }

  /**
   * POST /api/auth/sessions/revoke
   */
  static async revokeSession(request: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!request.user) {
      return errorResponse('UNAUTHENTICATED', 'Sesi tidak aktif.', 401);
    }

    const body = await request.json().catch(() => ({})) as any;
    const { sessionId } = body;

    if (!sessionId) {
      return errorResponse('VALIDATION_ERROR', 'Session ID wajib diberikan.', 400);
    }

    await env.DB.prepare(`DELETE FROM sessions WHERE id = ? AND user_id = ?;`).bind(sessionId, request.user.userId).run();

    await logAudit(env, {
      schoolId: request.user.schoolId,
      userId: request.user.userId,
      action: 'SESSION_REVOKED',
      tableName: 'sessions',
      recordId: sessionId
    });

    return jsonResponse({ message: 'Sesi berhasil dicabut.' }, 200, getSecurityHeaders(env));
  }
}
