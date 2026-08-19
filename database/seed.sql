-- ============================================================================
-- CLOUDFLARE D1 SEED DATA SCRIPT (DEMO & INITIAL SETUP)
-- ============================================================================

-- 1. Sekolah
INSERT OR IGNORE INTO schools (id, npsn, name, address, phone, email) VALUES
('sch_default_01', '20109999', 'SMA Negeri 1 Edukasi', 'Jl. Pendidikan No. 45, Jakarta', '021-5551234', 'info@sman1edukasi.sch.id');

-- 2. Tahun Ajaran & Semester
INSERT OR IGNORE INTO academic_years (id, school_id, name, start_date, end_date, is_active) VALUES
('ay_2026_2027', 'sch_default_01', '2026/2027', '2026-07-15', '2027-06-25', 1);

INSERT OR IGNORE INTO academic_terms (id, academic_year_id, name, term_number, is_active) VALUES
('term_2026_1', 'ay_2026_2027', 'Ganjil', 1, 1),
('term_2026_2', 'ay_2026_2027', 'Genap', 2, 0);

-- 3. Akun Pengguna (Users) - Note: Hash SHA-256 / PBKDF2
-- Password default: 'admin123' -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- Password default: 'password123' -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT OR IGNORE INTO users (id, school_id, username, password_hash, role, is_active) VALUES
('usr_owner_01', 'sch_default_01', 'owner', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'OWNER', 1),
('usr_admin_01', 'sch_default_01', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ADMIN', 1),
('usr_guru_01',  'sch_default_01', 'budi',  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'GURU', 1),
('usr_guru_02',  'sch_default_01', 'siti',  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'GURU', 1);

-- 4. Profil Guru (Teachers)
INSERT OR IGNORE INTO teachers (id, school_id, user_id, nip, name, email, phone, specialization, is_active) VALUES
('G001', 'sch_default_01', 'usr_guru_01', '198501152010011001', 'Budi Santoso, S.Pd.', 'budi@sman1edukasi.sch.id', '081234567890', 'Matematika', 1),
('G002', 'sch_default_01', 'usr_guru_02', '199003202015022002', 'Siti Rahayu, M.Pd.', 'siti@sman1edukasi.sch.id', '081298765432', 'Bahasa Indonesia', 1);

-- 5. Master Kelas & Mapel
INSERT OR IGNORE INTO classes (id, school_id, academic_year_id, name, grade_level, homeroom_teacher_id) VALUES
('K001', 'sch_default_01', 'ay_2026_2027', 'X TKJ 1', 10, 'G001'),
('K002', 'sch_default_01', 'ay_2026_2027', 'X TKJ 2', 10, 'G002'),
('K003', 'sch_default_01', 'ay_2026_2027', 'XI TKJ 1', 11, 'G001');

INSERT OR IGNORE INTO subjects (id, school_id, code, name, default_kkm) VALUES
('M001', 'sch_default_01', 'MAT-10', 'Matematika', 75.0),
('M002', 'sch_default_01', 'IND-10', 'Bahasa Indonesia', 75.0),
('M003', 'sch_default_01', 'ING-10', 'Bahasa Inggris', 75.0);

-- 6. Master Siswa & Enrollment
INSERT OR IGNORE INTO students (id, school_id, nisn, name, gender, is_active) VALUES
('std_001', 'sch_default_01', '0081234501', 'Aditya Pratama', 'L', 1),
('std_002', 'sch_default_01', '0081234502', 'Anisa Rahmawati', 'P', 1),
('std_003', 'sch_default_01', '0081234503', 'Bagus Setiawan', 'L', 1),
('std_004', 'sch_default_01', '0081234504', 'Cantika Dewi', 'P', 1),
('std_005', 'sch_default_01', '0081234505', 'Dedi Kurniawan', 'L', 1);

INSERT OR IGNORE INTO student_enrollments (id, school_id, student_id, class_id, academic_year_id, start_date, is_active) VALUES
('enr_001', 'sch_default_01', 'std_001', 'K001', 'ay_2026_2027', '2026-07-15', 1),
('enr_002', 'sch_default_01', 'std_002', 'K001', 'ay_2026_2027', '2026-07-15', 1),
('enr_003', 'sch_default_01', 'std_003', 'K001', 'ay_2026_2027', '2026-07-15', 1),
('enr_004', 'sch_default_01', 'std_004', 'K001', 'ay_2026_2027', '2026-07-15', 1),
('enr_005', 'sch_default_01', 'std_005', 'K001', 'ay_2026_2027', '2026-07-15', 1);

-- 7. Teacher Assignments (Plotting Mengajar)
INSERT OR IGNORE INTO teacher_assignments (id, school_id, teacher_id, subject_id, class_id, academic_term_id, custom_kkm) VALUES
('asg_001', 'sch_default_01', 'G001', 'M001', 'K001', 'term_2026_1', 75.0),
('asg_002', 'sch_default_01', 'G001', 'M001', 'K002', 'term_2026_1', 75.0),
('asg_003', 'sch_default_01', 'G002', 'M002', 'K001', 'term_2026_1', 75.0);
