export interface StudentEnrollmentRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'DROPOUT';
  is_active: number;
}

export class EnrollmentRepository {
  constructor(private db: D1Database) {}

  async listStudentsByClass(schoolId: string, classId: string): Promise<any[]> {
    const query = `
      SELECT 
        s.id as student_id, s.nis, s.nisn, s.name, s.gender,
        se.id as enrollment_id, se.status, se.enrolled_at
      FROM student_enrollments se
      JOIN students s ON s.id = se.student_id
      WHERE se.school_id = ? AND se.class_id = ? AND se.is_active = 1 AND s.is_active = 1
      ORDER BY s.name ASC;
    `;
    const result = await this.db.prepare(query).bind(schoolId, classId).all();
    return result.results;
  }

  async enrollStudent(data: {
    id: string;
    schoolId: string;
    studentId: string;
    classId: string;
    academicYearId: string;
  }): Promise<void> {
    const query = `
      INSERT INTO student_enrollments (id, school_id, student_id, class_id, academic_year_id, status, is_active)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1);
    `;
    await this.db.prepare(query)
      .bind(data.id, data.schoolId, data.studentId, data.classId, data.academicYearId)
      .run();
  }

  async checkEnrollment(schoolId: string, classId: string, studentIds: string[]): Promise<string[]> {
    if (studentIds.length === 0) return [];
    const placeholders = studentIds.map(() => '?').join(',');
    const query = `
      SELECT student_id 
      FROM student_enrollments 
      WHERE school_id = ? AND class_id = ? AND is_active = 1 AND student_id IN (${placeholders});
    `;
    const result = await this.db.prepare(query).bind(schoolId, classId, ...studentIds).all<{ student_id: string }>();
    return result.results.map(r => r.student_id);
  }
}
