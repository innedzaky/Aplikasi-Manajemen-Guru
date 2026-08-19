# Dokumentasi Database — Aplikasi Manajemen Guru

Struktur database menggunakan 1 Google Spreadsheet dengan 7 sheets utama:

---

## 1. Sheet: `Guru`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `ID_GURU` | String | Ya | Primary Key (contoh: `G001`) |
| 2 | `NAMA_GURU` | String | Ya | Nama lengkap dan gelar guru |
| 3 | `USERNAME` | String | Ya | Username login |
| 4 | `PASSWORD` | String | Ya | SHA-256 Hashed Password |
| 5 | `MAPEL` | String | Tidak | Mata pelajaran utama yang diampu |

---

## 2. Sheet: `Siswa`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `NISN` | String | Ya | Primary Key (10 digit NISN) |
| 2 | `NAMA` | String | Ya | Nama lengkap siswa |
| 3 | `KELAS` | String | Ya | Nama kelas (contoh: `X TKJ 1`) |
| 4 | `JENIS_KELAMIN` | Enum (`L`/`P`) | Ya | Laki-laki / Perempuan |

---

## 3. Sheet: `Kelas`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `ID_KELAS` | String | Ya | Primary Key (contoh: `K01`) |
| 2 | `NAMA_KELAS` | String | Ya | Nama kelas (contoh: `X TKJ 1`) |
| 3 | `WALI_KELAS` | String | Tidak | Nama wali kelas |

---

## 4. Sheet: `Mapel`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `ID_MAPEL` | String | Ya | Primary Key (contoh: `M01`) |
| 2 | `NAMA_MATA_PELAJARAN` | String | Ya | Nama mata pelajaran |

---

## 5. Sheet: `Presensi`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `TIMESTAMP` | ISO Date String | Auto | Timestamp pencatatan backend |
| 2 | `TANGGAL` | Date (YYYY-MM-DD) | Ya | Tanggal pertemuan presensi |
| 3 | `GURU` | String | Ya | Nama/ID guru pengajar |
| 4 | `MAPEL` | String | Ya | Nama mata pelajaran |
| 5 | `KELAS` | String | Ya | Nama kelas |
| 6 | `PERTEMUAN` | Number | Ya | Pertemuan ke- (1, 2, ...) |
| 7 | `NAMA_SISWA` | String | Ya | Nama siswa |
| 8 | `STATUS` | Enum | Ya | `Hadir`, `Izin`, `Sakit`, `Alpa` |
| 9 | `CATATAN` | String | Tidak | Keterangan tambahan (opsional) |

---

## 6. Sheet: `Nilai`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `TIMESTAMP` | ISO Date String | Auto | Timestamp pencatatan backend |
| 2 | `GURU` | String | Ya | Nama/ID guru pengajar |
| 3 | `MAPEL` | String | Ya | Nama mata pelajaran |
| 4 | `KELAS` | String | Ya | Nama kelas |
| 5 | `JENIS_PENILAIAN` | Enum | Ya | `Tugas`, `UH`, `PTS`, `PAS`, `Praktik`, `Project` |
| 6 | `NAMA_PENILAIAN` | String | Ya | Nama tugas/ujian |
| 7 | `NAMA_SISWA` | String | Ya | Nama siswa |
| 8 | `NILAI` | Number (0–100) | Ya | Nilai angka valid 0 hingga 100 |

---

## 7. Sheet: `Jurnal`
| No | Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| 1 | `TIMESTAMP` | ISO Date String | Auto | Timestamp pencatatan backend |
| 2 | `TANGGAL` | Date (YYYY-MM-DD) | Ya | Tanggal pelaksanaan |
| 3 | `JAM` | String | Ya | Jam pelajaran (contoh: `07:30 - 09:00`) |
| 4 | `GURU` | String | Ya | Nama guru |
| 5 | `MAPEL` | String | Ya | Mata pelajaran |
| 6 | `KELAS` | String | Ya | Kelas |
| 7 | `MATERI` | String | Ya | Pokok bahasan/materi |
| 8 | `TUJUAN_PEMBELAJARAN` | String | Tidak | Capaian/tujuan |
| 9 | `AKTIVITAS` | String | Tidak | Ringkasan kegiatan |
| 10 | `METODE` | String | Tidak | Metode mengajar (PBL, Ceramah, dll) |
| 11 | `MEDIA` | String | Tidak | Alat/media pembelajaran |
| 12 | `REFLEKSI` | String | Tidak | Evaluasi proses mengajar |
| 13 | `CATATAN` | String | Tidak | Catatan tambahan |
| 14 | `STATUS` | Enum | Ya | `Terlaksana`, `Sebagian`, `Tidak terlaksana` |
