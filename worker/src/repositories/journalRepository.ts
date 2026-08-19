export interface JournalRecord {
  id: string;
  school_id: string;
  assignment_id: string;
  date: string;
  meeting_no: number;
  material_covered: string;
  teaching_method?: string | null;
  student_attendance_summary?: string | null;
  class_situation_notes?: string | null;
  follow_up_action?: string | null;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export class JournalRepository {
  constructor(private db: D1Database) {}

  async list(schoolId: string, options: { assignmentId?: string; classId?: string; date?: string; page?: number; pageSize?: number } = {}): Promise<{ data: any[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['j.school_id = ?'];
    const params: any[] = [schoolId];

    if (options.assignmentId) {
      conditions.push('j.assignment_id = ?');
      params.push(options.assignmentId);
    }
    if (options.classId) {
      conditions.push('ta.class_id = ?');
      params.push(options.classId);
    }
    if (options.date) {
      conditions.push('j.date = ?');
      params.push(options.date);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*) as total
      FROM teaching_journals j
      JOIN teacher_assignments ta ON ta.id = j.assignment_id
      WHERE ${whereClause};
    `;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    const listQuery = `
      SELECT 
        j.id, j.school_id, j.assignment_id, j.date, j.meeting_no, j.material_covered, j.teaching_method,
        j.student_attendance_summary, j.class_situation_notes, j.follow_up_action, j.created_at,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name
      FROM teaching_journals j
      JOIN teacher_assignments ta ON ta.id = j.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE ${whereClause}
      ORDER BY j.date DESC, j.meeting_no DESC
      LIMIT ? OFFSET ?;
    `;

    const listResult = await this.db.prepare(listQuery).bind(...params, pageSize, offset).all();
    return { data: listResult.results, total };
  }

  async findById(schoolId: string, journalId: string): Promise<any | null> {
    const query = `
      SELECT 
        j.id, j.school_id, j.assignment_id, j.date, j.meeting_no, j.material_covered, j.teaching_method,
        j.student_attendance_summary, j.class_situation_notes, j.follow_up_action, j.created_at,
        ta.class_id, ta.subject_id, ta.teacher_id,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name
      FROM teaching_journals j
      JOIN teacher_assignments ta ON ta.id = j.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE j.school_id = ? AND j.id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId, journalId).first();
  }

  async delete(schoolId: string, journalId: string): Promise<void> {
    await this.db.prepare(`DELETE FROM teaching_journals WHERE school_id = ? AND id = ?;`).bind(schoolId, journalId).run();
  }
}
