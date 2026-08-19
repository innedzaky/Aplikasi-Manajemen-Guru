export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: string;
  created_at: string;
}

export class SessionRepository {
  constructor(private db: D1Database) {}

  async create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: string;
  }): Promise<void> {
    const query = `
      INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.userId, data.tokenHash, data.ipAddress || null, data.userAgent || null, data.expiresAt)
      .run();
  }

  async findByTokenHash(tokenHash: string): Promise<any | null> {
    const query = `
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
      WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.is_active = 1
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(tokenHash).first();
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.prepare(`DELETE FROM sessions WHERE token_hash = ?;`).bind(tokenHash).run();
  }

  async deleteByIdAndUserId(sessionId: string, userId: string): Promise<void> {
    await this.db.prepare(`DELETE FROM sessions WHERE id = ? AND user_id = ?;`).bind(sessionId, userId).run();
  }

  async deleteAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.db.prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?;`).bind(userId, currentSessionId).run();
  }

  async listActiveByUser(userId: string): Promise<SessionRecord[]> {
    const query = `
      SELECT id, user_id, token_hash, ip_address, user_agent, expires_at, created_at
      FROM sessions
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC;
    `;
    const result = await this.db.prepare(query).bind(userId).all<SessionRecord>();
    return result.results;
  }
}
