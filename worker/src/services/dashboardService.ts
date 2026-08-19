import { Env, UserSessionPayload } from '../types';

export class DashboardService {
  constructor(private env: Env) {}

  async getDashboardSummary(user: UserSessionPayload): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    if (user.role === 'GURU' && user.teacherId) {
      // Teacher-specific dashboard directly from D1
      const assignmentsQuery = `
        SELECT 
          ta.id as assignment_id,
          cls.name as class_name,
          sub.name as subject_name,
          COALESCE(ta.custom_kkm, sub.default_kkm) as kkm,
          (SELECT COUNT(*) FROM student_enrollments se WHERE se.class_id = ta.class_id AND se.is_active = 1) as total_students,
          (SELECT COUNT(*) FROM attendance_sessions att WHERE att.assignment_id = ta.id) as total_sessions_held,
          (SELECT COUNT(*) FROM assessments ass WHERE ass.assignment_id = ta.id) as total_assessments
        FROM teacher_assignments ta
        JOIN classes cls ON cls.id = ta.class_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ta.teacher_id = ? AND ta.school_id = ? AND ta.is_active = 1;
      `;
      const assignmentsResult = await this.env.DB.prepare(assignmentsQuery).bind(user.teacherId, user.schoolId).all();

      const recentJournals = await this.env.DB.prepare(`
        SELECT j.date, j.meeting_no, j.material_covered, cls.name as class_name, sub.name as subject_name
        FROM teaching_journals j
        JOIN teacher_assignments ta ON ta.id = j.assignment_id
        JOIN classes cls ON cls.id = ta.class_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ta.teacher_id = ? AND j.school_id = ?
        ORDER BY j.date DESC, j.created_at DESC
        LIMIT 5;
      `).bind(user.teacherId, user.schoolId).all();

      return {
        role: 'GURU',
        teacherName: user.name,
        totalClassesAssigned: assignmentsResult.results.length,
        assignments: assignmentsResult.results,
        recentJournals: recentJournals.results
      };
    }

    // Global School Summary for OWNER & ADMIN
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM teachers WHERE school_id = ? AND is_active = 1) as total_teachers,
        (SELECT COUNT(*) FROM students WHERE school_id = ? AND is_active = 1) as total_students,
        (SELECT COUNT(*) FROM classes WHERE school_id = ? AND is_active = 1) as total_classes,
        (SELECT COUNT(*) FROM subjects WHERE school_id = ? AND is_active = 1) as total_subjects,
        (SELECT COUNT(*) FROM attendance_sessions WHERE school_id = ? AND date = ?) as today_attendance_sessions,
        (SELECT COUNT(*) FROM teaching_journals WHERE school_id = ? AND date = ?) as today_teaching_journals,
        (SELECT COUNT(*) FROM sync_queue WHERE school_id = ? AND status = 'PENDING') as pending_sync_items;
    `;

    const stats = await this.env.DB.prepare(statsQuery).bind(
      user.schoolId, user.schoolId, user.schoolId, user.schoolId, user.schoolId, today, user.schoolId, today, user.schoolId
    ).first();

    return {
      role: user.role,
      schoolId: user.schoolId,
      today,
      metrics: stats
    };
  }
}
