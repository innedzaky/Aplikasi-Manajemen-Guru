-- ============================================================
-- MIGRATION 0001: INITIAL DATABASE SCHEMA (19 TABLES)
-- FASE U6 - CLOUDFLARE D1 PRIMARY DATABASE
-- ============================================================

-- 1. SCHOOLS
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    npsn TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, name)
);

-- 3. ACADEMIC TERMS
CREATE TABLE IF NOT EXISTS academic_terms (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    name TEXT NOT NULL,
    semester_type TEXT NOT NULL CHECK(semester_type IN ('GANJIL', 'GENAP')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(academic_year_id, name)
);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('OWNER', 'ADMIN', 'GURU')),
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, username)
);

-- 5. SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT UNIQUE,
    nip TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(school_id, nip)
);

-- 7. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    major TEXT,
    homeroom_teacher_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE(school_id, academic_year_id, name)
);

-- 8. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('WAJIB', 'PEMINATAN', 'MUATAN_LOKAL', 'EKSTRAKURIKULER')),
    default_kkm REAL NOT NULL DEFAULT 75.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, code)
);

-- 9. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    nis TEXT NOT NULL,
    nisn TEXT,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('L', 'P')),
    birth_place TEXT,
    birth_date TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    address TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE(school_id, nis),
    UNIQUE(school_id, nisn)
);

-- 10. STUDENT ENROLLMENTS
CREATE TABLE IF NOT EXISTS student_enrollments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPOUT')),
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id, academic_year_id)
);

-- 11. TEACHER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    academic_term_id TEXT NOT NULL,
    custom_kkm REAL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
    UNIQUE(teacher_id, subject_id, class_id, academic_term_id)
);

-- 12. ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    date TEXT NOT NULL,
    meeting_no INTEGER NOT NULL,
    time_start TEXT,
    time_end TEXT,
    topic TEXT,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(assignment_id, date, meeting_no)
);

-- 13. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('HADIR', 'SAKIT', 'IZIN', 'ALPA', 'DISPENSASI')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(session_id, student_id)
);

-- 14. ASSESSMENTS
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('TUGAS', 'UH', 'PTS', 'PAS', 'PAT', 'PRAKTIK', 'PROYEK')),
    weight REAL NOT NULL DEFAULT 1.0,
    max_score REAL NOT NULL DEFAULT 100.0,
    passing_score REAL NOT NULL DEFAULT 75.0,
    assessment_date TEXT NOT NULL,
    description TEXT,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. GRADES
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    score REAL NOT NULL CHECK(score >= 0.0 AND score <= 100.0),
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(assessment_id, student_id)
);

-- 16. TEACHING JOURNALS
CREATE TABLE IF NOT EXISTS teaching_journals (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    date TEXT NOT NULL,
    meeting_no INTEGER NOT NULL,
    material_covered TEXT NOT NULL,
    teaching_method TEXT,
    student_attendance_summary TEXT,
    class_situation_notes TEXT,
    follow_up_action TEXT,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(assignment_id, date, meeting_no)
);

-- 17. SYNC QUEUE (Outbox pattern for Google Apps Script / Spreadsheet sync)
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('TEACHER', 'STUDENT', 'CLASS', 'SUBJECT', 'ASSIGNMENT', 'ATTENDANCE', 'ASSESSMENT', 'GRADE', 'JOURNAL')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE', 'BATCH_INSERT')),
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- 18. SYNC LOGS
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT NOT NULL,
    sync_queue_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'ERROR', 'RETRY')),
    response_payload TEXT,
    duration_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (sync_queue_id) REFERENCES sync_queue(id) ON DELETE SET NULL
);

-- 19. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
