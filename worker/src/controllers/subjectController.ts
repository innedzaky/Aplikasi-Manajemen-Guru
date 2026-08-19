import { Env } from '../types';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { SubjectRepository } from '../repositories/subjectRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';

export class SubjectController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const repo = new SubjectRepository(env.DB);
    const subjects = await repo.list(request.user!.schoolId, { category, search });
    return jsonResponse(subjects);
  }

  static async getById(request: AuthenticatedRequest, env: Env, subjectId: string): Promise<Response> {
    const repo = new SubjectRepository(env.DB);
    const subject = await repo.findById(request.user!.schoolId, subjectId);
    if (!subject) {
      return errorResponse('NOT_FOUND', 'Mata pelajaran tidak ditemukan.', 404);
    }
    return jsonResponse(subject);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const { code, name, category, default_kkm } = body;

    if (!code || !name || !category) {
      return errorResponse('VALIDATION_ERROR', 'Kode, Nama Mapel, dan Kategori wajib diisi.', 400);
    }

    const schoolId = request.user!.schoolId;
    const subjectId = crypto.randomUUID();
    const repo = new SubjectRepository(env.DB);

    await repo.create({
      id: subjectId,
      schoolId,
      code,
      name,
      category,
      defaultKkm: default_kkm
    });

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: schoolId,
      entity_type: 'SUBJECT',
      entity_id: subjectId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: subjectId,
        code,
        name,
        category,
        default_kkm: default_kkm || 75.0,
        is_active: 1
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'subjects',
      recordId: subjectId,
      newValues: { name, code, category }
    });

    return jsonResponse({ message: 'Mata pelajaran baru berhasil ditambahkan.', subjectId, id: subjectId }, 201);
  }
}
