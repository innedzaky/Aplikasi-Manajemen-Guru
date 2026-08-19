import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { AssessmentRepository } from '../repositories/assessmentRepository';
import { GradeRepository } from '../repositories/gradeRepository';
import { GradeService } from '../services/gradeService';
import { jsonResponse, errorResponse } from '../utils/response';
import { authorizeAssignment } from '../utils/authorization';

export class GradeController {
  static async listAssessments(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('assignmentId') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const classId = url.searchParams.get('classId') || undefined;

    if (request.user!.role === 'GURU' && assignmentId) {
      const auth = await authorizeAssignment(env, request.user!, assignmentId);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }

    const repo = new AssessmentRepository(env.DB);
    const assessments = await repo.list(request.user!.schoolId, { assignmentId, type, classId });
    return jsonResponse(assessments);
  }

  static async getAssessmentById(request: AuthenticatedRequest, env: Env, assessmentId: string): Promise<Response> {
    const repo = new AssessmentRepository(env.DB);
    const assessment = await repo.findById(request.user!.schoolId, assessmentId);
    if (!assessment) {
      return errorResponse('NOT_FOUND', 'Penilaian tidak ditemukan.', 404);
    }
    if (request.user!.role === 'GURU') {
      const auth = await authorizeAssignment(env, request.user!, assessment.assignment_id);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }
    return jsonResponse(assessment);
  }

  static async createAssessment(request: AuthenticatedRequest, env: Env): Promise<Response> {
    const body = await request.json().catch(() => ({})) as any;
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

    const service = new GradeService(env);
    const result = await service.createAssessment(request.user!, body, ipAddress);

    if (!result.success) {
      const status = result.error?.code === 'FORBIDDEN' ? 403 : 400;
      return errorResponse(result.error!.code, result.error!.message, status);
    }

    return jsonResponse({ message: 'Penilaian baru berhasil dibuat.', id: result.assessmentId, assessmentId: result.assessmentId }, 201);
  }

  static async listGradesByAssessment(request: AuthenticatedRequest, env: Env, assessmentId: string): Promise<Response> {
    const assessmentRepo = new AssessmentRepository(env.DB);
    const assessment = await assessmentRepo.findById(request.user!.schoolId, assessmentId);
    if (!assessment) {
      return errorResponse('NOT_FOUND', 'Penilaian tidak ditemukan.', 404);
    }
    if (request.user!.role === 'GURU') {
      const auth = await authorizeAssignment(env, request.user!, assessment.assignment_id);
      if (!auth.authorized) {
        return errorResponse('FORBIDDEN', auth.reason || 'Akses ditolak.', 403);
      }
    }

    const gradeRepo = new GradeRepository(env.DB);
    const grades = await gradeRepo.listByAssessment(assessmentId);
    return jsonResponse({ assessment, grades });
  }

  static async saveBatchGrades(request: AuthenticatedRequest, env: Env, paramAssessmentId?: string): Promise<Response> {
    const body = await request.json().catch(() => ({})) as any;
    if (paramAssessmentId && !body.assessment_id) {
      body.assessment_id = paramAssessmentId;
    }
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

    const service = new GradeService(env);
    const result = await service.saveBatchGrades(request.user!, body, ipAddress);

    if (!result.success) {
      const status = result.error?.code === 'FORBIDDEN' ? 403 : (result.error?.code === 'NOT_FOUND' ? 404 : 400);
      return errorResponse(result.error!.code, result.error!.message, status, result.error?.details);
    }

    return jsonResponse({ message: 'Nilai siswa berhasil disimpan ke database D1.' });
  }
}
