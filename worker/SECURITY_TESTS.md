# Skenario Pengujian Otentikasi, Sesi, RBAC & Multi-User Security (Fase U5)

Dokumen ini mendefinisikan 16 skenario uji verifikasi kepatuhan keamanan pada Cloudflare Worker & D1 API Layer:

---

### Test Matrix

| No | Skenario Uji | Aksi / Request | Ekspektasi Respon | Status Keamanan |
|---|---|---|---|:---:|
| 1 | **Guru Login Berhasil** | `POST /api/auth/login` dengan `budi` / `password123` | `HTTP 200 OK`, Return secure token & Set-Cookie HttpOnly | PASSED |
| 2 | **Password Salah** | `POST /api/auth/login` dengan password keliru | `HTTP 401 Unauthorized`, Pesan generik tanpa bocor info | PASSED |
| 3 | **Session Expired / Token Invalid** | Request dengan token kadaluarsa | `HTTP 401 Unauthorized`, Sesi ditolak | PASSED |
| 4 | **Guru Akses Assignment Miliknya** | `POST /api/attendance` untuk `assignment_id` milik Guru | `HTTP 201 Created`, Presensi & Outbox sync tersimpan | PASSED |
| 5 | **Guru Akses Assignment Guru Lain** | `POST /api/attendance` untuk `assignment_id` guru lain | `HTTP 403 Forbidden`, Akses ditolak & dicatat di audit log | PASSED |
| 6 | **Guru Akses Siswa Bukan Anggota Kelas** | `POST /api/attendance` dengan `student_id` luar kelas | `HTTP 400 Invalid Student Enrollment`, Ditolak | PASSED |
| 7 | **Guru Input Nilai untuk Siswa Sendiri** | `POST /api/grades` pada assessment miliknya | `HTTP 201 Created`, Nilai tersimpan | PASSED |
| 8 | **Guru Input Nilai untuk Siswa Kelas Lain**| `POST /api/grades` untuk siswa luar rombel | `HTTP 400 Validation Error`, Ditolak | PASSED |
| 9 | **Admin Mengelola Master Data Guru** | `GET /api/teachers` dengan role `ADMIN` | `HTTP 200 OK`, Data master dikembalikan | PASSED |
| 10 | **Guru Mencoba Hapus Master Guru** | `DELETE /api/teachers/G001` dengan role `GURU` | `HTTP 403 Forbidden`, Ditolak oleh RBAC | PASSED |
| 11 | **User Sekolah A Akses Sekolah B** | Request manipulasi `school_id` | `HTTP 403 Forbidden`, Isolasi multi-tenant terjaga | PASSED |
| 12 | **Logout Sesi Aktif** | `POST /api/auth/logout` | `HTTP 200 OK`, Token dihapus dari DB & Cookie di-clear | PASSED |
| 13 | **Pencabutan Sesi Tertentu (Revoke)** | `POST /api/auth/sessions/revoke` | `HTTP 200 OK`, Token sesi target dicabut | PASSED |
| 14 | **Ubah Kata Sandi (Change Password)** | `POST /api/auth/change-password` | `HTTP 200 OK`, Hash diperbarui, sesi lain di-revoke | PASSED |
| 15 | **IDOR Protection pada Resource ID** | `GET /api/journals/OTHER_ID` milik guru lain | `HTTP 403 / 404`, Proteksi IDOR aktif | PASSED |
| 16 | **Sanitasi Log Audit** | Audit logging saat mutasi & error | Password & raw token 100% tersanitasi dari log | PASSED |
