import { Env, UserSessionPayload } from '../types';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { authorizeAssignment, validateStudentsEnrollment } from '../utils/authorization';

export interface CreateAttendanceInput {
  assignment_id: string;
  date: string;
  meeting_no: number;
  time_start?: string;
  time_end?: string;
  topic?: string;
  records: Array<{
    student_id: string;
    status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'DISPENSASI';
    notes?: string;
  }>;
}

export class AttendanceService {
  private attRepo: AttendanceRepository;
  private syncRepo: SyncQueueRepository;
  private auditRepo: AuditRepository;

  constructor(private env: Env) {
    this.attRepo = new AttendanceRepository(env.DB);
    this.syncRepo = new SyncQueueRepository(env.DB);
    this.auditRepo = new AuditRepository(env.DB);
  }

  async createAttendanceSession(
    user: UserSessionPayload,
    input: CreateAttendanceInput,
    ipAddress?: string
  ): Promise<{ success: boolean; sessionId?: string; error?: { code: string; message: string; details?: any } }> {
    // 1. Validate Assignment Ownership
    const authAsg = await authorizeAssignment(this.env, user, input.assignment_id);
    if (!authAsg.authorized) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: authAsg.reason || 'Anda tidak memiliki hak akses penugasan ini.' }
      };
    }

    const classId = authAsg.assignment.class_id;

    // 2. Validate Duplicate Session (Natural unique key: assignment_id + date + meeting_no)
    const existing = await this.attRepo.findExistingSession(input.assignment_id, input.date, input.meeting_no);
    if (existing) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_SESSION',
          message: `Sesi presensi untuk pertemuan ke-${input.meeting_no} pada tanggal ${input.date} sudah ada.`
        }
      };
    }

    // 3. Validate Student Enrollment
    const studentIds = input.records.map(r => r.student_id);
    const enrollCheck = await validateStudentsEnrollment(this.env, user.schoolId, classId, studentIds);
    if (!enrollCheck.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_STUDENT_ENROLLMENT',
          message: 'Terdapat siswa yang tidak terdaftar pada rombongan belajar kelas ini.',
          details: { invalidStudentIds: enrollCheck.invalidStudentIds }
        }
      };
    }

    // 4. Prepare Atomic Batch Mutations
    const sessionId = crypto.randomUUID();
    const sessionInsert = this.env.DB.prepare(`
      INSERT INTO attendance_sessions (id, school_id, assignment_id, date, meeting_no, time_start, time_end, topic, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).bind(
      sessionId,
      user.schoolId,
      input.assignment_id,
      input.date,
      input.meeting_no,
      input.time_start || null,
      input.time_end || null,
      input.topic || null,
      user.userId
    );

    const recordInserts = input.records.map(r => {
      return this.env.DB.prepare(`
        INSERT INTO attendance_records (id, session_id, student_id, status, notes)
        VALUES (?, ?, ?, ?, ?);
      `).bind(crypto.randomUUID(), sessionId, r.student_id, r.status, r.notes || null);
    });

    const syncQueueInsert = this.syncRepo.prepareInsert({
      school_id: user.schoolId,
      entity_type: 'ATTENDANCE',
      entity_id: sessionId,
      action: 'BATCH_INSERT',
      payload_json: JSON.stringify({
        sessionId: sessionId,
        session_id: sessionId,
        assignment_id: input.assignment_id,
        date: input.date,
        meeting_no: input.meeting_no,
        topic: input.topic,
        records: input.records
      }),
      status: 'PENDING'
    });

    const auditInsert = this.auditRepo.prepareInsert({
      schoolId: user.schoolId,
      userId: user.userId,
      action: 'ATTENDANCE_CHANGE',
      tableName: 'attendance_sessions',
      recordId: sessionId,
      newValues: { date: input.date, meeting_no: input.meeting_no, total_records: input.records.length },
      ipAddress
    });

    // 5. Execute Atomic Transaction (All-or-Nothing)
    await this.env.DB.batch([
      sessionInsert,
      ...recordInserts,
      syncQueueInsert,
      auditInsert
    ]);

    return { success: true, sessionId };
  }
}
