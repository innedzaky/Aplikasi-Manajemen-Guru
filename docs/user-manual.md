# Panduan Pengguna (User Manual)
## Sistem Manajemen Guru — Presensi, Penilaian, & Jurnal KBM

---

## 1. Pendahuluan

Sistem Manajemen Guru adalah aplikasi web modern yang dirancang untuk mempermudah guru dan pihak sekolah dalam mengelola kegiatan belajar mengajar (KBM) harian, mulai dari pencatatan presensi siswa, penilaian akademik, dokumentasi agenda mengajar (jurnal KBM), hingga rekapitulasi laporan dalam format cetak (PDF) dan spreadsheet (Excel/CSV).

---

## 2. Peran Pengguna (User Roles)

Aplikasi memiliki 2 tingkatan hak akses:

1. **Administrator (Admin Sekolah)**:
   - Akses penuh ke seluruh menu dan modul.
   - Mengelola Master Data Guru (tambah akun guru baru, edit, hapus, reset password).
   - Mengelola Master Data Siswa, Kelas, dan Mata Pelajaran.
   - Memantau rekap data dan analitik seluruh guru di sekolah.

2. **Guru Pengajar**:
   - Mencatat presensi harian siswa pada kelas & mapel yang diampu.
   - Menginput nilai tugas, ulangan harian, PTS, PAS, dan praktik.
   - Mengisi jurnal agenda mengajar harian (materi, refleksi, metode, media).
   - Melihat dashboard ringkasan pribadi dan mengunduh laporan nilai/kehadiran.

---

## 3. Cara Masuk ke Aplikasi (Login)

1. Buka alamat URL aplikasi di browser komputer atau smartphone.
2. Masukkan **Username** dan **Password**.
   - *Akun Admin*: `admin` / `admin123`
   - *Akun Guru Contoh*: `budi` / `password123`
3. Klik tombol **Masuk ke Sistem**.
4. Jika login berhasil, Anda akan diarahkan ke halaman **Dashboard Utama**.

---

## 4. Panduan Modul Presensi Siswa

### A. Melakukan Presensi Harian:
1. Klik menu **Presensi Siswa** di navigasi samping atau bottom bar.
2. Pada panel atas, tentukan filter:
   - **Tanggal Pertemuan**: (Otomatis terisi hari ini, dapat disesuaikan).
   - **Pertemuan Ke-**: Masukkan nomor pertemuan (misal: `1`).
   - **Kelas**: Pilih kelas yang diajar (misal: `X TKJ 1`).
   - **Mata Pelajaran**: Pilih mata pelajaran (misal: `Matematika`).
3. Daftar seluruh siswa di kelas tersebut akan otomatis ditampilkan.
4. Gunakan tombol cepat jika mayoritas siswa hadir:
   - Klik **Semua Hadir (H)** untuk menandai semua siswa hadir secara instan.
5. Ubah status siswa yang tidak hadir dengan mengklik chip status:
   - **H**: Hadir (Hijau)
   - **S**: Sakit (Kuning)
   - **I**: Izin (Biru)
   - **A**: Alpa/Tanpa Keterangan (Merah)
6. Tambahkan catatan opsional jika diperlukan (misal: "Izin lomba OSN").
7. Klik tombol biru **Simpan Presensi Kelas**.

### B. Melihat & Mengedit Riwayat Presensi:
1. Buka tab **Riwayat Presensi**.
2. Gunakan kolom pencarian atau filter tanggal/kelas untuk menemukan riwayat.
3. Klik ikon **Pensil (Edit)** untuk mengubah status presensi atau ikon **Tempat Sampah** untuk menghapus.

---

## 5. Panduan Modul Penilaian Siswa

### A. Input Nilai Kelas:
1. Buka menu **Penilaian Siswa**.
2. Pilih tab **Input Nilai**.
3. Atur konfigurasi penilaian di header:
   - **Kelas**: Pilih kelas target.
   - **Mata Pelajaran**: Pilih mata pelajaran.
   - **Jenis Penilaian**: Pilih jenis (Tugas, Ulangan Harian, PTS, PAS, Praktik, Proyek).
   - **Nama Penilaian**: Masukkan nama/topik (contoh: `UH 1 - Eksponen`).
   - **Batas KKM**: Nilai KKM standar (contoh: `75`).
4. Masukkan nilai angka ($0 - 100$) pada masing-masing baris siswa.
   - Sistem akan otomatis menghitung **Predikat (A, B, C, D)** dan status **Tuntas / Belum Tuntas**.
5. Klik tombol **Simpan Penilaian**.

### B. Analitik & Statistik Nilai:
Pada tab **Riwayat Nilai**, Anda dapat melihat ringkasan statistik otomatis meliputi:
- Nilai Rata-rata Kelas.
- Nilai Tertinggi & Terendah.
- Jumlah Siswa Tuntas vs Belum Tuntas.
- Tombol **Ekspor Data** untuk mengunduh rekap nilai ke Excel atau PDF.

---

## 6. Panduan Modul Jurnal Mengajar (Agenda Guru)

1. Buka menu **Jurnal Mengajar**.
2. Klik tombol **+ Buat Jurnal Baru** atau isi form input KBM:
   - **Tanggal & Jam Pelajaran**: Waktu KBM berlangsung.
   - **Materi Pokok**: Topik/kompetensi dasar yang diajarkan.
   - **Tujuan Pembelajaran**: Target capaian siswa.
   - **Aktivitas Pembelajaran**: Ringkasan kegiatan kelas (pembuka, inti, penutup).
   - **Metode & Media**: Model pembelajaran (PBL, Diskusi, dll) dan alat peraga.
   - **Status Pelaksanaan**: *Terlaksana*, *Sebagian*, atau *Tidak Terlaksana*.
   - **Refleksi / Catatan Kendala**: Evaluasi jalannya KBM.
3. Klik **Simpan Jurnal Mengajar**.
4. Riwayat jurnal dapat dilihat dalam bentuk kartu linimasa (timeline) atau tabel daftar yang dapat dicetak sebagai bukti administrasi KBM guru.

---

## 7. Panduan Master Data (Khusus Administrator)

1. Klik menu **Master Data** (Guru, Siswa, Kelas, Mapel).
2. **Tambah Data Baru**: Klik tombol `+ Tambah`, isi formulir modal, lalu klik Simpan.
3. **Pencarian & Filter**: Ketik kata kunci pada kotak pencarian untuk menemukan data dengan cepat.
4. **Edit / Hapus**: Klik tombol aksi pada baris tabel yang bersangkutan.

---

## 8. Panduan Ekspor Laporan (PDF, Excel, CSV)

1. Buka menu **Laporan & Rekap**.
2. Pilih jenis laporan:
   - *Laporan Rekap Presensi*
   - *Laporan Daftar Nilai Siswa*
   - *Laporan Jurnal KBM Guru*
3. Tentukan rentang tanggal dan kelas target.
4. Klik tombol **Ekspor PDF** (lengkap dengan kop sekolah dan lembar tanda tangan) atau **Ekspor Excel (.xlsx)** untuk analisis spreadsheet lebih lanjut.

---

## 9. Pengaturan Mode Operasi (Demo vs Live)

- **Mode Demo (Offline)**: Menggunakan data mock lokal di memori browser. Sangat cocok untuk simulasi, uji coba fitur, atau pelatihan tanpa internet.
- **Mode Live (Google Spreadsheet)**: Menghubungkan aplikasi langsung ke database Google Sheets sekolah secara real-time. Dikonfigurasi melalui ikon **Pengaturan** di bilah navigasi atas.
