import { Env, UserSessionPayload } from '../types';
import { AssessmentRepository } from '../repositories/assessmentRepository';
import { GradeRepository } from '../repositories/gradeRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { authorizeAssignment, validateStudentsEnrollment } from '../utils/authorization';

export interface CreateAssessmentInput {
  assignment_id: string;
  title: string;
  type: 'TUGAS' | 'UH' | 'PTS' | 'PAS' | 'PAT' | 'PRAKTIK' | 'PROYEK';
  weight?: number;
  max_score?: number;
  passing_score?: number;
  passing_grade?: number;
  assessment_date?: string;
  date?: string;
  description?: string;
}

export interface InputBatchGradesInput {
  assessment_id: string;
  grades: Array<{
    student_id: string;
    score: number;
    feedback?: string;
  }>;
}

export class GradeService {
  private assessmentRepo: AssessmentRepository;
  private gradeRepo: GradeRepository;
  private syncRepo: SyncQueueRepository;
  private auditRepo: AuditRepository;

  constructor(private env: Env) {
    this.assessmentRepo = new AssessmentRepository(env.DB);
    this.gradeRepo = new GradeRepository(env.DB);
    this.syncRepo = new SyncQueueRepository(env.DB);
    this.auditRepo = new AuditRepository(env.DB);
  }

  async createAssessment(
    user: UserSessionPayload,
    input: CreateAssessmentInput,
    ipAddress?: string
  ): Promise<{ success: boolean; assessmentId?: string; error?: { code: string; message: string } }> {
    const authAsg = await authorizeAssignment(this.env, user, input.assignment_id);
    if (!authAsg.authorized) {
      return { success: false, error: { code: 'FORBIDDEN', message: authAsg.reason || 'Akses ditolak.' } };
    }

    const assessmentId = crypto.randomUUID();
    const assessmentDate = input.assessment_date || input.date || new Date().toISOString().split('T')[0];
    const passingScore = input.passing_score ?? input.passing_grade ?? (authAsg.assignment.custom_kkm || 75.0);

    const assessmentInsert = this.env.DB.prepare(`
      INSERT INTO assessments (id, school_id, assignment_id, title, type, weight, max_score, passing_score, assessment_date, description, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).bind(
      assessmentId,
      user.schoolId,
      input.assignment_id,
      input.title,
      input.type,
      input.weight ?? 1.0,
      input.max_score ?? 100.0,
      passingScore,
      assessmentDate,
      input.description || null,
      user.userId
    );

    const syncInsert = this.syncRepo.prepareInsert({
      school_id: user.schoolId,
      entity_type: 'ASSESSMENT',
      entity_id: assessmentId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: assessmentId,
        assignment_id: input.assignment_id,
        title: input.title,
        type: input.type,
        weight: input.weight ?? 1.0,
        max_score: input.max_score ?? 100.0,
        passing_score: passingScore,
        passing_grade: passingScore,
        assessment_date: assessmentDate,
        date: assessmentDate,
        description: input.description || null
      }),
      status: 'PENDING'
    });

    const auditInsert = this.auditRepo.prepareInsert({
      schoolId: user.schoolId,
      userId: user.userId,
      action: 'CREATE',
      tableName: 'assessments',
      recordId: assessmentId,
      newValues: { title: input.title, type: input.type },
      ipAddress
    });

    await this.env.DB.batch([assessmentInsert, syncInsert, auditInsert]);
    return { success: true, assessmentId };
  }

  async saveBatchGrades(
    user: UserSessionPayload,
    input: InputBatchGradesInput,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: { code: string; message: string; details?: any } }> {
    // 1. Verify Assessment
    const assessment = await this.assessmentRepo.findById(user.schoolId, input.assessment_id);
    if (!assessment) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Penilaian tidak ditemukan.' } };
    }

    // 2. Authorize Assignment Ownership
    const authAsg = await authorizeAssignment(this.env, user, assessment.assignment_id);
    if (!authAsg.authorized) {
      return { success: false, error: { code: 'FORBIDDEN', message: authAsg.reason || 'Akses ditolak.' } };
    }

    // 3. Validate Scores Range (0.0 s.d. 100.0)
    for (const g of input.grades) {
      if (typeof g.score !== 'number' || g.score < 0 || g.score > 100) {
        return {
          success: false,
          error: {
            code: 'INVALID_SCORE_RANGE',
            message: `Nilai untuk siswa ID ${g.student_id} tidak valid (${g.score}). Nilai harus berada dalam rentang 0 - 100.`
          }
        };
      }
    }

    // 4. Validate Student Enrollment
    const studentIds = input.grades.map(g => g.student_id);
    const enrollCheck = await validateStudentsEnrollment(this.env, user.schoolId, assessment.class_id, studentIds);
    if (!enrollCheck.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_STUDENT_ENROLLMENT',
          message: 'Terdapat siswa yang tidak terdaftar pada rombel kelas penilaian ini.',
          details: { invalidStudentIds: enrollCheck.invalidStudentIds }
        }
      };
    }

    // 5. Upsert Grades using INSERT OR REPLACE (Atomic batch)
    const gradeInserts = input.grades.map(g => {
      return this.env.DB.prepare(`
        INSERT INTO grades (id, assessment_id, student_id, score, feedback, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(assessment_id, student_id) DO UPDATE SET
          score = excluded.score,
          feedback = excluded.feedback,
          updated_at = datetime('now');
      `).bind(crypto.randomUUID(), input.assessment_id, g.student_id, g.score, g.feedback || null);
    });

    const syncInsert = this.syncRepo.prepareInsert({
      school_id: user.schoolId,
      entity_type: 'GRADE',
      entity_id: input.assessment_id,
      action: 'BATCH_INSERT',
      payload_json: JSON.stringify(input),
      status: 'PENDING'
    });

    const auditInsert = this.auditRepo.prepareInsert({
      schoolId: user.schoolId,
      userId: user.userId,
      action: 'GRADE_CHANGE',
      tableName: 'grades',
      recordId: input.assessment_id,
      newValues: { total_grades_inputted: input.grades.length },
      ipAddress
    });

    await this.env.DB.batch([...gradeInserts, syncInsert, auditInsert]);
    return { success: true };
  }
}
