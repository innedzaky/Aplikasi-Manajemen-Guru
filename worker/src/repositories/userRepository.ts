import { UserRole } from '../types';

export interface UserRecord {
  id: string;
  school_id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  constructor(private db: D1Database) {}

  async findByUsername(schoolId: string, username: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, school_id, username, password_hash, role, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE school_id = ? AND username = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, username.trim()).first<UserRecord>();
  }

  async findById(schoolId: string, userId: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, school_id, username, password_hash, role, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE school_id = ? AND id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, userId).first<UserRecord>();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = `
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?;
    `;
    await this.db.prepare(query).bind(passwordHash, userId).run();
  }

  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login_at = datetime('now')
      WHERE id = ?;
    `;
    await this.db.prepare(query).bind(userId).run();
  }

  async createUser(data: {
    id: string;
    schoolId: string;
    username: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<void> {
    const query = `
      INSERT INTO users (id, school_id, username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query).bind(data.id, data.schoolId, data.username, data.passwordHash, data.role).run();
  }
}
