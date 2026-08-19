import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { jsonResponse, errorResponse } from '../utils/response';
import { SyncService } from '../services/syncService';

export class SyncController {
  /**
   * GET /api/sync/status
   * Retrieves sync queue metrics and observability data for the authenticated school.
   * Access: OWNER, ADMIN only.
   */
  static async getStatus(req: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!req.user) {
      return errorResponse('UNAUTHORIZED', 'Autentikasi diperlukan.', 401);
    }

    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', 'Hanya Admin atau Owner yang dapat mengakses status sinkronisasi.', 403);
    }

    const syncService = new SyncService(env);
    const summary = await syncService.getStatusSummary(req.user.schoolId);

    return jsonResponse(summary, 200);
  }

  /**
   * POST /api/sync/retry/:id
   * Manually re-queues a FAILED queue item to PENDING.
   * Access: OWNER, ADMIN only. Scoped strictly to user's school.
   */
  static async retryQueueItem(req: AuthenticatedRequest, env: Env, idStr: string): Promise<Response> {
    if (!req.user) {
      return errorResponse('UNAUTHORIZED', 'Autentikasi diperlukan.', 401);
    }

    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', 'Hanya Admin atau Owner yang dapat memicu retry antrean sinkronisasi.', 403);
    }

    const queueId = parseInt(idStr, 10);
    if (isNaN(queueId) || queueId <= 0) {
      return errorResponse('BAD_REQUEST', 'ID antrean tidak valid.', 400);
    }

    const syncService = new SyncService(env);
    const success = await syncService.adminRetry(queueId, req.user.schoolId);

    if (!success) {
      return errorResponse('NOT_FOUND', 'Item antrean tidak ditemukan atau tidak dalam status FAILED pada sekolah Anda.', 404);
    }

    return jsonResponse({
      message: 'Item antrean berhasil dijadwalkan ulang ke status PENDING.',
      queueId
    }, 200);
  }

  /**
   * POST /api/sync/trigger
   * Triggers an immediate batch sync processing tick (useful for Admin on-demand sync / tests).
   * Access: OWNER, ADMIN only.
   */
  static async triggerBatch(req: AuthenticatedRequest, env: Env): Promise<Response> {
    if (!req.user) {
      return errorResponse('UNAUTHORIZED', 'Autentikasi diperlukan.', 401);
    }

    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return errorResponse('FORBIDDEN', 'Akses ditolak.', 403);
    }

    const syncService = new SyncService(env);
    const result = await syncService.processBatch(10);

    return jsonResponse({
      message: 'Batch sync tick executed successfully.',
      result
    }, 200);
  }
}
