/**
 * =========================================================================
 * syncTemplates.ts - Ready-to-Deploy Code Templates for D1, Worker & Apps Script
 * =========================================================================
 */

export const D1_SQL_SCHEMA = `-- =========================================================================
-- CLOUDFLARE D1 SQL SCHEMA - SISTEM MANAJEMEN GURU, PRESENSI & NILAI (v2.4.0)
-- Jalankan perintah ini di Console Cloudflare D1 atau via Wrangler CLI:
-- npx wrangler d1 execute db-sekolah --file=./schema.sql
-- =========================================================================

-- 1. Tabel Master Administrator
CREATE TABLE IF NOT EXISTS admin (
  id_admin TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123',
  email TEXT DEFAULT '',
  role TEXT CHECK(role IN ('superadmin', 'admin')) NOT NULL DEFAULT 'admin',
  status TEXT CHECK(status IN ('aktif', 'nonaktif')) NOT NULL DEFAULT 'aktif',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inisialisasi Akun Super Admin (innedzaky) & Admin Bawaan (admin)
INSERT OR IGNORE INTO admin (id_admin, username, nama_lengkap, password, email, role, status)
VALUES 
  ('ADM001', 'innedzaky', 'Inne Dzaky (Super Admin)', '1sampai7', 'innedzaky@gmail.com', 'superadmin', 'aktif'),
  ('ADM002', 'admin', 'Administrator Sekolah', 'admin123', 'admin@sekolah.sch.id', 'admin', 'aktif');

-- 2. Tabel Master Guru
CREATE TABLE IF NOT EXISTS guru (
  id_guru TEXT PRIMARY KEY,
  nama_guru TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'password123',
  mapel TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Master Siswa
CREATE TABLE IF NOT EXISTS siswa (
  nisn TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Master Kelas
CREATE TABLE IF NOT EXISTS kelas (
  id_kelas TEXT PRIMARY KEY,
  nama_kelas TEXT NOT NULL,
  wali_kelas TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Master Mapel
CREATE TABLE IF NOT EXISTS mapel (
  id_mapel TEXT PRIMARY KEY,
  nama_mapel TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Transaksi Presensi Siswa
CREATE TABLE IF NOT EXISTS presensi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal TEXT NOT NULL,
  guru TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kelas TEXT NOT NULL,
  pertemuan INTEGER NOT NULL,
  nama_siswa TEXT NOT NULL,
  status TEXT CHECK(status IN ('Hadir', 'Izin', 'Sakit', 'Alpa')) NOT NULL,
  catatan TEXT DEFAULT '',
  synced_to_sheets INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Transaksi Penilaian Siswa
CREATE TABLE IF NOT EXISTS nilai (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal TEXT DEFAULT '',
  guru TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kelas TEXT NOT NULL,
  jenis_penilaian TEXT CHECK(jenis_penilaian IN ('Tugas', 'UH', 'PTS', 'PAS', 'Praktik', 'Project')) NOT NULL,
  nama_penilaian TEXT NOT NULL,
  nama_siswa TEXT NOT NULL,
  nilai REAL NOT NULL DEFAULT 0,
  catatan TEXT DEFAULT '',
  synced_to_sheets INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Transaksi Jurnal Mengajar
CREATE TABLE IF NOT EXISTS jurnal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal TEXT NOT NULL,
  jam TEXT NOT NULL,
  guru TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kelas TEXT NOT NULL,
  materi TEXT NOT NULL,
  tujuan_pembelajaran TEXT DEFAULT '',
  aktivitas TEXT DEFAULT '',
  metode TEXT DEFAULT '',
  media TEXT DEFAULT '',
  refleksi TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  status TEXT CHECK(status IN ('Terlaksana', 'Sebagian', 'Tidak terlaksana')) NOT NULL,
  synced_to_sheets INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Audit Log Sinkronisasi
CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  direction TEXT NOT NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  message TEXT DEFAULT ''
);

-- =========================================================================
-- INDEKS OPTIMASI PENCARIAN & INTEGRITAS RELASIONAL
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_presensi_lookup ON presensi(tanggal, kelas, mapel);
CREATE INDEX IF NOT EXISTS idx_presensi_siswa ON presensi(nama_siswa, tanggal);
CREATE INDEX IF NOT EXISTS idx_nilai_lookup ON nilai(kelas, mapel, nama_penilaian);
CREATE INDEX IF NOT EXISTS idx_jurnal_lookup ON jurnal(tanggal, kelas, guru);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
`;

export const CLOUDFLARE_WORKER_CODE = `/**
 * =========================================================================
 * Cloudflare Worker + D1 Backend & Google Apps Script Auto-Sync (v2.4.0)
 * =========================================================================
 * File: worker.ts
 * Deploy dengan Cloudflare Wrangler:
 * 1. npm create cloudflare@latest api-sekolah-d1
 * 2. Tambahkan binding D1 di wrangler.toml:
 *    [[d1_databases]]
 *    binding = "DB"
 *    database_name = "db-sekolah"
 *    database_id = "<DATABASE_ID_ANDA>"
 * 3. wrangler secret put GAS_WEBAPP_URL
 * 4. wrangler secret put API_SECRET_TOKEN
 * 5. wrangler deploy
 */

export interface Env {
  DB: D1Database;
  GAS_WEBAPP_URL?: string;
  API_SECRET_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key"
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Content-Type": "application/json;charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    };

    try {
      // 1. Health & Ping Check
      if (path === "/api/health" || path === "/") {
        const d1Test = await env.DB.prepare("SELECT 1 as live").first();
        return new Response(
          JSON.stringify({
            success: true,
            engine: "Cloudflare D1 & Worker Serverless",
            status: "online",
            version: "v2.4.0",
            timestamp: new Date().toISOString(),
            d1Connected: Boolean(d1Test)
          }),
          { headers: corsHeaders }
        );
      }

      // 2. Routing Aksi API
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { action, data } = body as { action: string; data?: any };

        // === ADMIN / AUTENTIKASI ===
        if (action === "getAdmins") {
          const res = await env.DB.prepare("SELECT id_admin as ID_ADMIN, username as USERNAME, nama_lengkap as NAMA_LENGKAP, email as EMAIL, role as ROLE, status as STATUS, created_at as CREATED_AT FROM admin ORDER BY id_admin ASC").all();
          return new Response(JSON.stringify({ success: true, data: res.results }), { headers: corsHeaders });
        }

        if (action === "saveAdmin") {
          const isSuper = data?.ROLE === "superadmin" || data?.USERNAME?.toLowerCase() === "innedzaky";
          const role = isSuper ? "superadmin" : "admin";
          const id = data?.ID_ADMIN || ("ADM" + String(Date.now()).slice(-4));
          
          await env.DB.prepare(
            "INSERT INTO admin (id_admin, username, nama_lengkap, password, email, role, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(username) DO UPDATE SET nama_lengkap=excluded.nama_lengkap, email=excluded.email, role=excluded.role, status=excluded.status, password=COALESCE(excluded.password, admin.password), updated_at=CURRENT_TIMESTAMP"
          ).bind(id, data.USERNAME, data.NAMA_LENGKAP, data.PASSWORD || "admin123", data.EMAIL || "", role, data.STATUS || "aktif").run();

          return new Response(JSON.stringify({ success: true, message: "Akun administrator berhasil disimpan" }), { headers: corsHeaders });
        }

        if (action === "deleteAdmin") {
          const username = String(data?.USERNAME || "").toLowerCase();
          if (username === "innedzaky" || data?.ID_ADMIN === "ADM001" || data?.ROLE === "superadmin") {
            return new Response(JSON.stringify({ success: false, message: "Akun Super Administrator dilindungi dan tidak dapat dihapus." }), { headers: corsHeaders });
          }
          await env.DB.prepare("DELETE FROM admin WHERE LOWER(username) = ? OR id_admin = ?").bind(username, data?.ID_ADMIN || "").run();
          return new Response(JSON.stringify({ success: true, message: "Akun administrator berhasil dihapus" }), { headers: corsHeaders });
        }

        // === PRESENSI ===
        if (action === "getPresensi") {
          let query = "SELECT id as _rowIndex, timestamp as TIMESTAMP, tanggal as TANGGAL, guru as GURU, mapel as MAPEL, kelas as KELAS, pertemuan as PERTEMUAN, nama_siswa as NAMA_SISWA, status as STATUS, catatan as CATATAN FROM presensi WHERE 1=1";
          const params: any[] = [];
          if (data?.tanggal) {
            query += " AND tanggal = ?";
            params.push(data.tanggal);
          }
          if (data?.kelas) {
            query += " AND LOWER(kelas) = LOWER(?)";
            params.push(data.kelas);
          }
          if (data?.mapel) {
            query += " AND LOWER(mapel) = LOWER(?)";
            params.push(data.mapel);
          }
          query += " ORDER BY id DESC LIMIT 500";
          const res = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify({ success: true, data: res.results }), { headers: corsHeaders });
        }

        if (action === "createPresensiBatch") {
          const items = (data?.items || []) as any[];
          if (!items.length) {
            return new Response(JSON.stringify({ success: false, message: "Tidak ada data presensi" }), { headers: corsHeaders });
          }

          const stmts = items.map(p =>
            env.DB.prepare(
              "INSERT INTO presensi (tanggal, guru, mapel, kelas, pertemuan, nama_siswa, status, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              p.TANGGAL, p.GURU, p.MAPEL, p.KELAS, p.PERTEMUAN, p.NAMA_SISWA, p.STATUS, p.CATATAN || ""
            )
          );
          await env.DB.batch(stmts);

          // Asynchronous Trigger: Kirim data mirror ke Google Sheets jika GAS URL diset
          if (env.GAS_WEBAPP_URL) {
            ctx.waitUntil(forwardBackupToGoogleSheets(env.GAS_WEBAPP_URL, "createPresensiBatch", { items }));
          }

          return new Response(JSON.stringify({ success: true, message: \`Berhasil menyimpan \${items.length} presensi ke D1\`, data: { total: items.length } }), { headers: corsHeaders });
        }

        // === NILAI ===
        if (action === "getNilai") {
          let query = "SELECT id as _rowIndex, timestamp as TIMESTAMP, tanggal as TANGGAL, guru as GURU, mapel as MAPEL, kelas as KELAS, jenis_penilaian as JENIS_PENILAIAN, nama_penilaian as NAMA_PENILAIAN, nama_siswa as NAMA_SISWA, nilai as NILAI, catatan as CATATAN FROM nilai WHERE 1=1";
          const params: any[] = [];
          if (data?.kelas) { query += " AND LOWER(kelas) = LOWER(?)"; params.push(data.kelas); }
          if (data?.mapel) { query += " AND LOWER(mapel) = LOWER(?)"; params.push(data.mapel); }
          query += " ORDER BY id DESC LIMIT 500";
          const res = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify({ success: true, data: res.results }), { headers: corsHeaders });
        }

        if (action === "createNilaiBatch") {
          const items = (data?.items || []) as any[];
          const stmts = items.map(n =>
            env.DB.prepare(
              "INSERT INTO nilai (tanggal, guru, mapel, kelas, jenis_penilaian, nama_penilaian, nama_siswa, nilai, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(
              n.TANGGAL || "", n.GURU, n.MAPEL, n.KELAS, n.JENIS_PENILAIAN, n.NAMA_PENILAIAN, n.NAMA_SISWA, Number(n.NILAI) || 0, n.CATATAN || ""
            )
          );
          await env.DB.batch(stmts);

          if (env.GAS_WEBAPP_URL) {
            ctx.waitUntil(forwardBackupToGoogleSheets(env.GAS_WEBAPP_URL, "createNilaiBatch", { items }));
          }

          return new Response(JSON.stringify({ success: true, message: \`Berhasil menyimpan \${items.length} nilai ke D1\`, data: { total: items.length } }), { headers: corsHeaders });
        }

        // === JURNAL ===
        if (action === "getJurnal") {
          const res = await env.DB.prepare("SELECT id as _rowIndex, timestamp as TIMESTAMP, tanggal as TANGGAL, jam as JAM, guru as GURU, mapel as MAPEL, kelas as KELAS, materi as MATERI, tujuan_pembelajaran as TUJUAN_PEMBELAJARAN, aktivitas as AKTIVITAS, metode as METODE, media as MEDIA, refleksi as REFLEKSI, catatan as CATATAN, status as STATUS FROM jurnal ORDER BY id DESC LIMIT 500").all();
          return new Response(JSON.stringify({ success: true, data: res.results }), { headers: corsHeaders });
        }

        if (action === "createJurnal") {
          await env.DB.prepare(
            "INSERT INTO jurnal (tanggal, jam, guru, mapel, kelas, materi, tujuan_pembelajaran, aktivitas, metode, media, refleksi, catatan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            data.TANGGAL, data.JAM, data.GURU, data.MAPEL, data.KELAS, data.MATERI, data.TUJUAN_PEMBELAJARAN || "", data.AKTIVITAS || "", data.METODE || "", data.MEDIA || "", data.REFLEKSI || "", data.CATATAN || "", data.STATUS
          ).run();

          if (env.GAS_WEBAPP_URL) {
            ctx.waitUntil(forwardBackupToGoogleSheets(env.GAS_WEBAPP_URL, "createJurnal", data));
          }

          return new Response(JSON.stringify({ success: true, message: "Jurnal berhasil disimpan di D1" }), { headers: corsHeaders });
        }

        // === FULL BACKUP TRIGGER: D1 -> GOOGLE SHEETS ===
        if (action === "triggerFullSyncToSheets") {
          const gasUrl = data?.gasUrl || env.GAS_WEBAPP_URL;
          if (!gasUrl) {
            return new Response(JSON.stringify({ success: false, message: "URL Google Apps Script tidak ditentukan." }), { headers: corsHeaders });
          }

          // Ambil seluruh data dari D1
          const [presensi, nilai, jurnal, adminList, guru, siswa, kelas, mapel] = await Promise.all([
            env.DB.prepare("SELECT timestamp as TIMESTAMP, tanggal as TANGGAL, guru as GURU, mapel as MAPEL, kelas as KELAS, pertemuan as PERTEMUAN, nama_siswa as NAMA_SISWA, status as STATUS, catatan as CATATAN FROM presensi").all(),
            env.DB.prepare("SELECT timestamp as TIMESTAMP, tanggal as TANGGAL, guru as GURU, mapel as MAPEL, kelas as KELAS, jenis_penilaian as JENIS_PENILAIAN, nama_penilaian as NAMA_PENILAIAN, nama_siswa as NAMA_SISWA, nilai as NILAI, catatan as CATATAN FROM nilai").all(),
            env.DB.prepare("SELECT timestamp as TIMESTAMP, tanggal as TANGGAL, jam as JAM, guru as GURU, mapel as MAPEL, kelas as KELAS, materi as MATERI, tujuan_pembelajaran as TUJUAN_PEMBELAJARAN, aktivitas as AKTIVITAS, metode as METODE, media as MEDIA, refleksi as REFLEKSI, catatan as CATATAN, status as STATUS FROM jurnal").all(),
            env.DB.prepare("SELECT id_admin as ID_ADMIN, username as USERNAME, nama_lengkap as NAMA_LENGKAP, password as PASSWORD, email as EMAIL, role as ROLE, status as STATUS, created_at as CREATED_AT FROM admin").all(),
            env.DB.prepare("SELECT id_guru as ID_GURU, nama_guru as NAMA_GURU, username as USERNAME, password as PASSWORD, mapel as MAPEL FROM guru").all(),
            env.DB.prepare("SELECT nisn as NISN, nama as NAMA, kelas as KELAS, jenis_kelamin as JENIS_KELAMIN FROM siswa").all(),
            env.DB.prepare("SELECT id_kelas as ID_KELAS, nama_kelas as NAMA_KELAS, wali_kelas as WALI_KELAS FROM kelas").all(),
            env.DB.prepare("SELECT id_mapel as ID_MAPEL, nama_mapel as NAMA_MATA_PELAJARAN FROM mapel").all()
          ]);

          const payload = {
            action: "batchSyncFromD1",
            data: {
              presensi: presensi.results,
              nilai: nilai.results,
              jurnal: jurnal.results,
              admin: adminList.results,
              guru: guru.results,
              siswa: siswa.results,
              kelas: kelas.results,
              mapel: mapel.results,
              syncedAt: new Date().toISOString()
            }
          };

          const gasRes = await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const gasJson: any = await gasRes.json().catch(() => ({ success: false, message: "Non-JSON response from GAS" }));

          return new Response(
            JSON.stringify({
              success: gasJson.success || false,
              message: gasJson.message || "Sinkronisasi selesai",
              counts: {
                presensi: presensi.results.length,
                nilai: nilai.results.length,
                jurnal: jurnal.results.length,
                admin: adminList.results.length,
                master: guru.results.length + siswa.results.length + kelas.results.length + mapel.results.length
              }
            }),
            { headers: corsHeaders }
          );
        }
      }

      return new Response(JSON.stringify({ success: false, message: "Action atau rute tidak ditemukan" }), {
        status: 404,
        headers: corsHeaders
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, message: "D1 Worker Error: " + (err.message || err) }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // Cron Trigger Otomatis (misal: setiap jam atau tiap malam)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (env.GAS_WEBAPP_URL) {
      ctx.waitUntil(
        fetch(env.GAS_WEBAPP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cronHeartbeat", timestamp: new Date().toISOString() })
        })
      );
    }
  }
};

async function forwardBackupToGoogleSheets(gasUrl: string, action: string, data: any) {
  try {
    await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data, source: "Cloudflare_D1_AutoForward" })
    });
  } catch (e) {
    console.error("Failed to forward backup to Google Sheets:", e);
  }
}
`;

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BACKUP & REPLIKA OTOMATIS DATA SEKOLAH (v2.4.0)
 * =========================================================================
 * Panduan Pemasangan:
 * 1. Buka Google Spreadsheet target backup (atau buat baru di sheets.new).
 * 2. Klik Extensions (Ekstensi) -> Apps Script.
 * 3. Hapus seluruh isi Code.gs dan tempel seluruh kode di bawah ini.
 * 4. Klik Deploy -> New Deployment -> Select Type: Web App:
 *    - Description: Backup v2.4.0
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 5. Klik Deploy -> Berikan izin akun Google (Authorize access -> Allow).
 * 6. Salin Web App URL (berakhiran /exec) ke kolom konfigurasi di web ini.
 * =========================================================================
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000); // Mencegah bentrok data transaksi bersamaan

    var rawData = e.postData ? e.postData.contents : "{}";
    var request = JSON.parse(rawData);
    var action = request.action || "batchSyncFromD1";
    var data = request.data || request.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. SINKRONISASI BATCH / DUMP LENGKAP DARI CLOUDFLARE D1
    if (action === "batchSyncFromD1" || action === "sync_batch" || action === "full_backup" || action === "createPresensiBatch" || action === "createNilaiBatch") {
      var countPresensi = 0;
      var countNilai = 0;
      var countJurnal = 0;
      var countAdmin = 0;

      // Backup Admin
      var adminItems = data.admin;
      if (adminItems && Array.isArray(adminItems) && adminItems.length > 0) {
        var sheetAdm = getOrCreateSheet(ss, "Admin", [
          "ID_ADMIN", "USERNAME", "NAMA_LENGKAP", "PASSWORD", "EMAIL", "ROLE", "STATUS", "CREATED_AT"
        ]);
        countAdmin = syncTableData(sheetAdm, adminItems, [
          "id_admin", "username", "nama_lengkap", "password", "email", "role", "status", "created_at"
        ]);
      }

      // Backup Presensi
      var presensiItems = data.presensi || (action === "createPresensiBatch" ? data.items : null);
      if (presensiItems && Array.isArray(presensiItems) && presensiItems.length > 0) {
        var sheetP = getOrCreateSheet(ss, "Presensi", [
          "TIMESTAMP", "TANGGAL", "GURU", "MAPEL", "KELAS", "PERTEMUAN", "NAMA_SISWA", "STATUS", "CATATAN"
        ]);
        countPresensi = syncTableData(sheetP, presensiItems, [
          "timestamp", "tanggal", "guru", "mapel", "kelas", "pertemuan", "nama_siswa", "status", "catatan"
        ]);
      }

      // Backup Nilai
      var nilaiItems = data.nilai || (action === "createNilaiBatch" ? data.items : null);
      if (nilaiItems && Array.isArray(nilaiItems) && nilaiItems.length > 0) {
        var sheetN = getOrCreateSheet(ss, "Nilai", [
          "TIMESTAMP", "TANGGAL", "GURU", "MAPEL", "KELAS", "JENIS_PENILAIAN", "NAMA_PENILAIAN", "NAMA_SISWA", "NILAI", "CATATAN"
        ]);
        countNilai = syncTableData(sheetN, nilaiItems, [
          "timestamp", "tanggal", "guru", "mapel", "kelas", "jenis_penilaian", "nama_penilaian", "nama_siswa", "nilai", "catatan"
        ]);
      }

      // Backup Jurnal
      var jurnalItems = data.jurnal || (action === "createJurnal" ? [data] : null);
      if (jurnalItems && Array.isArray(jurnalItems) && jurnalItems.length > 0) {
        var sheetJ = getOrCreateSheet(ss, "Jurnal", [
          "TIMESTAMP", "TANGGAL", "JAM", "GURU", "MAPEL", "KELAS", "MATERI", "TUJUAN_PEMBELAJARAN", "AKTIVITAS", "METODE", "STATUS", "CATATAN"
        ]);
        countJurnal = syncTableData(sheetJ, jurnalItems, [
          "timestamp", "tanggal", "jam", "guru", "mapel", "kelas", "materi", "tujuan_pembelajaran", "aktivitas", "metode", "status", "catatan"
        ]);
      }

      // Backup Master Guru, Siswa, Kelas, Mapel (jika dikirim)
      if (data.guru && Array.isArray(data.guru)) {
        var sheetG = getOrCreateSheet(ss, "Guru", ["ID_GURU", "NAMA_GURU", "USERNAME", "PASSWORD", "MAPEL"]);
        syncTableData(sheetG, data.guru, ["id_guru", "nama_guru", "username", "password", "mapel"]);
      }
      if (data.siswa && Array.isArray(data.siswa)) {
        var sheetS = getOrCreateSheet(ss, "Siswa", ["NISN", "NAMA", "KELAS", "JENIS_KELAMIN"]);
        syncTableData(sheetS, data.siswa, ["nisn", "nama", "kelas", "jenis_kelamin"]);
      }
      if (data.kelas && Array.isArray(data.kelas)) {
        var sheetK = getOrCreateSheet(ss, "Kelas", ["ID_KELAS", "NAMA_KELAS", "WALI_KELAS"]);
        syncTableData(sheetK, data.kelas, ["id_kelas", "nama_kelas", "wali_kelas"]);
      }
      if (data.mapel && Array.isArray(data.mapel)) {
        var sheetM = getOrCreateSheet(ss, "Mapel", ["ID_MAPEL", "NAMA_MATA_PELAJARAN"]);
        syncTableData(sheetM, data.mapel, ["id_mapel", "nama_mapel"]);
      }

      // Catat Log Riwayat Sinkronisasi
      var logSheet = getOrCreateSheet(ss, "Sync_Logs", ["TIMESTAMP", "AKSI", "STATUS", "RINCIAN"]);
      logSheet.appendRow([
        new Date().toISOString(),
        action,
        "SUKSES",
        "Admin: " + countAdmin + ", Presensi: " + countPresensi + ", Nilai: " + countNilai + ", Jurnal: " + countJurnal
      ]);

      lock.releaseLock();
      return createJsonResponse({
        success: true,
        message: "Berhasil mencadangkan seluruh data ke Google Spreadsheet!",
        counts: { admin: countAdmin, presensi: countPresensi, nilai: countNilai, jurnal: countJurnal }
      });
    }

    // 2. HEALTH CHECK / PING / TEST KONEKSI
    if (action === "ping" || action === "health") {
      lock.releaseLock();
      return createJsonResponse({
        success: true,
        message: "Google Apps Script Backup WebApp Aktif (v2.4.0)",
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    lock.releaseLock();
    return createJsonResponse({ success: true, message: "Aksi diterima: " + action });

  } catch (err) {
    return createJsonResponse({ success: false, message: "GAS Error: " + err.toString() });
  }
}

function doGet(e) {
  return createJsonResponse({
    success: true,
    message: "Google Apps Script Backup Endpoint Online (v2.4.0)",
    timestamp: new Date().toISOString()
  });
}

// === Helper Functions ===

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e8f0fe");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function syncTableData(sheet, items, keys) {
  if (!items || items.length === 0) return 0;
  
  // Bersihkan data lama di bawah header agar sinkron bersih
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  var rows = items.map(function(item) {
    return keys.map(function(k) {
      var val = item[k];
      if (val === undefined) {
        val = item[k.toUpperCase()];
      }
      return val !== undefined && val !== null ? val : "";
    });
  });

  sheet.getRange(2, 1, rows.length, keys.length).setValues(rows);
  return rows.length;
}

function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;

