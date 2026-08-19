import { Env } from '../types';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { AssignmentRepository } from '../repositories/assignmentRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';

export class AssignmentController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let teacherId = url.searchParams.get('teacherId') || undefined;
    const classId = url.searchParams.get('classId') || undefined;
    const academicTermId = url.searchParams.get('academicTermId') || undefined;

    // Guru can only view their own assignments if specified or scoped
    if (request.user!.role === 'GURU') {
      teacherId = request.user!.teacherId || '__NO_TEACHER__';
    }

    const repo = new AssignmentRepository(env.DB);
    const assignments = await repo.list(request.user!.schoolId, { teacherId, classId, academicTermId });
    return jsonResponse(assignments);
  }

  static async getById(request: AuthenticatedRequest, env: Env, assignmentId: string): Promise<Response> {
    const repo = new AssignmentRepository(env.DB);
    const assignment = await repo.findById(request.user!.schoolId, assignmentId);
    if (!assignment) {
      return errorResponse('NOT_FOUND', 'Penugasan mengajar tidak ditemukan.', 404);
    }
    return jsonResponse(assignment);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const { teacher_id, subject_id, class_id, academic_term_id, custom_kkm } = body;

    if (!teacher_id || !subject_id || !class_id || !academic_term_id) {
      return errorResponse('VALIDATION_ERROR', 'Guru, Mata Pelajaran, Kelas, dan Semester wajib diisi.', 400);
    }

    const schoolId = request.user!.schoolId;
    const assignmentId = crypto.randomUUID();
    const repo = new AssignmentRepository(env.DB);

    await repo.create({
      id: assignmentId,
      schoolId,
      teacherId: teacher_id,
      subjectId: subject_id,
      classId: class_id,
      academicTermId: academic_term_id,
      customKkm: custom_kkm
    });

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: schoolId,
      entity_type: 'ASSIGNMENT',
      entity_id: assignmentId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: assignmentId,
        teacher_id,
        subject_id,
        class_id,
        academic_term_id,
        custom_kkm: custom_kkm || 75.0,
        is_active: 1
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'teacher_assignments',
      recordId: assignmentId,
      newValues: { teacher_id, subject_id, class_id }
    });

    return jsonResponse({ message: 'Penugasan mengajar berhasil dibuat.', assignmentId, id: assignmentId }, 201);
  }

  static async delete(request: AuthenticatedRequest, env: Env, assignmentId: string): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const repo = new AssignmentRepository(env.DB);
    const existing = await repo.findById(request.user!.schoolId, assignmentId);
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Penugasan mengajar tidak ditemukan.', 404);
    }

    await repo.delete(request.user!.schoolId, assignmentId);

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: request.user!.schoolId,
      entity_type: 'ASSIGNMENT',
      entity_id: assignmentId,
      action: 'DELETE',
      payload_json: JSON.stringify({
        id: assignmentId,
        is_active: 0
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId: request.user!.schoolId,
      userId: request.user!.userId,
      action: 'DELETE',
      tableName: 'teacher_assignments',
      recordId: assignmentId
    });

    return jsonResponse({ message: 'Penugasan mengajar berhasil dihapus.' });
  }
}
