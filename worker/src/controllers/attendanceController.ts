import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { AttendanceService } from '../services/attendanceService';
import { jsonResponse, errorResponse } from '../utils/response';
import { authorizeAssignment } from '../utils/authorization';

export class AttendanceController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let assignmentId = url.searchParams.get('assignmentId') || undefined;
    const classId = url.searchParams.get('classId') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

    // If teacher, verify that if assignmentId is passed, they own it
    if (request.user!.role === 'GURU' && assignmentId) {
      const auth = await authorizeAssignment(env, request.user!, assignmentId);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }

    const repo = new AttendanceRepository(env.DB);
    const result = await repo.listSessions(request.user!.schoolId, { assignmentId, classId, date, page, pageSize });

    return jsonResponse(result.data, 200, {}, {
      total: result.total,
      page,
      limit: pageSize
    });
  }

  static async getById(request: AuthenticatedRequest, env: Env, sessionId: string): Promise<Response> {
    const repo = new AttendanceRepository(env.DB);
    const session = await repo.getSessionWithRecords(request.user!.schoolId, sessionId);
    if (!session) {
      return errorResponse('NOT_FOUND', 'Sesi presensi tidak ditemukan.', 404);
    }

    if (request.user!.role === 'GURU' && session.teacher_id !== request.user!.teacherId) {
      return errorResponse('FORBIDDEN', 'Anda tidak berhak melihat presensi kelas ini.', 403);
    }

    return jsonResponse(session);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const body = await request.json().catch(() => ({})) as any;
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

    const service = new AttendanceService(env);
    const result = await service.createAttendanceSession(request.user!, body, ipAddress);

    if (!result.success) {
      const status = result.error?.code === 'FORBIDDEN' ? 403 : (result.error?.code === 'DUPLICATE_SESSION' ? 409 : 400);
      return errorResponse(result.error!.code, result.error!.message, status, result.error?.details);
    }

    return jsonResponse({ message: 'Presensi kelas berhasil disimpan.', id: result.sessionId, sessionId: result.sessionId }, 201);
  }
}
