import { Env, UserSessionPayload, UserRole } from '../types';
import { errorResponse } from '../utils/response';
import { hashToken } from '../utils/crypto';

export interface AuthenticatedRequest extends Request {
  user?: UserSessionPayload;
}

/**
 * Parses authentication credentials from Cookie or Authorization header.
 * Preferred method: Secure HttpOnly Cookie `session_token`
 * Fallback method: `Authorization: Bearer <token>`
 */
export function extractToken(request: Request): string | null {
  // 1. Check Cookie first (Most secure for browser client)
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('session_token=')) {
        const val = cookie.substring('session_token='.length);
        if (val) return decodeURIComponent(val);
      }
    }
  }

  // 2. Check Authorization Header (For API clients & mobile apps)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const val = authHeader.substring(7).trim();
    if (val) return val;
  }

  return null;
}

/**
 * Authentication Middleware: Validates session in D1 and scopes to user's school.
 */
export async function authenticate(
  request: AuthenticatedRequest,
  env: Env
): Promise<Response | null> {
  const token = extractToken(request);
  if (!token) {
    return errorResponse('UNAUTHENTICATED', 'Sesi tidak ditemukan atau kadaluarsa. Silakan login kembali.', 401);
  }

  const tokenHash = await hashToken(token);

  // Query valid non-expired session from D1
  const sessionQuery = `
    SELECT 
      s.id as session_id,
      s.expires_at,
      u.id as user_id,
      u.school_id,
      u.username,
      u.role,
      u.is_active,
      t.id as teacher_id,
      COALESCE(t.name, u.username) as name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN teachers t ON t.user_id = u.id
    WHERE s.token_hash = ? AND datetime(s.expires_at) > datetime('now') AND u.is_active = 1
    LIMIT 1;
  `;

  const session = await env.DB.prepare(sessionQuery).bind(tokenHash).first<any>();

  if (!session) {
    return errorResponse('UNAUTHENTICATED', 'Sesi login tidak valid atau telah berakhir.', 401);
  }

  // Attach strictly scoped user payload
  request.user = {
    userId: session.user_id,
    schoolId: session.school_id,
    role: session.role as UserRole,
    teacherId: session.teacher_id || null,
    username: session.username,
    name: session.name,
    sessionId: session.session_id
  };

  return null; // Authentication passed
}

/**
 * RBAC Middleware: Checks if user's role is in the allowed list.
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (request: AuthenticatedRequest): Response | null => {
    if (!request.user) {
      return errorResponse('UNAUTHENTICATED', 'Akses ditolak: pengguna belum diautentikasi.', 401);
    }
    if (!allowedRoles.includes(request.user.role)) {
      return errorResponse('FORBIDDEN', `Akses ditolak: role '${request.user.role}' tidak memiliki izin untuk tindakan ini.`, 403);
    }
    return null;
  };
}

/**
 * Multi-tenant Scoping Check: Rejects if request tries to override school_id.
 */
export function validateSchoolScope(request: AuthenticatedRequest, requestedSchoolId?: string): Response | null {
  if (!request.user) {
    return errorResponse('UNAUTHENTICATED', 'Pengguna belum diautentikasi.', 401);
  }
  if (requestedSchoolId && requestedSchoolId !== request.user.schoolId) {
    return errorResponse('FORBIDDEN', 'Pelanggaran isolasi sekolah: dilarang mengakses data sekolah lain.', 403);
  }
  return null;
}
