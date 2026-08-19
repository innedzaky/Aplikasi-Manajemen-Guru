import { Env, UserSessionPayload } from '../types';

export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'SESSION_REVOKED'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'MASTER_DATA_CHANGE'
  | 'GRADE_CHANGE'
  | 'ATTENDANCE_CHANGE'
  | 'ATTENDANCE_CREATE'
  | 'JOURNAL_CHANGE'
  | 'PERMISSION_DENIED'
  | 'PASSWORD_CHANGED'
  | 'SYNC_CONFIGURATION_CHANGE';

export async function logAudit(
  env: Env,
  params: {
    schoolId: string;
    userId?: string | null;
    action: AuditAction;
    tableName: string;
    recordId?: string | null;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    ipAddress?: string | null;
  }
): Promise<void> {
  try {
    const sanitize = (data?: Record<string, any> | null) => {
      if (!data) return null;
      const clone = { ...data };
      delete clone.password;
      delete clone.password_hash;
      delete clone.token;
      delete clone.token_hash;
      delete clone.cookie;
      return JSON.stringify(clone);
    };

    const query = `
      INSERT INTO audit_logs (school_id, user_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await env.DB.prepare(query)
      .bind(
        params.schoolId,
        params.userId || null,
        params.action,
        params.tableName,
        params.recordId || null,
        sanitize(params.oldValues),
        sanitize(params.newValues),
        params.ipAddress || null
      )
      .run();
  } catch (err) {
    // Non-blocking log error
    console.error('Audit log failed:', err);
  }
}
