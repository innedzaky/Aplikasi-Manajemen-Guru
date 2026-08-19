# U9 Production Hardening & Observability Specification

## 1. Architectural Baseline & Overview
Sistem Manajemen Guru dirancang dengan arsitektur **Cloudflare Worker + D1 (Primary Database) + Google Apps Script / Google Sheets (Read Replica)**. Seluruh mutasi data di-commit secara ACID pada Cloudflare D1, kemudian disinkronkan secara asinkron (outbox pattern) ke Google Sheets menggunakan HMAC-SHA256 authenticated webhook.

Dokumen ini mendefinisikan langkah-langkah **Production Hardening, Observability, dan Failure Detection** yang diterapkan pada sistem sebelum deployment produksi.

---

## 2. Environment & Secret Hardening
1. **Zero Secret Logging**:
   - Tidak ada token, `SESSION_SECRET`, `SYNC_SECRET`, password hash, atau credential yang dicetak ke `console.log`, audit log, atau response payload.
   - Endpoint `/api/health` hanya menampilkan status `CONFIGURED` / `MISSING` / `INVALID` tanpa membocorkan nilai secret.
2. **Secret Length & Entropy**:
   - `SESSION_SECRET` wajib memiliki entropi minimal 16 karakter (direkomendasikan 32+ byte string acak kriptografis).
   - `SYNC_SECRET` digunakan untuk HMAC-SHA256 payload signing dan shared-secret verification dengan Google Apps Script.
3. **Multi-Environment Isolation**:
   - Staging (`db_guru_staging`) terisolasi total dari Production (`db_guru_production`).
   - Setiap environment memiliki D1 database ID, CORS origin, dan secrets terpisah di `wrangler.toml`.

---

## 3. Security Headers & Network Protection
Semua HTTP responses dari Cloudflare Worker dilengkapi header proteksi tingkat produksi:
- `X-Content-Type-Options: nosniff`: Mencegah MIME-type sniffing.
- `X-Frame-Options: DENY`: Mencegah clickjacking attacks.
- `X-XSS-Protection: 1; mode=block`: Proteksi cross-site scripting peramban lama.
- `Referrer-Policy: strict-origin-when-cross-origin`: Membatasi kebocoran referer.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Menonaktifkan akses perangkat keras yang tidak diperlukan.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`: Memaksa koneksi HTTPS.

---

## 4. Rate Limiting Strategy
Untuk melindungi endpoint sensitif dari brute force dan denial-of-service, diterapkan rate limiting berbasis sliding window:
- **POST `/api/auth/login`**: Maksimal 10 request per menit per IP. Menghentikan serangan credential stuffing & brute force.
- **POST `/api/auth/change-password`**: Maksimal 5 percobaan per menit per user ID/IP.
- **POST `/api/auth/sessions/revoke`**: Maksimal 10 request per menit per user ID/IP.
- **POST `/api/sync/retry/:id`**: Maksimal 10 request per menit per school ID/IP.
- **HTTP 429 Response**: Menyertakan header `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `X-RateLimit-Reset`.

---

## 5. Observability & Telemetry Endpoints
### A. GET `/api/health`
- Verifikasi konektivitas D1 Database secara non-destruktif (`SELECT count(*) FROM sqlite_schema`).
- Pelaporan latensi query internal (ms).
- Validasi status konfigurasi environment (D1 binding, session secret, sync secret, GAS URL).

### B. GET `/api/sync/status`
- **Metrik Antrean**: `pending`, `processing`, `synced`, `failed`, `deadLetter`, `staleProcessing`.
- **Telemetri Latensi**: `averageLatencyMs` (rata-rata durasi webhook 24 jam terakhir), `lastSuccessfulSync`.
- **Failure Detection & Alerts**:
  - `DEAD_LETTER_ACCUMULATION`: Alert tingkat `CRITICAL` jika terdapat item dengan retry >= 5.
  - `STALE_PROCESSING`: Alert tingkat `WARNING` jika ada item macet di status `PROCESSING` > 5 menit.
  - `QUEUE_BUILDUP`: Alert tingkat `WARNING` jika item `PENDING` > 50.
  - `HIGH_FAILURE_RATE`: Alert tingkat `WARNING` jika item `FAILED` > 10.
- **Health Status**: Status sintetis (`HEALTHY`, `DEGRADED`, `CRITICAL`).

---

## 6. Multi-Tenant Scoping & Data Isolation
- Semua tabel operasional (`sync_queue`, `sync_logs`, `audit_logs`, `teachers`, `students`, `classes`, `subjects`, `teacher_assignments`, `attendance_sessions`, `attendance_records`, `assessments`, `grades`, `teaching_journals`) memuat kolom `school_id`.
- Seluruh endpoint API menerapkan scoped query `WHERE school_id = ?` yang diambil langsung dari session token terotentikasi.
- Sekolah A tidak dapat membaca, mengubah, me-retry, atau mengakses antrean maupun spreadsheet Sekolah B.
