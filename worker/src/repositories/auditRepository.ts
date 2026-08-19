import { AuditAction } from '../utils/audit';

export class AuditRepository {
  constructor(private db: D1Database) {}

  prepareInsert(params: {
    schoolId: string;
    userId?: string | null;
    action: AuditAction;
    tableName: string;
    recordId?: string | null;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
  }): D1PreparedStatement {
    const sanitize = (data?: any) => {
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

    return this.db.prepare(query).bind(
      params.schoolId,
      params.userId || null,
      params.action,
      params.tableName,
      params.recordId || null,
      sanitize(params.oldValues),
      sanitize(params.newValues),
      params.ipAddress || null
    );
  }
}
