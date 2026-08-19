import { Env, UserSessionPayload } from '../types';

/**
 * Verifies if the authenticated teacher is authorized to access the given assignment.
 * OWNERS and ADMINS automatically have full access within their school.
 * GURU must be explicitly assigned in `teacher_assignments`.
 */
export async function authorizeAssignment(
  env: Env,
  user: UserSessionPayload,
  assignmentId: string
): Promise<{ authorized: boolean; assignment?: any; reason?: string }> {
  if (user.role === 'OWNER' || user.role === 'ADMIN') {
    // Check if assignment exists within the user's school
    const checkQuery = `
      SELECT id, school_id, teacher_id, subject_id, class_id, academic_term_id
      FROM teacher_assignments
      WHERE id = ? AND school_id = ?
      LIMIT 1;
    `;
    const asg = await env.DB.prepare(checkQuery).bind(assignmentId, user.schoolId).first();
    if (!asg) {
      return { authorized: false, reason: 'Penugasan mengajar tidak ditemukan di sekolah ini.' };
    }
    return { authorized: true, assignment: asg };
  }

  if (user.role === 'GURU') {
    if (!user.teacherId) {
      return { authorized: false, reason: 'Profil guru tidak terhubung dengan akun Anda.' };
    }

    const guruQuery = `
      SELECT ta.id, ta.school_id, ta.teacher_id, ta.subject_id, ta.class_id, ta.academic_term_id
      FROM teacher_assignments ta
      WHERE ta.id = ? AND ta.school_id = ? AND ta.teacher_id = ?
      LIMIT 1;
    `;
    const asg = await env.DB.prepare(guruQuery).bind(assignmentId, user.schoolId, user.teacherId).first();
    if (!asg) {
      return { authorized: false, reason: 'Anda tidak memiliki hak akses pada kelas/mata pelajaran ini.' };
    }
    return { authorized: true, assignment: asg };
  }

  return { authorized: false, reason: 'Role tidak memiliki izin penugasan.' };
}

/**
 * Validates whether all students in a batch operation are currently enrolled
 * in the specific class assigned to the teacher.
 */
export async function validateStudentsEnrollment(
  env: Env,
  schoolId: string,
  classId: string,
  studentIds: string[]
): Promise<{ valid: boolean; invalidStudentIds?: string[] }> {
  if (!studentIds || studentIds.length === 0) {
    return { valid: true };
  }

  const placeholders = studentIds.map(() => '?').join(',');
  const query = `
    SELECT se.student_id
    FROM student_enrollments se
    JOIN students s ON s.id = se.student_id
    WHERE se.school_id = ? 
      AND se.class_id = ? 
      AND se.is_active = 1
      AND s.is_active = 1
      AND se.student_id IN (${placeholders});
  `;

  const results = await env.DB.prepare(query)
    .bind(schoolId, classId, ...studentIds)
    .all<{ student_id: string }>();

  const enrolledSet = new Set(results.results.map(r => r.student_id));
  const invalidStudents = studentIds.filter(id => !enrolledSet.has(id));

  if (invalidStudents.length > 0) {
    return { valid: false, invalidStudentIds: invalidStudents };
  }

  return { valid: true };
}

/**
 * Validates ownership for specific object IDs (Attendance session, Assessment, Grade, Journal)
 */
export async function authorizeResourceOwnership(
  env: Env,
  user: UserSessionPayload,
  table: 'attendance_sessions' | 'assessments' | 'teaching_journals',
  resourceId: string
): Promise<{ authorized: boolean; resource?: any; reason?: string }> {
  const query = `
    SELECT r.id, r.assignment_id, ta.teacher_id, ta.class_id
    FROM ${table} r
    JOIN teacher_assignments ta ON ta.id = r.assignment_id
    WHERE r.id = ? AND r.school_id = ?
    LIMIT 1;
  `;

  const resource = await env.DB.prepare(query).bind(resourceId, user.schoolId).first<any>();
  if (!resource) {
    return { authorized: false, reason: 'Data tidak ditemukan.' };
  }

  if (user.role === 'OWNER' || user.role === 'ADMIN') {
    return { authorized: true, resource };
  }

  if (user.role === 'GURU') {
    if (resource.teacher_id !== user.teacherId) {
      return { authorized: false, reason: 'Anda bukan pemilik data kegiatan ini.' };
    }
    return { authorized: true, resource };
  }

  return { authorized: false, reason: 'Akses ditolak.' };
}
