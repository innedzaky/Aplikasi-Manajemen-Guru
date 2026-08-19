# Panduan Lengkap Deployment Produksi & Operasional
## Aplikasi Sistem Manajemen Guru (Presensi, Penilaian, & Jurnal KBM)

---

## 1. Production Checklist (Daftar Periksa Pra-Peluncuran)

Pastikan seluruh item berikut telah diverifikasi sebelum merilis aplikasi ke lingkungan produksi:

- [x] **Keamanan & Kredensial**: Tidak ada password, private API key, atau token rahasia yang di-commit ke repository Git.
- [x] **Validasi URL Backend**: Endpoint Google Apps Script menggunakan protokol HTTPS dan domain resmi `https://script.google.com/macros/s/.../exec`.
- [x] **Role-Based Access Control (RBAC)**: Master Data Guru dan penambahan akun hanya dapat diakses oleh Administrator.
- [x] **Sanitasi Input & Proteksi Formula Injection**: Seluruh input teks disanitasi dan sel ekspor CSV/Excel dilindungi dari injeksi formula spreadsheet.
- [x] **Single Page Application (SPA) Routing**: File konfigurasi redirect/rewrite (`netlify.toml` dan `vercel.json`) telah terpasang agar halaman tidak 404 saat di-refresh.
- [x] **Responsivitas Multi-Device**: Teruji optimal pada Smartphone (<640px), Tablet (640-1024px), Laptop, dan Desktop.
- [x] **Lint & Build Clean**: `npm run lint` dan `npm run build` berjalan sukses tanpa error TypeScript.

---

## 2. Google Spreadsheet Setup

Sistem menggunakan 1 Google Spreadsheet sebagai database cloud serverless. Ikuti langkah berikut untuk menyiapkannya:

### Langkah Pembuatan Spreadsheet:
1. Buka [Google Sheets](https://sheets.new) di browser Anda dengan akun Google institusi/sekolah.
2. Beri nama Spreadsheet, misalnya: `DB_SISTEM_MANAJEMEN_GURU`.
3. Buat 7 Sheet (Tab) dengan nama persis sesuai tabel berikut:

### Struktur Tabel & Kolom (Baris 1 sebagai Header):

#### 1. Sheet: `Guru`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E |
|---|---|---|---|---|
| `ID_GURU` | `NAMA_GURU` | `USERNAME` | `PASSWORD` | `MAPEL` |
*Contoh Data Baris 2:* `G001` | `Budi Santoso, S.Pd.` | `budi` | `password123` | `Matematika`

#### 2. Sheet: `Siswa`
| Kolom A | Kolom B | Kolom C | Kolom D |
|---|---|---|---|
| `NISN` | `NAMA` | `KELAS` | `JENIS_KELAMIN` |
*Contoh Data Baris 2:* `0081234501` | `Aditya Pratama` | `X TKJ 1` | `L`

#### 3. Sheet: `Kelas`
| Kolom A | Kolom B | Kolom C |
|---|---|---|
| `ID_KELAS` | `NAMA_KELAS` | `WALI_KELAS` |
*Contoh Data Baris 2:* `K001` | `X TKJ 1` | `Budi Santoso, S.Pd.`

#### 4. Sheet: `Mapel`
| Kolom A | Kolom B |
|---|---|
| `ID_MAPEL` | `NAMA_MATA_PELAJARAN` |
*Contoh Data Baris 2:* `M001` | `Matematika`

#### 5. Sheet: `Presensi`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H | Kolom I |
|---|---|---|---|---|---|---|---|---|
| `TIMESTAMP` | `TANGGAL` | `GURU` | `MAPEL` | `KELAS` | `PERTEMUAN` | `NAMA_SISWA` | `STATUS` | `CATATAN` |

#### 6. Sheet: `Nilai`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H |
|---|---|---|---|---|---|---|---|
| `TIMESTAMP` | `GURU` | `MAPEL` | `KELAS` | `JENIS_PENILAIAN` | `NAMA_PENILAIAN` | `NAMA_SISWA` | `NILAI` |

#### 7. Sheet: `Jurnal`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H | Kolom I | Kolom J | Kolom K | Kolom L | Kolom M | Kolom N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `TIMESTAMP` | `TANGGAL` | `JAM` | `GURU` | `MAPEL` | `KELAS` | `MATERI` | `TUJUAN_PEMBELAJARAN` | `AKTIVITAS` | `METODE` | `MEDIA` | `REFLEKSI` | `CATATAN` | `STATUS` |

---

## 3. Google Apps Script Setup & Deployment

1. Pada Google Spreadsheet yang telah dibuat, klik menu **Extensions (Ekstensi)** > **Apps Script**.
2. Buat file-file script `.gs` di editor Apps Script sesuai dengan kode yang ada di folder `/backend`:
   - `Code.gs` (Entry point `doGet` dan `doPost`)
   - `Config.gs` (Konfigurasi & Konstanta)
   - `Router.gs` (Dispatcher API)
   - `Auth.gs` (Otentikasi & Verifikasi Token)
   - `Spreadsheet.gs` (Data Access Layer)
   - `Validation.gs` (Validasi Payload)
   - `Utils.gs` (Helper & Sanitasi)
   - `Seeder.gs` (Inisialisasi Data Demo)
   - File service di dalam folder `services/` (`PresensiService.gs`, `NilaiService.gs`, `JurnalService.gs`, `MasterService.gs`, `DashboardService.gs`).
3. Jalankan fungsi `setupInitialDatabase()` atau `seedAllData()` di file `Seeder.gs` satu kali untuk menguji koneksi dan mengisi data master awal jika diperlukan.

---

## 4. Web App Configuration (PENTING)

Untuk mempublikasikan backend sebagai REST API publik:

1. Di editor Apps Script, klik tombol biru **Deploy (Terapkan)** di pojok kanan atas > pilih **New deployment (Penerapan baru)**.
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Isi konfigurasi deployment dengan benar:
   - **Description**: `Sistem Manajemen Guru Backend v1.0`
   - **Execute as (Jalankan sebagai)**: **`Me (email_anda@gmail.com)`** *(Wajib agar script memiliki izin menulis ke spreadsheet)*
   - **Who has access (Siapa yang memiliki akses)**: **`Anyone (Siapa saja)`** *(Wajib agar frontend web dapat mengirim request tanpa auth browser Google)*
4. Klik **Deploy (Terapkan)**.
5. Berikan otorisasi izin akses (*Authorize access*) saat popup Google muncul:
   - Pilih akun Google Anda.
   - Klik *Advanced (Lanjutan)* > klik *Go to (unsafe) / Buka project*.
   - Klik *Allow (Izinkan)*.
6. Salin **Web app URL** yang berakhiran `/exec`.
   - *Format contoh*: `https://script.google.com/macros/s/AKfycbx.../exec`

---

## 5. Frontend Configuration & Setup

Aplikasi React dibangun dengan Vite dan Tailwind CSS.

### Opsi A: Konfigurasi Runtime via UI Modal Pengaturan (Rekomendasi)
Pengguna atau Admin dapat langsung memasukkan URL Web App melalui tombol **Pengaturan (Ikon Gerigi)** di pojok kanan atas aplikasi:
1. Buka aplikasi di browser.
2. Klik ikon **Pengaturan**.
3. Pilih **Mode Operasi: Live (Google Spreadsheet)**.
4. Masukkan URL Web App Google Apps Script (`https://script.google.com/macros/s/.../exec`).
5. Klik **Simpan Pengaturan**. Sistem akan otomatis terhubung ke Google Sheets.

### Opsi B: Konfigurasi Build-Time via Environment Variables
Salin `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi variabel dengan URL Web App Anda:
```env
VITE_GAS_URL="https://script.google.com/macros/s/AKfycbx.../exec"
VITE_APP_MODE="live"
VITE_SCHOOL_NAME="SMA NEGERI CONTOH"
```
Jalankan build produksi:
```bash
npm run build
```
File siap di-deploy akan berada di folder `dist/`.

---

## 6. Deployment ke Platform Hosting

### A. Vercel (Rekomendasi Utama)
1. Push repository ke GitHub/GitLab.
2. Buka [Vercel Dashboard](https://vercel.com) > klik **Add New Project**.
3. Import repository project ini.
4. Pengaturan Build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. (Opsional) Tambahkan Environment Variables di menu *Settings > Environment Variables*:
   - `VITE_GAS_URL`: URL Web App Anda.
   - `VITE_APP_MODE`: `live`
6. File `vercel.json` yang disertakan akan otomatis menangani SPA routing.
7. Klik **Deploy**.

---

### B. Netlify
1. Buka [Netlify Dashboard](https://app.netlify.com) > klik **Add new site** > **Import an existing project**.
2. Pilih repository GitHub.
3. Pengaturan Build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. File `netlify.toml` yang disertakan akan otomatis mengatur HTTP header keamanan dan rewrite SPA.
5. Klik **Deploy Site**.

---

### C. GitHub Pages (via GitHub Actions)
1. Buka repository di GitHub > tab **Settings** > **Pages**.
2. Di bagian **Build and deployment > Source**, pilih **GitHub Actions**.
3. File `.github/workflows/deploy.yml` yang disertakan di repository akan otomatis melakukan build dan deployment setiap kali Anda melakukan push ke branch `main`.

---

## 7. Prosedur Pencadangan (Backup Procedure)

### 1. Pencadangan Otomatis Google Sheets (Version History)
- Google Spreadsheet secara otomatis mencatat riwayat revisi data secara real-time.
- Untuk memulihkan data sebelumnya: Buka Spreadsheet > **File** > **Version history** > **See version history**.

### 2. Pencadangan Terjadwal via Apps Script Trigger (Opsional)
Anda dapat menambahkan fungsi pencadangan otomatis harian pada Apps Script:
```javascript
function autoBackupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var backupFolder = DriveApp.getFoldersByName("Backup_Sistem_Guru").next();
  var dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd_HHmm");
  DriveApp.getFileById(ss.getId()).makeCopy("Backup_" + ss.getName() + "_" + dateStr, backupFolder);
}
```
Pasang trigger waktu (Time-driven trigger) setiap hari pukul 00.00 di menu **Triggers (Pemicu)** pada Apps Script.

### 3. Pencadangan Manual
Admin atau Guru dapat mengunduh seluruh rekap data presensi, nilai, dan jurnal mengajar kapan saja melalui menu **Laporan & Rekap** dalam format **Excel (.xlsx)** atau **CSV**.

---

## 8. Panduan Pemecahan Masalah (Troubleshooting)

| Gejala Masalah | Penyebab Umum | Solusi |
|---|---|---|
| **Pesan "Failed to fetch" atau CORS Error** | Konfigurasi Web App belum disetel ke "Anyone" atau URL tidak diakhiri `/exec`. | Buka Apps Script > *Deploy* > *Manage deployments* > Edit > Pastikan *Who has access* = **Anyone**. Pastikan URL menggunakan `/exec`, bukan `/dev`. |
| **Error 403 Forbidden / Authorization Required** | Izin otorisasi akun Google belum diberikan saat deploy. | Lakukan redeploy Web App sebagai versi baru (*New version*) dan pastikan menyelesaikan dialog otorisasi Google. |
| **Halaman 404 saat di-refresh di Vercel/Netlify** | Server hosting tidak mengarahkan request SPA ke `index.html`. | Pastikan file `vercel.json` (untuk Vercel) atau `netlify.toml` (untuk Netlify) berada di root repository. |
| **Data tidak tersimpan di Google Sheets** | Kolom header di sheet tidak cocok atau sheet belum dibuat. | Cocokkan nama sheet dan nama kolom pada Baris 1 persis dengan spesifikasi di bagian 2 panduan ini. |
| **Peringatan "Exceeded maximum execution time"** | Kuota waktu eksekusi skrip Google (6 menit/eksekusi) terlampaui saat memproses ribuan data. | Lakukan filter data per kelas/semester sebelum mengekspor laporan dalam jumlah besar. |
