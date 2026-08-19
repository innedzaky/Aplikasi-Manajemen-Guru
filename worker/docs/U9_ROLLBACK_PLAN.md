# U9 Rollback & Disaster Recovery Plan

Dokumen ini mendefinisikan rencana mitigasi insiden, rollback worker, dan pemulihan basis data D1 jika terjadi kegagalan operasional di lingkungan produksi.

---

## 1. Trigger Kondisi Rollback
Rollback segera dipicu jika salah satu kondisi berikut terjadi setelah rilis:
1. **Health Check Failure**: Endpoint `/api/health` mengembalikan status `503` atau database `disconnected` selama > 2 menit.
2. **Crash Loop / Unhandled Exceptions**: Error rate API > 1% dari total request.
3. **Authentication Failure**: Semua user gagal login (HTTP 500 / 401 massal).
4. **Queue Jamming**: Antrean `sync_queue` bertumpuk > 500 item tanpa pemrosesan > 15 menit.
5. **Data Corruption**: Terdeteksi ketidakcocokan foreign key atau data integrity violation.

---

## 2. Cloudflare Worker Instant Version Rollback
Cloudflare Workers mendukung rollback instan (Zero Downtime) ke deployment versi sebelumnya:

### Prosedur Rollback Cepat:
1. Lihat daftar deployment ID sebelumnya:
   ```bash
   npx wrangler deployments list --env production
   ```
2. Rollback ke versi stabil sebelumnya:
   ```bash
   npx wrangler rollback [DEPLOYMENT_ID] --env production
   ```
3. Verifikasi rollback sukses dengan memeriksa `/api/health`.

---

## 3. Cloudflare D1 Database Backup & Restoration Strategy

### A. Automated Point-in-Time Backup
Cloudflare D1 secara otomatis melakukan point-in-time snapshot. Selain itu, sebelum melakukan migrasi schema baru, lakukan export snapshot manual:
```bash
# Export snapshot cadangan sebelum migrasi / rilis besar
npx wrangler d1 export db_guru_production --remote --output="./backups/d1_backup_$(date +%Y%m%d_%H%M%S).sql"
```

### B. Prosedur Pemulihan Database (Database Disaster Recovery Drill)
Jika data primer D1 mengalami kerusakan atau human error:
1. Buat database D1 pemulihan baru di staging terlebih dahulu (TIDAK BOLEH langsung me-restore database produksi yang sedang berjalan):
   ```bash
   npx wrangler d1 create db_guru_recovery_drill
   ```
2. Eksekusi file backup ke database drill:
   ```bash
   npx wrangler d1 execute db_guru_recovery_drill --file="./backups/d1_backup_latest.sql"
   ```
3. Lakukan integrity check pada database pemulihan:
   - Validasi foreign key (`PRAGMA foreign_key_check;`).
   - Validasi jumlah baris pada 19 tabel inti.
   - Validasi integritas antrean outbox (`SELECT count(*) FROM sync_queue WHERE status = 'PENDING'`).
4. Setelah verifikasi staging berhasil 100%, arahkan binding worker produksi ke database yang telah dipulihkan.

---

## 4. Google Sheets Replica Re-Sync Procedure
Jika Google Sheets replika mengalami kerusakan format atau data terhapus secara manual di spreadsheet oleh pengguna:
1. Data primer di D1 tetap 100% aman dan utuh (karena arsitektur one-way sync D1 -> GAS).
2. Bersihkan tab spreadsheet yang rusak (atau buat file spreadsheet baru).
3. Reset baris pada `sync_queue` untuk entitas yang perlu disinkronkan ulang:
   ```sql
   UPDATE sync_queue 
   SET status = 'PENDING', retry_count = 0, scheduled_at = datetime('now') 
   WHERE school_id = 'sch_target_id';
   ```
4. Panggil endpoint admin trigger `/api/sync/trigger` atau biarkan Cron memproses sinkronisasi ulang secara otomatis.
