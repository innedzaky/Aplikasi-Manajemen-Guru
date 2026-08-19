import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { DashboardService } from '../services/dashboardService';
import { jsonResponse } from '../utils/response';

export class DashboardController {
  static async getSummary(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const service = new DashboardService(env);
    const summary = await service.getDashboardSummary(request.user!);
    return jsonResponse(summary);
  }
}
