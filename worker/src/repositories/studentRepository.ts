export interface StudentRecord {
  id: string;
  school_id: string;
  nis: string;
  nisn?: string | null;
  name: string;
  gender: 'L' | 'P';
  birth_place?: string | null;
  birth_date?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  address?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class StudentRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { page?: number; pageSize?: number; classId?: string; search?: string; isActive?: boolean } = {}): Promise<{ data: any[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['s.school_id = ?'];
    const params: any[] = [schoolId];

    if (options.isActive !== undefined) {
      conditions.push('s.is_active = ?');
      params.push(options.isActive ? 1 : 0);
    }

    if (options.classId) {
      conditions.push('se.class_id = ? AND se.is_active = 1');
      params.push(options.classId);
    }

    if (options.search) {
      conditions.push('(s.name LIKE ? OR s.nis LIKE ? OR s.nisn LIKE ?)');
      const term = `%${options.search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(DISTINCT s.id) as total 
      FROM students s
      LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.is_active = 1
      WHERE ${whereClause};
    `;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    const listQuery = `
      SELECT 
        s.id, s.school_id, s.nis, s.nisn, s.name, s.gender, s.birth_place, s.birth_date,
        s.parent_name, s.parent_phone, s.address, s.is_active,
        cls.id as class_id, cls.name as class_name
      FROM students s
      LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.is_active = 1
      LEFT JOIN classes cls ON cls.id = se.class_id
      WHERE ${whereClause}
      ORDER BY s.name ASC
      LIMIT ? OFFSET ?;
    `;

    const listResult = await this.db.prepare(listQuery).bind(...params, pageSize, offset).all();
    return { data: listResult.results, total };
  }

  async findById(schoolId: string, studentId: string): Promise<any | null> {
    const query = `
      SELECT 
        s.id, s.school_id, s.nis, s.nisn, s.name, s.gender, s.birth_place, s.birth_date,
        s.parent_name, s.parent_phone, s.address, s.is_active,
        cls.id as class_id, cls.name as class_name
      FROM students s
      LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.is_active = 1
      LEFT JOIN classes cls ON cls.id = se.class_id
      WHERE s.school_id = ? AND s.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, studentId).first();
  }

  async create(data: {
    id: string;
    schoolId: string;
    nis: string;
    nisn?: string | null;
    name: string;
    gender: 'L' | 'P';
    birthPlace?: string | null;
    birthDate?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    address?: string | null;
  }): Promise<void> {
    const query = `
      INSERT INTO students (id, school_id, nis, nisn, name, gender, birth_place, birth_date, parent_name, parent_phone, address, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.nis, data.nisn || null, data.name, data.gender, data.birthPlace || null, data.birthDate || null, data.parentName || null, data.parentPhone || null, data.address || null)
      .run();
  }

  async update(schoolId: string, studentId: string, data: Partial<StudentRecord>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.nis !== undefined) { fields.push('nis = ?'); values.push(data.nis); }
    if (data.nisn !== undefined) { fields.push('nisn = ?'); values.push(data.nisn); }
    if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender); }
    if (data.birth_place !== undefined) { fields.push('birth_place = ?'); values.push(data.birth_place); }
    if (data.birth_date !== undefined) { fields.push('birth_date = ?'); values.push(data.birth_date); }
    if (data.parent_name !== undefined) { fields.push('parent_name = ?'); values.push(data.parent_name); }
    if (data.parent_phone !== undefined) { fields.push('parent_phone = ?'); values.push(data.parent_phone); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");

    const query = `UPDATE students SET ${fields.join(', ')} WHERE school_id = ? AND id = ?;`;
    values.push(schoolId, studentId);

    await this.db.prepare(query).bind(...values).run();
  }
}
