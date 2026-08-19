-- ============================================================
-- MIGRATION 0002: PERFORMANCE & ISOLATION INDEXES
-- FASE U6 - CLOUDFLARE D1 PRIMARY DATABASE
-- ============================================================

-- School tenant scoping indexes
CREATE INDEX IF NOT EXISTS idx_users_school_username ON users(school_id, username);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(school_id, name);

CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id, academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id, is_active);

-- Enrollment and Assignment lookup
CREATE INDEX IF NOT EXISTS idx_enrollments_lookup ON student_enrollments(school_id, class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id, is_active);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON teacher_assignments(school_id, teacher_id, is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON teacher_assignments(school_id, class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_term ON teacher_assignments(academic_term_id, is_active);

-- Attendance & Journals lookup
CREATE INDEX IF NOT EXISTS idx_att_sessions_asg ON attendance_sessions(assignment_id, date);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);

CREATE INDEX IF NOT EXISTS idx_journals_asg ON teaching_journals(assignment_id, date);

-- Assessment & Grades
CREATE INDEX IF NOT EXISTS idx_assessments_asg ON assessments(assignment_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_grades_assessment ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);

-- Outbox Sync & Audit Indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(school_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_lookup ON audit_logs(school_id, table_name, created_at);
