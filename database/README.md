# Cloudflare D1 Database Specification & Schema Architecture

## Ikhtisar Arsitektur
Database dirancang dengan skema relasional murni (3NF) berbasis SQLite pada Cloudflare D1 sebagai **Primary Database** untuk performa latensi ultra-rendah (<50ms) dan konkurensi multi-guru. Google Spreadsheet berperan sebagai **Secondary Database / Backup / Reporting** yang menerima mutasi data asinkron via Outbox Pattern (`sync_queue`).

---

## Daftar 19 Entitas Relasional

1. `schools` — Metadata institusi/sekolah (Multi-tenant ready).
2. `users` — Akun pengguna dengan password hash dan role (`OWNER`, `ADMIN`, `GURU`).
3. `sessions` — Manajemen sesi aktif terenkripsi dengan batas kadaluarsa.
4. `teachers` — Profil identitas guru dan NIP.
5. `classes` — Rombongan belajar dan tahun ajaran aktif.
6. `subjects` — Mata pelajaran dan standar KKM default.
7. `students` — Profil siswa dengan ID internal dan NISN.
8. `student_enrollments` — Riwayat keanggotaan siswa di kelas per tahun ajaran.
9. `academic_years` — Periode tahun ajaran (contoh: 2026/2027).
10. `academic_terms` — Semester aktif (1 = Ganjil, 2 = Genap).
11. `teacher_assignments` — Relasi sentral: Guru + Mapel + Kelas + Semester.
12. `attendance_sessions` — Header pertemuan presensi kelas.
13. `attendance_records` — Detail kehadiran siswa (`H`, `S`, `I`, `A`).
14. `assessments` — Header evaluasi pembelajaran (Tugas, UH, PTS, PAS, Praktik).
15. `grades` — Nilai angka siswa ($0 - 100$) dan predikat.
16. `teaching_journals` — Agenda mengajar, materi, aktivitas, dan refleksi KBM.
17. `sync_queue` — Antrean Outbox Pattern mutasi ke Google Spreadsheet.
18. `sync_logs` — Log histori dan respon sinkronisasi.
19. `audit_logs` — Jejak audit aktivitas keamanan dan perubahan data penting.

---

## File Database:
- `database/schema.sql` — Definisi DDL seluruh tabel, foreign key, check constraint, dan indeks performa.
- `database/seed.sql` — Data inisialisasi awal dan akun demo pengujian.
