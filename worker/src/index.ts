import { Env, ScheduledEvent } from './types';
import { handleCorsPreflight } from './middleware/security';
import { authenticate, AuthenticatedRequest } from './middleware/auth';
import { RateLimiter, RATE_LIMIT_CONFIGS } from './middleware/rateLimit';
import { AuthController } from './controllers/authController';
import { TeacherController } from './controllers/teacherController';
import { StudentController } from './controllers/studentController';
import { ClassController } from './controllers/classController';
import { SubjectController } from './controllers/subjectController';
import { AssignmentController } from './controllers/assignmentController';
import { AttendanceController } from './controllers/attendanceController';
import { GradeController } from './controllers/gradeController';
import { JournalController } from './controllers/journalController';
import { DashboardController } from './controllers/dashboardController';
import { HealthController } from './controllers/healthController';
import { SyncController } from './controllers/syncController';
import { handleScheduledSync } from './scheduled/syncCronHandler';
import { errorResponse } from './utils/response';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 1. Handle CORS Preflight
    const corsResponse = handleCorsPreflight(request, env);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const req = request as AuthenticatedRequest;

    try {
      // ----------------------------------------------------------------------
      // PUBLIC ROUTES (No Auth Required)
      // ----------------------------------------------------------------------
      if (path === '/api/auth/login' && method === 'POST') {
        const rateLimitResponse = RateLimiter.enforce(request, RATE_LIMIT_CONFIGS.LOGIN);
        if (rateLimitResponse) return rateLimitResponse;

        return await AuthController.login(req, env);
      }

      if (path === '/api/health' && method === 'GET') {
        return await HealthController.check(env);
      }

      // ----------------------------------------------------------------------
      // AUTHENTICATION PIPELINE (All routes below require valid session)
      // ----------------------------------------------------------------------
      const authError = await authenticate(req, env);
      if (authError) return authError;

      // ----------------------------------------------------------------------
      // AUTH & SESSION MANAGEMENT
      // ----------------------------------------------------------------------
      if (path === '/api/auth/logout' && method === 'POST') {
        return await AuthController.logout(req, env);
      }
      if (path === '/api/auth/me' && method === 'GET') {
        return await AuthController.me(req, env);
      }
      if (path === '/api/auth/change-password' && method === 'POST') {
        const rateLimitResponse = RateLimiter.enforce(request, RATE_LIMIT_CONFIGS.CHANGE_PASSWORD, req.user?.userId);
        if (rateLimitResponse) return rateLimitResponse;

        return await AuthController.changePassword(req, env);
      }
      if (path === '/api/auth/sessions' && method === 'GET') {
        return await AuthController.listSessions(req, env);
      }
      if (path === '/api/auth/sessions/revoke' && method === 'POST') {
        const rateLimitResponse = RateLimiter.enforce(request, RATE_LIMIT_CONFIGS.SESSION_REVOKE, req.user?.userId);
        if (rateLimitResponse) return rateLimitResponse;

        return await AuthController.revokeSession(req, env);
      }

      // ----------------------------------------------------------------------
      // DASHBOARD & ANALYTICS
      // ----------------------------------------------------------------------
      if (path === '/api/dashboard' && method === 'GET') {
        return await DashboardController.getSummary(req, env);
      }

      // ----------------------------------------------------------------------
      // SYNC OBSERVABILITY & ADMIN RETRY (FASE U7.2)
      // ----------------------------------------------------------------------
      if (path === '/api/sync/status' && method === 'GET') {
        return await SyncController.getStatus(req, env);
      }
      if (path.startsWith('/api/sync/retry/') && method === 'POST') {
        const rateLimitResponse = RateLimiter.enforce(request, RATE_LIMIT_CONFIGS.SYNC_RETRY, req.user?.schoolId);
        if (rateLimitResponse) return rateLimitResponse;

        const queueId = path.split('/')[4];
        return await SyncController.retryQueueItem(req, env, queueId);
      }
      if (path === '/api/sync/trigger' && method === 'POST') {
        return await SyncController.triggerBatch(req, env);
      }

      // ----------------------------------------------------------------------
      // MASTER DATA: TEACHERS
      // ----------------------------------------------------------------------
      if (path === '/api/teachers' && method === 'GET') {
        return await TeacherController.list(req, env);
      }
      if (path === '/api/teachers' && method === 'POST') {
        return await TeacherController.create(req, env);
      }
      if (path.startsWith('/api/teachers/') && method === 'GET') {
        const teacherId = path.split('/')[3];
        return await TeacherController.getById(req, env, teacherId);
      }
      if (path.startsWith('/api/teachers/') && method === 'PUT') {
        const teacherId = path.split('/')[3];
        return await TeacherController.update(req, env, teacherId);
      }
      if (path.startsWith('/api/teachers/') && method === 'DELETE') {
        const teacherId = path.split('/')[3];
        return await TeacherController.delete(req, env, teacherId);
      }

      // ----------------------------------------------------------------------
      // MASTER DATA: STUDENTS
      // ----------------------------------------------------------------------
      if (path === '/api/students' && method === 'GET') {
        return await StudentController.list(req, env);
      }
      if (path === '/api/students' && method === 'POST') {
        return await StudentController.create(req, env);
      }
      if (path.startsWith('/api/students/') && method === 'GET') {
        const studentId = path.split('/')[3];
        return await StudentController.getById(req, env, studentId);
      }
      if (path.startsWith('/api/students/') && method === 'PUT') {
        const studentId = path.split('/')[3];
        return await StudentController.update(req, env, studentId);
      }

      // ----------------------------------------------------------------------
      // MASTER DATA: CLASSES
      // ----------------------------------------------------------------------
      if (path === '/api/classes' && method === 'GET') {
        return await ClassController.list(req, env);
      }
      if (path === '/api/classes' && method === 'POST') {
        return await ClassController.create(req, env);
      }
      if (path.startsWith('/api/classes/') && method === 'GET') {
        const classId = path.split('/')[3];
        return await ClassController.getById(req, env, classId);
      }

      // ----------------------------------------------------------------------
      // MASTER DATA: SUBJECTS
      // ----------------------------------------------------------------------
      if (path === '/api/subjects' && method === 'GET') {
        return await SubjectController.list(req, env);
      }
      if (path === '/api/subjects' && method === 'POST') {
        return await SubjectController.create(req, env);
      }
      if (path.startsWith('/api/subjects/') && method === 'GET') {
        const subjectId = path.split('/')[3];
        return await SubjectController.getById(req, env, subjectId);
      }

      // ----------------------------------------------------------------------
      // TEACHER ASSIGNMENTS
      // ----------------------------------------------------------------------
      if (path === '/api/assignments' && method === 'GET') {
        return await AssignmentController.list(req, env);
      }
      if (path === '/api/assignments' && method === 'POST') {
        return await AssignmentController.create(req, env);
      }
      if (path.startsWith('/api/assignments/') && method === 'GET') {
        const assignmentId = path.split('/')[3];
        return await AssignmentController.getById(req, env, assignmentId);
      }
      if (path.startsWith('/api/assignments/') && method === 'DELETE') {
        const assignmentId = path.split('/')[3];
        return await AssignmentController.delete(req, env, assignmentId);
      }

      // ----------------------------------------------------------------------
      // ATTENDANCE (PRESENSI)
      // ----------------------------------------------------------------------
      if (path === '/api/attendance' && method === 'GET') {
        return await AttendanceController.list(req, env);
      }
      if (path === '/api/attendance' && method === 'POST') {
        return await AttendanceController.create(req, env);
      }
      if (path.startsWith('/api/attendance/') && method === 'GET') {
        const sessionId = path.split('/')[3];
        return await AttendanceController.getById(req, env, sessionId);
      }

      // ----------------------------------------------------------------------
      // ASSESSMENTS & GRADES (PENILAIAN & NILAI)
      // ----------------------------------------------------------------------
      if (path === '/api/assessments' && method === 'GET') {
        return await GradeController.listAssessments(req, env);
      }
      if (path === '/api/assessments' && method === 'POST') {
        return await GradeController.createAssessment(req, env);
      }
      if (path.startsWith('/api/assessments/') && method === 'GET') {
        const parts = path.split('/');
        const assessmentId = parts[3];
        if (parts[4] === 'grades') {
          return await GradeController.listGradesByAssessment(req, env, assessmentId);
        }
        return await GradeController.getAssessmentById(req, env, assessmentId);
      }
      if (path.startsWith('/api/assessments/') && method === 'POST') {
        const parts = path.split('/');
        const assessmentId = parts[3];
        if (parts[4] === 'grades') {
          return await GradeController.saveBatchGrades(req, env, assessmentId);
        }
      }
      if (path === '/api/grades/batch' && method === 'POST') {
        return await GradeController.saveBatchGrades(req, env);
      }

      // ----------------------------------------------------------------------
      // TEACHING JOURNALS (JURNAL MENGAJAR)
      // ----------------------------------------------------------------------
      if (path === '/api/journals' && method === 'GET') {
        return await JournalController.list(req, env);
      }
      if (path === '/api/journals' && method === 'POST') {
        return await JournalController.create(req, env);
      }
      if (path.startsWith('/api/journals/') && method === 'GET') {
        const journalId = path.split('/')[3];
        return await JournalController.getById(req, env, journalId);
      }

      // ----------------------------------------------------------------------
      // NOT FOUND
      // ----------------------------------------------------------------------
      return errorResponse('NOT_FOUND', `Endpoint ${method} ${path} tidak ditemukan.`, 404);

    } catch (err: any) {
      console.error('Unhandled Worker Error:', err);
      return errorResponse('INTERNAL_SERVER_ERROR', 'Terjadi kesalahan sistem pada server.', 500, {
        details: err?.message || String(err)
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    return handleScheduledSync(event, env, ctx);
  }
};
