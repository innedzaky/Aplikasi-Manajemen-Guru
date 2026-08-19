-- ============================================================
-- MIGRATION 0003: DEVELOPMENT SEED DATA (DEV ONLY)
-- FASE U6 - CLOUDFLARE D1 PRIMARY DATABASE
-- ============================================================

-- 1. SCHOOL
INSERT OR IGNORE INTO schools (id, name, npsn, address, phone, email, is_active)
VALUES ('sch_nusantara_01', 'SMA Nusantara Mandiri', '10293847', 'Jl. Merdeka Pendidikan No. 45', '021-5551234', 'info@smanusantara.sch.id', 1);

-- 2. ACADEMIC YEAR
INSERT OR IGNORE INTO academic_years (id, school_id, name, start_date, end_date, is_active)
VALUES ('ay_2026_2027', 'sch_nusantara_01', '2026/2027', '2026-07-15', '2027-06-25', 1);

-- 3. ACADEMIC TERM
INSERT OR IGNORE INTO academic_terms (id, school_id, academic_year_id, name, semester_type, start_date, end_date, is_active)
VALUES ('term_2026_ganjil', 'sch_nusantara_01', 'ay_2026_2027', 'Semester Ganjil 2026/2027', 'GANJIL', '2026-07-15', '2026-12-20', 1);

-- 4. USERS (Password for all dev accounts is: password123)
-- SHA-256 hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT OR IGNORE INTO users (id, school_id, username, password_hash, role, is_active) VALUES
('usr_owner_01', 'sch_nusantara_01', 'owner', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'OWNER', 1),
('usr_admin_01', 'sch_nusantara_01', 'admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'ADMIN', 1),
('usr_guru_budi', 'sch_nusantara_01', 'budi', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'GURU', 1),
('usr_guru_siti', 'sch_nusantara_01', 'siti', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'GURU', 1),
('usr_guru_ahmad', 'sch_nusantara_01', 'ahmad', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'GURU', 1);

-- 5. TEACHERS
INSERT OR IGNORE INTO teachers (id, school_id, user_id, nip, name, email, phone, specialization, is_active) VALUES
('tch_budi', 'sch_nusantara_01', 'usr_guru_budi', '198501102010011001', 'Budi Santoso, M.Pd.', 'budi@smanusantara.sch.id', '081234567890', 'Matematika', 1),
('tch_siti', 'sch_nusantara_01', 'usr_guru_siti', '198803152012022002', 'Siti Rahmawati, S.Pd.', 'siti@smanusantara.sch.id', '081234567891', 'Bahasa Indonesia', 1),
('tch_ahmad', 'sch_nusantara_01', 'usr_guru_ahmad', '199007202015031003', 'Ahmad Fauzi, S.Si.', 'ahmad@smanusantara.sch.id', '081234567892', 'Fisika', 1);

-- 6. CLASSES
INSERT OR IGNORE INTO classes (id, school_id, academic_year_id, name, level, major, homeroom_teacher_id, is_active) VALUES
('cls_10_a', 'sch_nusantara_01', 'ay_2026_2027', 'X-A', 10, 'MIPA', 'tch_budi', 1),
('cls_10_b', 'sch_nusantara_01', 'ay_2026_2027', 'X-B', 10, 'MIPA', 'tch_siti', 1),
('cls_11_ipa_1', 'sch_nusantara_01', 'ay_2026_2027', 'XI-IPA-1', 11, 'MIPA', 'tch_ahmad', 1);

-- 7. SUBJECTS
INSERT OR IGNORE INTO subjects (id, school_id, code, name, category, default_kkm, is_active) VALUES
('sbj_mat', 'sch_nusantara_01', 'MAT-WAJIB', 'Matematika Wajib', 'WAJIB', 75.0, 1),
('sbj_bind', 'sch_nusantara_01', 'BIND-WAJIB', 'Bahasa Indonesia', 'WAJIB', 75.0, 1),
('sbj_fis', 'sch_nusantara_01', 'FIS-PEMINATAN', 'Fisika Peminatan', 'PEMINATAN', 72.0, 1),
('sbj_bing', 'sch_nusantara_01', 'BING-WAJIB', 'Bahasa Inggris', 'WAJIB', 75.0, 1),
('sbj_bio', 'sch_nusantara_01', 'BIO-PEMINATAN', 'Biologi Peminatan', 'PEMINATAN', 74.0, 1);

-- 8. STUDENTS (20 Siswa)
INSERT OR IGNORE INTO students (id, school_id, nis, nisn, name, gender, birth_place, birth_date, is_active) VALUES
('std_01', 'sch_nusantara_01', '26001', '0081234501', 'Aditya Pratama', 'L', 'Jakarta', '2010-04-12', 1),
('std_02', 'sch_nusantara_01', '26002', '0081234502', 'Anisa Putri Lestari', 'P', 'Bandung', '2010-05-18', 1),
('std_03', 'sch_nusantara_01', '26003', '0081234503', 'Bagus Ramadhan', 'L', 'Surabaya', '2010-09-21', 1),
('std_04', 'sch_nusantara_01', '26004', '0081234504', 'Cantika Dewi', 'P', 'Semarang', '2010-02-14', 1),
('std_05', 'sch_nusantara_01', '26005', '0081234505', 'Dedi Kurniawan', 'L', 'Yogyakarta', '2010-11-05', 1),
('std_06', 'sch_nusantara_01', '26006', '0081234506', 'Eka Nur Safitri', 'P', 'Malang', '2010-08-30', 1),
('std_07', 'sch_nusantara_01', '26007', '0081234507', 'Farhan Maulana', 'L', 'Bogor', '2010-06-16', 1),
('std_08', 'sch_nusantara_01', '26008', '0081234508', 'Gita Ayu Permata', 'P', 'Depok', '2010-12-01', 1),
('std_09', 'sch_nusantara_01', '26009', '0081234509', 'Hendra Setiawan', 'L', 'Tangerang', '2010-07-22', 1),
('std_10', 'sch_nusantara_01', '26010', '0081234510', 'Intan Permatasari', 'P', 'Bekasi', '2010-03-10', 1),
('std_11', 'sch_nusantara_01', '26011', '0081234511', 'Joko Susilo', 'L', 'Solo', '2010-01-25', 1),
('std_12', 'sch_nusantara_01', '26012', '0081234512', 'Kartika Sari', 'P', 'Cirebon', '2010-10-14', 1),
('std_13', 'sch_nusantara_01', '26013', '0081234513', 'Lukman Hakim', 'L', 'Medan', '2010-04-05', 1),
('std_14', 'sch_nusantara_01', '26014', '0081234514', 'Maya Anggraini', 'P', 'Palembang', '2010-06-28', 1),
('std_15', 'sch_nusantara_01', '26015', '0081234515', 'Naufal Izzudin', 'L', 'Padang', '2010-09-15', 1),
('std_16', 'sch_nusantara_01', '26016', '0081234516', 'Olivia Maharani', 'P', 'Denpasar', '2010-11-19', 1),
('std_17', 'sch_nusantara_01', '26017', '0081234517', 'Panji Gumilang', 'L', 'Makassar', '2009-05-11', 1),
('std_18', 'sch_nusantara_01', '26018', '0081234518', 'Qori Amelia', 'P', 'Manado', '2009-08-08', 1),
('std_19', 'sch_nusantara_01', '26019', '0081234519', 'Rian Hidayat', 'L', 'Pontianak', '2009-12-12', 1),
('std_20', 'sch_nusantara_01', '26020', '0081234520', 'Salsabila Zahra', 'P', 'Banjarmasin', '2009-03-03', 1);

-- 9. STUDENT ENROLLMENTS
-- Class X-A (std_01 s.d. std_07)
INSERT OR IGNORE INTO student_enrollments (id, school_id, student_id, class_id, academic_year_id, status, is_active) VALUES
('enr_01', 'sch_nusantara_01', 'std_01', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_02', 'sch_nusantara_01', 'std_02', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_03', 'sch_nusantara_01', 'std_03', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_04', 'sch_nusantara_01', 'std_04', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_05', 'sch_nusantara_01', 'std_05', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_06', 'sch_nusantara_01', 'std_06', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1),
('enr_07', 'sch_nusantara_01', 'std_07', 'cls_10_a', 'ay_2026_2027', 'ACTIVE', 1);

-- Class X-B (std_08 s.d. std_14)
INSERT OR IGNORE INTO student_enrollments (id, school_id, student_id, class_id, academic_year_id, status, is_active) VALUES
('enr_08', 'sch_nusantara_01', 'std_08', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_09', 'sch_nusantara_01', 'std_09', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_10', 'sch_nusantara_01', 'std_10', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_11', 'sch_nusantara_01', 'std_11', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_12', 'sch_nusantara_01', 'std_12', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_13', 'sch_nusantara_01', 'std_13', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1),
('enr_14', 'sch_nusantara_01', 'std_14', 'cls_10_b', 'ay_2026_2027', 'ACTIVE', 1);

-- Class XI-IPA-1 (std_15 s.d. std_20)
INSERT OR IGNORE INTO student_enrollments (id, school_id, student_id, class_id, academic_year_id, status, is_active) VALUES
('enr_15', 'sch_nusantara_01', 'std_15', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1),
('enr_16', 'sch_nusantara_01', 'std_16', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1),
('enr_17', 'sch_nusantara_01', 'std_17', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1),
('enr_18', 'sch_nusantara_01', 'std_18', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1),
('enr_19', 'sch_nusantara_01', 'std_19', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1),
('enr_20', 'sch_nusantara_01', 'std_20', 'cls_11_ipa_1', 'ay_2026_2027', 'ACTIVE', 1);

-- 10. TEACHER ASSIGNMENTS
INSERT OR IGNORE INTO teacher_assignments (id, school_id, teacher_id, subject_id, class_id, academic_term_id, custom_kkm, is_active) VALUES
('asg_budi_mat_10a', 'sch_nusantara_01', 'tch_budi', 'sbj_mat', 'cls_10_a', 'term_2026_ganjil', 75.0, 1),
('asg_budi_mat_11ipa', 'sch_nusantara_01', 'tch_budi', 'sbj_mat', 'cls_11_ipa_1', 'term_2026_ganjil', 78.0, 1),
('asg_siti_bind_10a', 'sch_nusantara_01', 'tch_siti', 'sbj_bind', 'cls_10_a', 'term_2026_ganjil', 75.0, 1),
('asg_siti_bind_10b', 'sch_nusantara_01', 'tch_siti', 'sbj_bind', 'cls_10_b', 'term_2026_ganjil', 75.0, 1),
('asg_ahmad_fis_11ipa', 'sch_nusantara_01', 'tch_ahmad', 'sbj_fis', 'cls_11_ipa_1', 'term_2026_ganjil', 75.0, 1);
