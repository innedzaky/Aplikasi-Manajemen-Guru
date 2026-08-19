import { Env } from '../types';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { StudentRepository } from '../repositories/studentRepository';
import { EnrollmentRepository } from '../repositories/enrollmentRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';

export class StudentController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const classId = url.searchParams.get('classId') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const repo = new StudentRepository(env.DB);
    const result = await repo.list(request.user!.schoolId, { page, pageSize, classId, search });

    return jsonResponse(result.data, 200, {}, {
      total: result.total,
      page,
      limit: pageSize
    });
  }

  static async getById(request: AuthenticatedRequest, env: Env, studentId: string): Promise<Response> {
    const repo = new StudentRepository(env.DB);
    const student = await repo.findById(request.user!.schoolId, studentId);
    if (!student) {
      return errorResponse('NOT_FOUND', 'Data siswa tidak ditemukan.', 404);
    }
    return jsonResponse(student);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const { nis, nisn, name, gender, birth_place, birth_date, parent_name, parent_phone, address, class_id, academic_year_id } = body;

    if (!nis || !name || !gender) {
      return errorResponse('VALIDATION_ERROR', 'NIS, Nama, dan Jenis Kelamin wajib diisi.', 400);
    }

    const schoolId = request.user!.schoolId;
    const studentId = crypto.randomUUID();
    const studentRepo = new StudentRepository(env.DB);

    await studentRepo.create({
      id: studentId,
      schoolId,
      nis,
      nisn,
      name,
      gender,
      birthPlace: birth_place,
      birthDate: birth_date,
      parentName: parent_name,
      parentPhone: parent_phone,
      address
    });

    // Auto-enroll if class and academic year provided
    if (class_id && academic_year_id) {
      const enrollmentRepo = new EnrollmentRepository(env.DB);
      await enrollmentRepo.enrollStudent({
        id: crypto.randomUUID(),
        schoolId,
        studentId,
        classId: class_id,
        academicYearId: academic_year_id
      });
    }

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: schoolId,
      entity_type: 'STUDENT',
      entity_id: studentId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: studentId,
        nis,
        nisn: nisn || '',
        name,
        gender,
        birth_place: birth_place || '',
        birth_date: birth_date || '',
        parent_name: parent_name || '',
        parent_phone: parent_phone || '',
        address: address || '',
        class_id: class_id || '',
        academic_year_id: academic_year_id || '',
        is_active: 1
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'students',
      recordId: studentId,
      newValues: { name, nis, class_id }
    });

    return jsonResponse({ message: 'Siswa baru berhasil ditambahkan.', studentId, id: studentId }, 201);
  }

  static async update(request: AuthenticatedRequest, env: Env, studentId: string): Promise<Response> {
    const roleCheck = requireRoles(['OWNER', 'ADMIN'])(request);
    if (roleCheck) return roleCheck;

    const body = await request.json().catch(() => ({})) as any;
    const repo = new StudentRepository(env.DB);
    await repo.update(request.user!.schoolId, studentId, body);

    const syncRepo = new SyncQueueRepository(env.DB);
    await syncRepo.prepareInsert({
      school_id: request.user!.schoolId,
      entity_type: 'STUDENT',
      entity_id: studentId,
      action: 'UPDATE',
      payload_json: JSON.stringify({
        id: studentId,
        ...body
      }),
      status: 'PENDING'
    }).run();

    await logAudit(env, {
      schoolId: request.user!.schoolId,
      userId: request.user!.userId,
      action: 'MASTER_DATA_CHANGE',
      tableName: 'students',
      recordId: studentId,
      newValues: body
    });

    return jsonResponse({ message: 'Data siswa berhasil diperbarui.' });
  }
}
