import { Env } from '../types';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { ClassRepository } from '../repositories/classRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';

export class ClassController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const academicYearId = url.searchParams.get('academicYearId') || undefined;
    const level = url.searchParams.get('level') ? parseInt(url.searchParams.get('level')!, 10) : undefined;
    const search = url.searchParams.get('search') || undefined;

    const repo = new ClassRepository(env.DB);
    const classes = await repo.list(request.user!.schoolId, { academicYearId, level, search });
    return jsonResponse(classes);
  }

  static async getById(request: AuthenticatedRequest, env: Env, classId: string): Promise<Response> {
    const repo = new ClassRepository(env.DB);
    const cls = await repo.findById(request.user!.schoolId, classId);
    if (!cls) {
      return errorResponse('NOT_FOUND', 'Kelas tidak ditemukan.', 404);
    }
    return jsonResponse(cls);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const { name, level, major, homeroom_teacher_id, academic_year_id } = body;

    if (!name || !level || !academic_year_id) {
      return errorResponse('VALIDATION_ERROR', 'Nama kelas, tingkat level, dan tahun ajaran wajib diisi.', 400);
    }

    const schoolId = request.user!.schoolId;
    const classId = crypto.randomUUID();
    const repo = new ClassRepository(env.DB);

    await repo.create({
      id: classId,
      schoolId,
      academicYearId: academic_year_id,
      name,
      level,
      major,
      homeroomTeacherId: homeroom_teacher_id
    });

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: schoolId,
      entity_type: 'CLASS',
      entity_id: classId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: classId,
        name,
        level,
        major: major || '',
        homeroom_teacher_id: homeroom_teacher_id || '',
        academic_year_id,
        is_active: 1
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'classes',
      recordId: classId,
      newValues: { name, level }
    });

    return jsonResponse({ message: 'Kelas baru berhasil dibuat.', classId, id: classId }, 201);
  }
}
