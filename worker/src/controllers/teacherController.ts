import { Env } from '../types';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { TeacherRepository } from '../repositories/teacherRepository';
import { UserRepository } from '../repositories/userRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { hashPassword } from '../utils/crypto';
import { logAudit } from '../utils/audit';

export class TeacherController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const search = url.searchParams.get('search') || undefined;

    const repo = new TeacherRepository(env.DB);
    const result = await repo.list(request.user!.schoolId, { page, pageSize, search });

    return jsonResponse(result.data, 200, {}, {
      total: result.total,
      page,
      limit: pageSize
    });
  }

  static async getById(request: AuthenticatedRequest, env: Env, teacherId: string): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const repo = new TeacherRepository(env.DB);
    const teacher = await repo.findById(request.user!.schoolId, teacherId);
    if (!teacher) {
      return errorResponse('NOT_FOUND', 'Data guru tidak ditemukan.', 404);
    }
    return jsonResponse(teacher);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const { name, nip, email, phone, specialization, username, password } = body;

    if (!name) {
      return errorResponse('VALIDATION_ERROR', 'Nama guru wajib diisi.', 400);
    }

    const schoolId = request.user!.schoolId;
    let userId: string | null = null;

    // Create linked login account if username & password provided
    if (username && password) {
      const userRepo = new UserRepository(env.DB);
      const existingUser = await userRepo.findByUsername(schoolId, username);
      if (existingUser) {
        return errorResponse('DUPLICATE_USERNAME', 'Username sudah digunakan di sekolah ini.', 409);
      }

      userId = crypto.randomUUID();
      const pwHash = await hashPassword(password);
      await userRepo.createUser({
        id: userId,
        schoolId,
        username,
        passwordHash: pwHash,
        role: 'GURU'
      });
    }

    const teacherId = crypto.randomUUID();
    const teacherRepo = new TeacherRepository(env.DB);
    await teacherRepo.create({
      id: teacherId,
      schoolId,
      userId,
      nip,
      name,
      email,
      phone,
      specialization
    });

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: schoolId,
      entity_type: 'TEACHER',
      entity_id: teacherId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: teacherId,
        nip: nip || '',
        name,
        email: email || '',
        phone: phone || '',
        specialization: specialization || '',
        is_active: 1
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'teachers',
      recordId: teacherId,
      newValues: { name, nip, specialization }
    });

    return jsonResponse({ message: 'Guru baru berhasil ditambahkan.', teacherId, id: teacherId }, 201);
  }

  static async update(request: AuthenticatedRequest, env: Env, teacherId: string): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const repo = new TeacherRepository(env.DB);
    const existing = await repo.findById(request.user!.schoolId, teacherId);
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Data guru tidak ditemukan.', 404);
    }

    const body = await request.json().catch(() => ({})) as any;
    await repo.update(request.user!.schoolId, teacherId, body);

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: request.user!.schoolId,
      entity_type: 'TEACHER',
      entity_id: teacherId,
      action: 'UPDATE',
      payload_json: JSON.stringify({
        id: teacherId,
        ...body
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId: request.user!.schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'teachers',
      recordId: teacherId,
      newValues: body
    });

    return jsonResponse({ message: 'Data guru berhasil diperbarui.' });
  }

  static async delete(request: AuthenticatedRequest, env: Env, teacherId: string): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const repo = new TeacherRepository(env.DB);
    const existing = await repo.findById(request.user!.schoolId, teacherId);
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Data guru tidak ditemukan.', 404);
    }

    await repo.softDelete(request.user!.schoolId, teacherId);

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: request.user!.schoolId,
      entity_type: 'TEACHER',
      entity_id: teacherId,
      action: 'DELETE',
      payload_json: JSON.stringify({
        id: teacherId,
        is_active: 0
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId: request.user!.schoolId,
      userId: request.user!.userId,
      action: 'DELETE',
      tableName: 'teachers',
      recordId: teacherId
    });

    return jsonResponse({ message: 'Guru berhasil dinonaktifkan.' });
  }
}
