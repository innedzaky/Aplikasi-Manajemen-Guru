export interface TeacherAssignmentRecord {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  academic_term_id: string;
  custom_kkm?: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class AssignmentRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { teacherId?: string; classId?: string; academicTermId?: string } = {}): Promise<any[]> {
    const conditions: string[] = ['ta.school_id = ? AND ta.is_active = 1'];
    const params: any[] = [schoolId];

    if (options.teacherId) {
      conditions.push('ta.teacher_id = ?');
      params.push(options.teacherId);
    }
    if (options.classId) {
      conditions.push('ta.class_id = ?');
      params.push(options.classId);
    }
    if (options.academicTermId) {
      conditions.push('ta.academic_term_id = ?');
      params.push(options.academicTermId);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT 
        ta.id, ta.school_id, ta.teacher_id, ta.subject_id, ta.class_id, ta.academic_term_id, ta.custom_kkm, ta.is_active,
        t.name as teacher_name, t.nip as teacher_nip,
        sub.name as subject_name, sub.code as subject_code, COALESCE(ta.custom_kkm, sub.default_kkm) as kkm,
        cls.name as class_name, cls.level as class_level,
        term.name as academic_term_name,
        ay.name as academic_year_name,
        (SELECT COUNT(*) FROM student_enrollments se WHERE se.class_id = ta.class_id AND se.is_active = 1) as total_students
      FROM teacher_assignments ta
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      JOIN academic_terms term ON term.id = ta.academic_term_id
      JOIN academic_years ay ON ay.id = term.academic_year_id
      WHERE ${whereClause}
      ORDER BY cls.name ASC, sub.name ASC;
    `;

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async findById(schoolId: string, assignmentId: string): Promise<any | null> {
    const query = `
      SELECT 
        ta.id, ta.school_id, ta.teacher_id, ta.subject_id, ta.class_id, ta.academic_term_id, ta.custom_kkm, ta.is_active,
        t.name as teacher_name, t.nip as teacher_nip,
        sub.name as subject_name, sub.code as subject_code, COALESCE(ta.custom_kkm, sub.default_kkm) as kkm,
        cls.name as class_name, cls.level as class_level,
        term.name as academic_term_name,
        ay.name as academic_year_name
      FROM teacher_assignments ta
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      JOIN academic_terms term ON term.id = ta.academic_term_id
      JOIN academic_years ay ON ay.id = term.academic_year_id
      WHERE ta.school_id = ? AND ta.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, assignmentId).first();
  }

  async create(data: {
    id: string;
    schoolId: string;
    teacherId: string;
    subjectId: string;
    classId: string;
    academicTermId: string;
    customKkm?: number | null;
  }): Promise<void> {
    const query = `
      INSERT INTO teacher_assignments (id, school_id, teacher_id, subject_id, class_id, academic_term_id, custom_kkm, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.teacherId, data.subjectId, data.classId, data.academicTermId, data.customKkm || null)
      .run();
  }

  async delete(schoolId: string, assignmentId: string): Promise<void> {
    await this.db.prepare(`DELETE FROM teacher_assignments WHERE school_id = ? AND id = ?;`).bind(schoolId, assignmentId).run();
  }
}
