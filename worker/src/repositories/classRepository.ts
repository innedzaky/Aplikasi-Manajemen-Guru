export interface ClassRecord {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  level: number;
  major?: string | null;
  homeroom_teacher_id?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class ClassRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { academicYearId?: string; level?: number; search?: string } = {}): Promise<any[]> {
    const conditions: string[] = ['c.school_id = ? AND c.is_active = 1'];
    const params: any[] = [schoolId];

    if (options.academicYearId) {
      conditions.push('c.academic_year_id = ?');
      params.push(options.academicYearId);
    }
    if (options.level) {
      conditions.push('c.level = ?');
      params.push(options.level);
    }
    if (options.search) {
      conditions.push('c.name LIKE ?');
      params.push(`%${options.search.trim()}%`);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT 
        c.id, c.school_id, c.academic_year_id, c.name, c.level, c.major, c.homeroom_teacher_id, c.is_active,
        ay.name as academic_year_name,
        t.name as homeroom_teacher_name,
        (SELECT COUNT(*) FROM student_enrollments se WHERE se.class_id = c.id AND se.is_active = 1) as total_students
      FROM classes c
      JOIN academic_years ay ON ay.id = c.academic_year_id
      LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
      WHERE ${whereClause}
      ORDER BY c.level ASC, c.name ASC;
    `;

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async findById(schoolId: string, classId: string): Promise<any | null> {
    const query = `
      SELECT 
        c.id, c.school_id, c.academic_year_id, c.name, c.level, c.major, c.homeroom_teacher_id, c.is_active,
        ay.name as academic_year_name,
        t.name as homeroom_teacher_name
      FROM classes c
      JOIN academic_years ay ON ay.id = c.academic_year_id
      LEFT JOIN teachers t ON t.id = c.homeroom_teacher_id
      WHERE c.school_id = ? AND c.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, classId).first();
  }

  async create(data: {
    id: string;
    schoolId: string;
    academicYearId: string;
    name: string;
    level: number;
    major?: string | null;
    homeroomTeacherId?: string | null;
  }): Promise<void> {
    const query = `
      INSERT INTO classes (id, school_id, academic_year_id, name, level, major, homeroom_teacher_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.academicYearId, data.name, data.level, data.major || null, data.homeroomTeacherId || null)
      .run();
  }

  async update(schoolId: string, classId: string, data: Partial<ClassRecord>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
    if (data.major !== undefined) { fields.push('major = ?'); values.push(data.major); }
    if (data.homeroom_teacher_id !== undefined) { fields.push('homeroom_teacher_id = ?'); values.push(data.homeroom_teacher_id); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");

    const query = `UPDATE classes SET ${fields.join(', ')} WHERE school_id = ? AND id = ?;`;
    values.push(schoolId, classId);

    await this.db.prepare(query).bind(...values).run();
  }
}
