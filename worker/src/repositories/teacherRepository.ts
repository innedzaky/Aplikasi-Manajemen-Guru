export interface TeacherRecord {
  id: string;
  school_id: string;
  user_id?: string | null;
  nip?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class TeacherRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { page?: number; pageSize?: number; search?: string; isActive?: boolean } = {}): Promise<{ data: any[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['t.school_id = ?'];
    const params: any[] = [schoolId];

    if (options.isActive !== undefined) {
      conditions.push('t.is_active = ?');
      params.push(options.isActive ? 1 : 0);
    }

    if (options.search) {
      conditions.push('(t.name LIKE ? OR t.nip LIKE ? OR t.specialization LIKE ?)');
      const term = `%${options.search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM teachers t WHERE ${whereClause};`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    const listQuery = `
      SELECT 
        t.id, t.school_id, t.user_id, t.nip, t.name, t.email, t.phone, t.specialization, t.is_active,
        u.username, u.role
      FROM teachers t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE ${whereClause}
      ORDER BY t.name ASC
      LIMIT ? OFFSET ?;
    `;

    const listResult = await this.db.prepare(listQuery).bind(...params, pageSize, offset).all();
    return { data: listResult.results, total };
  }

  async findById(schoolId: string, teacherId: string): Promise<any | null> {
    const query = `
      SELECT 
        t.id, t.school_id, t.user_id, t.nip, t.name, t.email, t.phone, t.specialization, t.is_active,
        u.username, u.role
      FROM teachers t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.school_id = ? AND t.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, teacherId).first();
  }

  async create(data: {
    id: string;
    schoolId: string;
    userId?: string | null;
    nip?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    specialization?: string | null;
  }): Promise<void> {
    const query = `
      INSERT INTO teachers (id, school_id, user_id, nip, name, email, phone, specialization, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.userId || null, data.nip || null, data.name, data.email || null, data.phone || null, data.specialization || null)
      .run();
  }

  async update(schoolId: string, teacherId: string, data: Partial<TeacherRecord>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.nip !== undefined) { fields.push('nip = ?'); values.push(data.nip); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.specialization !== undefined) { fields.push('specialization = ?'); values.push(data.specialization); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");

    const query = `UPDATE teachers SET ${fields.join(', ')} WHERE school_id = ? AND id = ?;`;
    values.push(schoolId, teacherId);

    await this.db.prepare(query).bind(...values).run();
  }

  async softDelete(schoolId: string, teacherId: string): Promise<void> {
    const query = `UPDATE teachers SET is_active = 0, updated_at = datetime('now') WHERE school_id = ? AND id = ?;`;
    await this.db.prepare(query).bind(schoolId, teacherId).run();
  }
}
