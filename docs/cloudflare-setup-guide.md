# Panduan & Skrip Deployment Siap Pakai: Cloudflare D1 Database, Worker API, & Pages
## Aplikasi Sistem Manajemen Guru (Presensi, Penilaian, & Jurnal Mengajar)

Dokumen ini adalah panduan lengkap dan skrip siap pakai untuk melakukan setup dan deployment penuh infrastruktur cloud di **Cloudflare** dari awal:
1. **Cloudflare D1 Database** (Distributed SQL Database berbasis SQLite di Edge)
2. **Cloudflare Worker API** (Serverless REST API Engine & Authentication)
3. **Cloudflare Pages** (Hosting Frontend React Vite dengan CDN Global)

---

## ⚡ Cara Cepat: Otomasi Deployment 1-Perintah

Anda dapat menjalankan skrip otomasi bash yang telah disediakan di dalam repository untuk melakukan seluruh tahapan secara otomatis:

```bash
# Berikan izin eksekusi skrip (jika diperlukan)
chmod +x scripts/setup-cloudflare.sh scripts/quick-setup-d1.sh

# Jalankan skrip setup lengkap (D1 Database + Migrasi + Deploy Worker + Deploy Pages)
npm run cf:setup
```

*Skrip di atas akan otomatis:*
1. Menguji koneksi akun Wrangler Cloudflare.
2. Membuat database Cloudflare D1 bernama `db_sistem_manajemen_guru`.
3. Menghubungkan ID database ke file `worker/wrangler.toml`.
4. Mengeksekusi seluruh migrasi tabel (19 tabel), indeks, dan data master.
5. Mempublikasikan Worker API (`api-sekolah-d1.workers.dev`).
6. Membangun aset web client (`dist/`) dan menerbitkannya ke Cloudflare Pages (`sistem-manajemen-guru.pages.dev`).

---

## 📖 Panduan Manual Langkah demi Langkah (Step-by-Step)

Jika Anda ingin melakukan setup langkah demi langkah atau menyesuaikan nama resource secara manual, ikuti tahapan berikut:

### Langkah 1: Login ke Cloudflare via Wrangler CLI

Pastikan Anda sudah memiliki akun di [Cloudflare Dashboard](https://dash.cloudflare.com) dan jalankan perintah login di terminal:

```bash
npx wrangler login
```
*Browser akan terbuka untuk meminta otorisasi login akun Cloudflare Anda.*

---

### Langkah 2: Buat Database Cloudflare D1 Baru

Pindah ke direktori worker dan buat database D1 baru:

```bash
cd worker
npx wrangler d1 create db_sistem_manajemen_guru
```

*Contoh output terminal yang dihasilkan:*
```text
✅ Successfully created DB 'db_sistem_manajemen_guru'!

[[d1_databases]]
binding = "DB"
database_name = "db_sistem_manajemen_guru"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

> **PENTING:** Salin `database_id` yang dihasilkan untuk dimasukkan ke `worker/wrangler.toml`.

---

### Langkah 3: Konfigurasi `worker/wrangler.toml`

Buka file `worker/wrangler.toml` dan pastikan konfigurasi binding database sudah aktif dan memiliki `database_id` yang sesuai:

```toml
name = "api-sekolah-d1"
main = "src/index.ts"
compatibility_date = "2024-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "*"

[[d1_databases]]
binding = "DB"
database_name = "db_sistem_manajemen_guru"
database_id = "MASUKKAN_DATABASE_ID_DARI_LANGKAH_2"
migrations_dir = "migrations"

[observability]
enabled = true

[triggers]
crons = ["*/15 * * * *"]
```

---

### Langkah 4: Terapkan Migrasi Skema, Indeks, & Data Master

Jalankan perintah migrasi skema SQL ke database remote Cloudflare D1:

```bash
# Mengaplikasikan migrasi tabel
npx wrangler d1 migrations apply db_sistem_manajemen_guru --remote
```

Atau jalankan file migrasi secara berurutan:

```bash
# 1. Buat 19 Tabel Utama
npx wrangler d1 execute db_sistem_manajemen_guru --remote --file=./migrations/0001_initial_schema.sql

# 2. Buat Indeks Performa & Tenant Scoping
npx wrangler d1 execute db_sistem_manajemen_guru --remote --file=./migrations/0002_indexes.sql

# 3. Masukkan Data Seed Awal (Akun Pengguna, Guru, Kelas, Siswa, Mapel)
npx wrangler d1 execute db_sistem_manajemen_guru --remote --file=./migrations/0003_seed.sql
```

---

### Langkah 5: Deploy Cloudflare Worker API

Lakukan deployment worker ke jaringan global Cloudflare:

```bash
npx wrangler deploy
```

*Worker API Anda akan aktif pada URL:* `https://<nama-worker>.<subdomain>.workers.dev` (contoh: `https://api-sekolah-d1.dzakyinne.workers.dev`).

#### Uji Healthcheck API:
Buka di browser atau jalankan curl:
```bash
curl https://api-sekolah-d1.dzakyinne.workers.dev/api/health
```
*Respon yang diharapkan:*
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production",
  "timestamp": "2026-08-21T12:00:00.000Z"
}
```

---

### Langkah 6: Build & Deploy Frontend ke Cloudflare Pages

Kembali ke direktori utama (root) repository:

```bash
cd ..
```

#### Opsi A: Deploy Langsung via CLI (Wrangler Pages)
```bash
# 1. Build aset frontend produksi
npm run build:client

# 2. Deploy folder dist ke Cloudflare Pages
npx wrangler pages deploy dist --project-name=sistem-manajemen-guru --commit-dirty=true
```

#### Opsi B: Hubungkan Otomatis via GitHub Repository (CI/CD)
1. Buka **Cloudflare Dashboard** > **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
2. Pilih repository GitHub Anda (`Aplikasi-Manajemen-Guru`).
3. Konfigurasi build setting:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build:client`
   - **Build output directory**: `dist`
   - **Environment Variables**:
     - `VITE_GAS_URL` = `https://api-sekolah-d1.<subdomain>.workers.dev`
     - `VITE_APP_MODE` = `live`
4. Klik **Save and Deploy**. Setiap push ke branch `main` akan otomatis memicu build dan deploy.

---

## 🔐 Kredensial Akun Default (Hasil Migrasi Seed)

Setelah migrasi selesai, Anda dapat langsung login ke aplikasi menggunakan akun bawaan:

| Role | Username | Password | Keterangan |
|---|---|---|---|
| **Super Admin / Owner** | `owner` | `password123` | Akses penuh seluruh sistem, pengaturan, & master data |
| **Administrator** | `admin` | `password123` | Akses manajemen master guru, kelas, siswa, mapel |
| **Guru (Budi Santoso)** | `budi` | `password123` | Guru Matematika (Kelas X-A, XI-IPA-1) |
| **Guru (Siti Rahmawati)** | `siti` | `password123` | Guru Bahasa Indonesia (Kelas X-A, X-B) |
| **Guru (Ahmad Fauzi)** | `ahmad` | `password123` | Guru Fisika (Kelas XI-IPA-1) |

---

## 🛠️ Ringkasan Perintah NPM (Quick Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run cf:setup` | Menjalankan wizard setup lengkap (D1, Migrasi, Worker, Pages) |
| `npm run cf:setup-d1` | Membuat database D1 & menjalankan migrasi 19 tabel |
| `npm run cf:deploy-worker` | Menerbitkan update kode Worker REST API ke Cloudflare |
| `npm run cf:deploy-pages` | Membangun frontend dan mengunggah ke Cloudflare Pages |
| `npm run dev` | Menjalankan server development lokal (port 3000) |
| `npm run build` | Membangun bundle produksi server & client |

---

## ❓ Troubleshooting & Pertanyaan Umum

1. **Error: `No D1 database found` saat menjalankan migrasi**  
   *Solusi:* Pastikan nama database yang Anda panggil di terminal sama persis dengan yang ada di `wrangler.toml` dan Anda sudah menjalankan `npx wrangler login`.

2. **CORS Error saat akses dari Cloudflare Pages ke Worker**  
   *Solusi:* File `worker/src/utils/response.ts` dan `worker/src/middleware/security.ts` sudah dikonfigurasi dengan `Access-Control-Allow-Origin: *` dan preflight handler `OPTIONS` (204). Pastikan Worker sudah di-deploy ulang (`npm run cf:deploy-worker`).

3. **Routing 404 saat refresh halaman di Cloudflare Pages**  
   *Solusi:* File `/public/_routes.json` dan `public/_redirects` (`/* /index.html 200`) telah disertakan dalam project ini sehingga Cloudflare Pages selalu mengarahkan SPA routing ke `index.html`.
