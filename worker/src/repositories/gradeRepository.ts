export interface GradeRecord {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
}

export class GradeRepository {
  constructor(private db: D1Database) {}

  async listByAssessment(assessmentId: string): Promise<any[]> {
    const query = `
      SELECT 
        g.id as grade_id, g.assessment_id, g.student_id, g.score, g.feedback, g.updated_at,
        s.nis, s.name as student_name, s.gender
      FROM grades g
      JOIN students s ON s.id = g.student_id
      WHERE g.assessment_id = ?
      ORDER BY s.name ASC;
    `;
    const result = await this.db.prepare(query).bind(assessmentId).all();
    return result.results;
  }

  async listStudentGrades(schoolId: string, studentId: string, options: { academicTermId?: string; subjectId?: string } = {}): Promise<any[]> {
    const conditions: string[] = ['a.school_id = ? AND g.student_id = ?'];
    const params: any[] = [schoolId, studentId];

    if (options.academicTermId) {
      conditions.push('ta.academic_term_id = ?');
      params.push(options.academicTermId);
    }
    if (options.subjectId) {
      conditions.push('ta.subject_id = ?');
      params.push(options.subjectId);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT 
        g.id as grade_id, g.score, g.feedback,
        a.id as assessment_id, a.title as assessment_title, a.type as assessment_type, a.weight, a.max_score, a.passing_score, a.assessment_date,
        sub.name as subject_name, sub.code as subject_code
      FROM grades g
      JOIN assessments a ON a.id = g.assessment_id
      JOIN teacher_assignments ta ON ta.id = a.assignment_id
      JOIN subjects sub ON sub.id = ta.subject_id
      WHERE ${whereClause}
      ORDER BY a.assessment_date DESC;
    `;

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async findById(gradeId: string): Promise<any | null> {
    const query = `
      SELECT 
        g.id, g.assessment_id, g.student_id, g.score, g.feedback,
        a.assignment_id, a.school_id,
        ta.teacher_id, ta.class_id
      FROM grades g
      JOIN assessments a ON a.id = g.assessment_id
      JOIN teacher_assignments ta ON ta.id = a.assignment_id
      WHERE g.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(gradeId).first();
  }
}
