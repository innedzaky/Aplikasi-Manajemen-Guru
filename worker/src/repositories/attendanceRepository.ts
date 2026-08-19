export interface AttendanceSessionRecord {
  id: string;
  school_id: string;
  assignment_id: string;
  date: string;
  meeting_no: number;
  time_start?: string | null;
  time_end?: string | null;
  topic?: string | null;
  created_by_user_id?: string | null;
}

export interface AttendanceRecordItem {
  id: string;
  session_id: string;
  student_id: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPENSASI';
  notes?: string | null;
}

export class AttendanceRepository {
  constructor(private db: D1Database) {}

  async listSessions(schoolId: string, options: { assignmentId?: string; classId?: string; date?: string; page?: number; pageSize?: number } = {}): Promise<{ data: any[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['s.school_id = ?'];
    const params: any[] = [schoolId];

    if (options.assignmentId) {
      conditions.push('s.assignment_id = ?');
      params.push(options.assignmentId);
    }
    if (options.classId) {
      conditions.push('ta.class_id = ?');
      params.push(options.classId);
    }
    if (options.date) {
      conditions.push('s.date = ?');
      params.push(options.date);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_sessions s
      JOIN teacher_assignments ta ON ta.id = s.assignment_id
      WHERE ${whereClause};
    `;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    const listQuery = `
      SELECT 
        s.id, s.school_id, s.assignment_id, s.date, s.meeting_no, s.time_start, s.time_end, s.topic, s.created_at,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name,
        (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'HADIR') as present_count,
        (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'SAKIT') as sick_count,
        (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'IZIN') as permit_count,
        (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id = s.id AND r.status = 'ALPA') as absent_count,
        (SELECT COUNT(*) FROM attendance_records r WHERE r.session_id = s.id) as total_recorded
      FROM attendance_sessions s
      JOIN teacher_assignments ta ON ta.id = s.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE ${whereClause}
      ORDER BY s.date DESC, s.meeting_no DESC
      LIMIT ? OFFSET ?;
    `;

    const listResult = await this.db.prepare(listQuery).bind(...params, pageSize, offset).all();
    return { data: listResult.results, total };
  }

  async getSessionWithRecords(schoolId: string, sessionId: string): Promise<any | null> {
    const sessionQuery = `
      SELECT 
        s.id, s.school_id, s.assignment_id, s.date, s.meeting_no, s.time_start, s.time_end, s.topic, s.created_at,
        ta.class_id, ta.subject_id, ta.teacher_id,
        t.name as teacher_name,
        sub.name as subject_name,
        cls.name as class_name
      FROM attendance_sessions s
      JOIN teacher_assignments ta ON ta.id = s.assignment_id
      JOIN teachers t ON t.id = ta.teacher_id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN classes cls ON cls.id = ta.class_id
      WHERE s.school_id = ? AND s.id = ?
      LIMIT 1;
    `;
    const session = await this.db.prepare(sessionQuery).bind(schoolId, sessionId).first<any>();
    if (!session) return null;

    const recordsQuery = `
      SELECT 
        r.id, r.student_id, r.status, r.notes,
        st.nis, st.name as student_name, st.gender
      FROM attendance_records r
      JOIN students st ON st.id = r.student_id
      WHERE r.session_id = ?
      ORDER BY st.name ASC;
    `;
    const records = await this.db.prepare(recordsQuery).bind(sessionId).all();
    session.records = records.results;

    return session;
  }

  async findExistingSession(assignmentId: string, date: string, meetingNo: number): Promise<any | null> {
    const query = `
      SELECT id FROM attendance_sessions
      WHERE assignment_id = ? AND date = ? AND meeting_no = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(assignmentId, date, meetingNo).first();
  }
}
