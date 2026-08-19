# U9 Production Deployment Checklist

Dokumen ini adalah checklist standar operasional prosedur (SOP) sebelum dan saat melakukan deployment Cloudflare Worker API & Google Apps Script ke environment Produksi.

---

## 1. Pre-Deployment Verification Gate (Wajib Lulus)
- [ ] **Type Check & Linting**: `npm run lint` / `tsc --noEmit` bersih tanpa warning atau error.
- [ ] **Test Regression Baseline**:
  - [ ] FASE U6-V D1 Integration & Security: 32/32 PASS
  - [ ] FASE U7.2 Outbox Sync & HMAC Engine: 24/24 PASS
  - [ ] FASE U8 E2E Integration: 22/22 PASS
  - [ ] FASE U9 Production Hardening & Observability: ALL PASS
- [ ] **Zero Hardcoded Secrets**: Tidak ada token, API key, atau password tersimpan di git repository.
- [ ] **Schema Migration Integrity**: Seluruh file migrasi D1 (`0001_initial_schema.sql`, `0002_indexes.sql`) tervalidasi sintaks dan foreign key constraints-nya.

---

## 2. Cloudflare D1 Database Provisioning (Production)
1. Buat database D1 production:
   ```bash
   npx wrangler d1 create db_guru_production
   ```
2. Catat `database_id` yang dihasilkan dan perbarui blok `[env.production.d1_databases]` pada `wrangler.toml`.
3. Jalankan migrasi schema pada database produksi:
   ```bash
   npx wrangler d1 migrations apply db_guru_production --remote
   ```
4. Verifikasi tabel dan indeks telah terbuat:
   ```bash
   npx wrangler d1 execute db_guru_production --remote --command "SELECT count(*) FROM sqlite_schema WHERE type='table';"
   ```

---

## 3. Cloudflare Worker Secrets Configuration
Set rahasia produksi secara aman melalui Cloudflare Secrets (bukan plaintext di file config):
```bash
# 1. Secret enkripsi sesi login
npx wrangler secret put SESSION_SECRET --env production

# 2. Secret tanda tangan HMAC-SHA256 sinkronisasi Outbox
npx wrangler secret put SYNC_SECRET --env production

# 3. Webhook URL Google Apps Script Web App (Exec URL)
npx wrangler secret put GAS_SYNC_URL --env production
```

---

## 4. Google Apps Script & Replica Spreadsheet Setup
1. Buat Google Spreadsheet baru untuk replika produksi tiap sekolah.
2. Buka **Extensions > Apps Script** dan pasang kode dari direktori `/gas`.
3. Atur script properties pada Apps Script:
   - `SYNC_SECRET`: Wajib persis sama dengan `SYNC_SECRET` di Cloudflare Worker.
   - `SCHOOL_ID`: Sesuai ID sekolah terkait.
4. Deploy Apps Script sebagai **Web App**:
   - Execute as: *Me* (akun pemilik/admin Google Workspace).
   - Who has access: *Anyone* (keamanan dilindungi oleh HMAC-SHA256 signature).
5. Salin URL `/exec` dan konfigurasikan ke `GAS_SYNC_URL` Cloudflare Worker.

---

## 5. Deployment Execution
Deploy Cloudflare Worker ke environment production:
```bash
npx wrangler deploy --env production
```

---

## 6. Post-Deployment Smoke Test & Verification
- [ ] **Health Check**: Panggil `GET https://<production-worker-domain>/api/health`.
  - Pastikan `status: "healthy"` dan `database: "connected"`.
- [ ] **Security Headers Check**: Verifikasi keberadaan header `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- [ ] **Rate Limiting Smoke Test**: Verifikasi endpoint `/api/auth/login` mengembalikan 429 jika dibombardir > 10 req/menit.
- [ ] **Cron Trigger Check**: Verifikasi Cron Trigger `* * * * *` aktif di Cloudflare Dashboard untuk memproses antrean Outbox per menit.
- [ ] **Sync Observability**: Panggil `GET /api/sync/status` menggunakan token Admin dan pastikan `healthStatus: "HEALTHY"`.
