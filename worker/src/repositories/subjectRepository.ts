export interface SubjectRecord {
  id: string;
  school_id: string;
  code: string;
  name: string;
  category: 'WAJIB' | 'PEMINATAN' | 'MUATAN_LOKAL' | 'EKSTRAKURIKULER';
  default_kkm: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class SubjectRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { category?: string; search?: string } = {}): Promise<SubjectRecord[]> {
    const conditions: string[] = ['school_id = ? AND is_active = 1'];
    const params: any[] = [schoolId];

    if (options.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }
    if (options.search) {
      conditions.push('(name LIKE ? OR code LIKE ?)');
      const term = `%${options.search.trim()}%`;
      params.push(term, term);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT id, school_id, code, name, category, default_kkm, is_active, created_at, updated_at
      FROM subjects
      WHERE ${whereClause}
      ORDER BY category ASC, name ASC;
    `;

    const result = await this.db.prepare(query).bind(...params).all<SubjectRecord>();
    return result.results;
  }

  async findById(schoolId: string, subjectId: string): Promise<SubjectRecord | null> {
    const query = `
      SELECT id, school_id, code, name, category, default_kkm, is_active, created_at, updated_at
      FROM subjects
      WHERE school_id = ? AND id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, subjectId).first<SubjectRecord>();
  }

  async create(data: {
    id: string;
    schoolId: string;
    code: string;
    name: string;
    category: string;
    defaultKkm?: number;
  }): Promise<void> {
    const query = `
      INSERT INTO subjects (id, school_id, code, name, category, default_kkm, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.code, data.name, data.category, data.defaultKkm ?? 75.0)
      .run();
  }

  async update(schoolId: string, subjectId: string, data: Partial<SubjectRecord>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.code !== undefined) { fields.push('code = ?'); values.push(data.code); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.default_kkm !== undefined) { fields.push('default_kkm = ?'); values.push(data.default_kkm); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");

    const query = `UPDATE subjects SET ${fields.join(', ')} WHERE school_id = ? AND id = ?;`;
    values.push(schoolId, subjectId);

    await this.db.prepare(query).bind(...values).run();
  }
}
