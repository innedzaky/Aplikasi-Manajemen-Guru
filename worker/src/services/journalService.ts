import { Env, UserSessionPayload } from '../types';
import { JournalRepository } from '../repositories/journalRepository';
import { SyncQueueRepository } from '../repositories/syncQueueRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { authorizeAssignment } from '../utils/authorization';

export interface CreateJournalInput {
  assignment_id: string;
  date: string;
  meeting_no: number;
  material_covered?: string;
  teaching_material?: string;
  teaching_method?: string;
  learning_method?: string;
  student_attendance_summary?: string;
  attendance_summary?: string;
  class_situation_notes?: string;
  class_notes?: string;
  follow_up_action?: string;
  follow_up?: string;
}

export class JournalService {
  private journalRepo: JournalRepository;
  private syncRepo: SyncQueueRepository;
  private auditRepo: AuditRepository;

  constructor(private env: Env) {
    this.journalRepo = new JournalRepository(env.DB);
    this.syncRepo = new SyncQueueRepository(env.DB);
    this.auditRepo = new AuditRepository(env.DB);
  }

  async createJournal(
    user: UserSessionPayload,
    input: CreateJournalInput,
    ipAddress?: string
  ): Promise<{ success: boolean; journalId?: string; error?: { code: string; message: string } }> {
    // 1. Authorize Assignment Ownership
    const authAsg = await authorizeAssignment(this.env, user, input.assignment_id);
    if (!authAsg.authorized) {
      return { success: false, error: { code: 'FORBIDDEN', message: authAsg.reason || 'Akses ditolak.' } };
    }

    const materialCovered = input.material_covered || input.teaching_material || '';
    const teachingMethod = input.teaching_method || input.learning_method || null;
    const attendanceSummary = input.student_attendance_summary || input.attendance_summary || null;
    const classSituationNotes = input.class_situation_notes || input.class_notes || null;
    const followUpAction = input.follow_up_action || input.follow_up || null;

    // 2. Validate Duplicate Journal (assignment_id + date + meeting_no)
    const existing = await this.env.DB.prepare(`
      SELECT id FROM teaching_journals WHERE assignment_id = ? AND date = ? AND meeting_no = ? LIMIT 1;
    `).bind(input.assignment_id, input.date, input.meeting_no).first();

    if (existing) {
      return {
        success: false,
        error: { code: 'DUPLICATE_JOURNAL', message: `Jurnal mengajar untuk pertemuan ke-${input.meeting_no} tanggal ${input.date} sudah terisi.` }
      };
    }

    // 3. Prepare Atomic Transaction
    const journalId = crypto.randomUUID();
    const journalInsert = this.env.DB.prepare(`
      INSERT INTO teaching_journals (id, school_id, assignment_id, date, meeting_no, material_covered, teaching_method, student_attendance_summary, class_situation_notes, follow_up_action, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).bind(
      journalId,
      user.schoolId,
      input.assignment_id,
      input.date,
      input.meeting_no,
      materialCovered,
      teachingMethod,
      attendanceSummary,
      classSituationNotes,
      followUpAction,
      user.userId
    );

    const syncInsert = this.syncRepo.prepareInsert({
      school_id: user.schoolId,
      entity_type: 'JOURNAL',
      entity_id: journalId,
      action: 'INSERT',
      payload_json: JSON.stringify({
        id: journalId,
        assignment_id: input.assignment_id,
        date: input.date,
        meeting_no: input.meeting_no,
        material_covered: materialCovered,
        teaching_material: materialCovered,
        teaching_method: teachingMethod,
        learning_method: teachingMethod,
        student_attendance_summary: attendanceSummary,
        attendance_summary: attendanceSummary,
        class_situation_notes: classSituationNotes,
        class_notes: classSituationNotes,
        follow_up_action: followUpAction,
        follow_up: followUpAction
      }),
      status: 'PENDING'
    });

    const auditInsert = this.auditRepo.prepareInsert({
      schoolId: user.schoolId,
      userId: user.userId,
      action: 'JOURNAL_CHANGE',
      tableName: 'teaching_journals',
      recordId: journalId,
      newValues: { date: input.date, meeting_no: input.meeting_no, material: materialCovered },
      ipAddress
    });

    await this.env.DB.batch([journalInsert, syncInsert, auditInsert]);
    return { success: true, journalId };
  }
}
