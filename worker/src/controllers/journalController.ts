import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { JournalRepository } from '../repositories/journalRepository';
import { JournalService } from '../services/journalService';
import { jsonResponse, errorResponse } from '../utils/response';
import { authorizeAssignment } from '../utils/authorization';

export class JournalController {
  static async list(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignmentId') || undefined;
    const classId = url.searchParams.get('classId') || undefined;
    const date = url.searchParams.get('date') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

    if (request.user!.role === 'GURU' && assignmentId) {
      const auth = await authorizeAssignment(env, request.user!, assignmentId);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }

    const repo = new JournalRepository(env.DB);
    const result = await repo.list(request.user!.schoolId, { assignmentId, classId, date, page, pageSize });

    return jsonResponse(result.data, 200, {}, {
      total: result.total,
      page,
      limit: pageSize
    });
  }

  static async getById(request: AuthenticatedRequest, env: Env, journalId: string): Promise<Response> {
    const repo = new JournalRepository(env.DB);
    const journal = await repo.findById(request.user!.schoolId, journalId);
    if (!journal) {
      return errorResponse('NOT_FOUND', 'Jurnal mengajar tidak ditemukan.', 404);
    }
    if (request.user!.role === 'GURU') {
      const auth = await authorizeAssignment(env, request.user!, journal.assignment_id);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }
    return jsonResponse(journal);
  }

  static async create(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const body = await request.json().catch(() => ({})) as any;
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

    const service = new JournalService(env);
    const result = await service.createJournal(request.user!, body, ipAddress);

    if (!result.success) {
      const status = result.error?.code === 'FORBIDDEN' ? 403 : (result.error?.code === 'DUPLICATE_JOURNAL' ? 409 : 400);
      return errorResponse(result.error!.code, result.error!.message, status);
    }

    return jsonResponse({ message: 'Jurnal mengajar berhasil disimpan ke D1.', id: result.journalId, journalId: result.journalId }, 201);
  }
}
