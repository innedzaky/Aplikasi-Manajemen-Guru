export interface AssessmentRecord {
  id: string;
  school_id: string;
  assignment_id: string;
  title: string;
  type: 'TUGAS' | 'UH' | 'PTS' | 'PAS' | 'PAT' | 'PRAKTIK' | 'PROYEK';
  weight: number;
  max_score: number;
  passing_score: number;
  assessment_date: string;
  description?: string | null;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export class AssessmentRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { assignmentId?: string; type?: string; classId?: string } = {}): Promise<any[]> {
    const conditions: string[] = ['a.school_id = ?'];
    const params: any[] = [schoolId];

    if (options.assignmentId) {
      conditions.push('a.assignment_id = ?');
      params.push(options.assignmentId);
    }
    if (options.type) {
      conditions.push('a.type = ?');
      params.push(options.type);
    }
    if (options.classId) {
      conditions.push('ta.class_id = ?');
      params.push(options.classId);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT 
        a.id, a.school_id, a.assignment_id, a.title, a.type, a.weight, a.max_score, a.passing_score, a.assessment_date, a.description, a.created_at,
        ta.class_id, ta.subject_id, ta.teacher_id,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name,
        (SELECT COUNT(*) FROM grades g WHERE g.assessment_id = a.id) as graded_students_count,
        (SELECT AVG(g.score) FROM grades g WHERE g.assessment_id = a.id) as average_score
      FROM assessments a
      JOIN teacher_assignments ta ON ta.id = a.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE ${whereClause}
      ORDER BY a.assessment_date DESC, a.created_at DESC;
    `;

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results;
  }

  async findById(schoolId: string, assessmentId: string): Promise<any | null> {
    const query = `
      SELECT 
        a.id, a.school_id, a.assignment_id, a.title, a.type, a.weight, a.max_score, a.passing_score, a.assessment_date, a.description, a.created_at,
        ta.class_id, ta.subject_id, ta.teacher_id,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name
      FROM assessments a
      JOIN teacher_assignments ta ON ta.id = a.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE a.school_id = ? AND a.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, assessmentId).first();
  }

  async delete(schoolId: string, assessmentId: string): Promise<void> {
    await this.db.prepare(`DELETE FROM assessments WHERE school_id = ? AND id = ?;`).bind(schoolId, assessmentId).run();
  }
}
