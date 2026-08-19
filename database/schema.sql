-- ============================================================================
-- CLOUDFLARE D1 RELATIONAL DATABASE SCHEMA - PRODUCTION DDL
-- Project: Sistem Manajemen Guru (Presensi, Penilaian, Jurnal KBM)
-- Architecture: Hybrid (Cloudflare D1 Primary, Google Spreadsheet Secondary)
-- Version: 2.0.0 (Phase U3 Final)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. SCHOOLS (Institusi Multi-Sekolah)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY, -- UUID v4 (e.g. 'sch_01h8...')
    npsn TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. ACADEMIC YEARS & TERMS (Tahun Ajaran & Semester)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY, -- e.g. 'ay_2026_2027' or UUID
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. '2026/2027'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active INTEGER DEFAULT 0 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, name)
);

CREATE TABLE IF NOT EXISTS academic_terms (
    id TEXT PRIMARY KEY, -- e.g. 'term_2026_1' or UUID
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Ganjil' / 'Genap'
    term_number INTEGER NOT NULL CHECK (term_number IN (1, 2)), -- 1 = Ganjil, 2 = Genap
    is_active INTEGER DEFAULT 0 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(academic_year_id, term_number)
);

-- ----------------------------------------------------------------------------
-- 3. USERS & SESSIONS (Autentikasi, Role & Sesi Terenkripsi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- PBKDF2 / SHA-256 / Argon2 Hash
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'GURU')),
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, username)
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- UUID v4
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE, -- Hashed JWT / Secure Session Identifier
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. TEACHERS (Profil Guru)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY, -- e.g. 'G001' or UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    nip TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialization TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. CLASSES & SUBJECTS (Master Kelas & Mata Pelajaran)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY, -- e.g. 'K001' or UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name TEXT NOT NULL, -- e.g. 'X TKJ 1'
    grade_level INTEGER NOT NULL CHECK (grade_level IN (10, 11, 12)),
    homeroom_teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, academic_year_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY, -- e.g. 'M001' or UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code TEXT, -- e.g. 'MAT-X'
    name TEXT NOT NULL, -- e.g. 'Matematika'
    default_kkm REAL DEFAULT 75.0 CHECK (default_kkm >= 0 AND default_kkm <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, name)
);

-- ----------------------------------------------------------------------------
-- 6. STUDENTS & STUDENT ENROLLMENTS (Master Siswa & Riwayat Kelas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY, -- Internal Primary Key UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    nisn TEXT, -- Unique per school jika tersedia
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, nisn)
);

CREATE TABLE IF NOT EXISTS student_enrollments (
    id TEXT PRIMARY KEY, -- UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, academic_year_id)
);

-- ----------------------------------------------------------------------------
-- 7. TEACHER ASSIGNMENTS (Plotting Guru - Mapel - Kelas - Semester)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id TEXT PRIMARY KEY, -- UUID v4 (e.g. 'asg_01h8...')
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_term_id TEXT NOT NULL REFERENCES academic_terms(id) ON DELETE RESTRICT,
    custom_kkm REAL CHECK (custom_kkm IS NULL OR (custom_kkm >= 0 AND custom_kkm <= 100)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id, class_id, academic_term_id)
);

-- ----------------------------------------------------------------------------
-- 8. ATTENDANCE SESSIONS & RECORDS (Presensi Kelas & Detail Siswa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY, -- UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    meeting_no INTEGER NOT NULL CHECK (meeting_no > 0),
    time_start TEXT, -- e.g. '07:30'
    time_end TEXT,   -- e.g. '09:00'
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, date, meeting_no)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY, -- UUID v4
    session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('H', 'S', 'I', 'A')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 9. ASSESSMENTS & GRADES (Penilaian & Nilai Siswa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY, -- UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('TUGAS', 'UH', 'PTS', 'PAS', 'PRAKTIK', 'PROYEK', 'PORTFOLIO')),
    name TEXT NOT NULL, -- e.g. 'UH 1 - Eksponen'
    kkm REAL NOT NULL CHECK (kkm >= 0 AND kkm <= 100),
    weight REAL DEFAULT 1.0 CHECK (weight > 0),
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY, -- UUID v4
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    score REAL NOT NULL CHECK (score >= 0.0 AND score <= 100.0),
    predicate TEXT CHECK (predicate IN ('A', 'B', 'C', 'D')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 10. TEACHING JOURNALS (Agenda Mengajar Guru / Refleksi KBM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teaching_journals (
    id TEXT PRIMARY KEY, -- UUID v4
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    lesson_hours TEXT NOT NULL, -- e.g. '1-2'
    topic TEXT NOT NULL,
    learning_objectives TEXT,
    activities TEXT,
    method TEXT,
    media TEXT,
    reflection TEXT,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('TERLAKSANA', 'SEBAGIAN', 'TERTUNDA')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. SYNC QUEUE & SYNC LOGS (Outbox Pattern & Monitoring Sinkronisasi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ATTENDANCE', 'GRADE', 'JOURNAL', 'MASTER')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'BATCH_INSERT')),
    payload_json TEXT NOT NULL, -- Payload siap kirim ke Google Apps Script
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER DEFAULT 5,
    last_error TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')),
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER REFERENCES sync_queue(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    status_code INTEGER,
    execution_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. AUDIT LOGS (Pencatatan Riwayat Aktivitas & Perubahan Data)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'EXPORT', 'SYNC', 'CONFIGURATION_CHANGE')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values TEXT, -- JSON Snapshot sebelum diubah
    new_values TEXT, -- JSON Snapshot sesudah diubah
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HIGH-PERFORMANCE INDEXES (OPTIMASI MULTI-USER & QUERY CEPAT)
-- ============================================================================

-- Autentikasi & Sesi
CREATE INDEX IF NOT EXISTS idx_users_school_username ON users(school_id, username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_exp ON sessions(user_id, expires_at);

-- Guru, Siswa & Enrollment
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_students_school_nisn ON students(school_id, nisn);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON student_enrollments(class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id, is_active);

-- Assignment Guru
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_term ON teacher_assignments(academic_term_id);

-- Presensi
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_asg_date ON attendance_sessions(assignment_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- Penilaian
CREATE INDEX IF NOT EXISTS idx_assessments_asg_date ON assessments(assignment_id, date);
CREATE INDEX IF NOT EXISTS idx_grades_assessment ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);

-- Jurnal Mengajar
CREATE INDEX IF NOT EXISTS idx_journals_asg_date ON teaching_journals(assignment_id, date);

-- Sync Queue & Audit
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_sched ON sync_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_school ON sync_queue(school_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_date ON audit_logs(school_id, created_at);
