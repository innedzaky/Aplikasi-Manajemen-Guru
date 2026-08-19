# Dokumentasi REST-Style API — Google Apps Script Backend

Backend menggunakan endpoint Google Apps Script Web App dengan pola:
- **HTTP GET**: Query data sederhana, health check, atau check session.
- **HTTP POST**: Aksi Otentikasi dan CRUD dengan JSON payload:
  ```json
  {
    "action": "<nama_action>",
    "token": "<session_token_jika_membutuhkan_auth>",
    "data": { ... }
  }
  ```

Format Response Standar:
```json
// Berhasil
{
  "success": true,
  "message": "Pesan sukses deskriptif",
  "data": { ... }
}

// Gagal / Validasi / Unauthorized Error
{
  "success": false,
  "message": "Pesan kegagalan",
  "error": "Detail error teknis / validasi / otentikasi"
}
```

---

## 0. Authentication & Session Management

### `login` (POST - Public)
Memvalidasi username dan password terhadap sheet `Guru` atau akun fallback admin.
- **Payload**:
  ```json
  {
    "action": "login",
    "data": {
      "username": "budi",
      "password": "password123"
    }
  }
  ```
- **Response Berhasil**:
  ```json
  {
    "success": true,
    "message": "Login berhasil.",
    "data": {
      "token": "eyJhbGci...payload...signature",
      "user": {
        "ID_GURU": "G001",
        "NAMA_GURU": "Budi Santoso, S.Pd.",
        "USERNAME": "budi",
        "MAPEL": "Matematika",
        "role": "guru"
      },
      "expiresInMs": 86400000
    }
  }
  ```

### `checkSession` (GET / POST - Public)
Memverifikasi masa aktif dan integritas signature HMAC-SHA256 dari token sesi.
- **Payload (POST)**:
  ```json
  {
    "action": "checkSession",
    "token": "eyJhbGci..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Sesi aktif dan valid.",
    "data": {
      "user": {
        "ID_GURU": "G001",
        "NAMA_GURU": "Budi Santoso, S.Pd.",
        "USERNAME": "budi",
        "MAPEL": "Matematika",
        "role": "guru"
      }
    }
  }
  ```

### `logout` (POST - Public)
Mengakhiri sesi pengguna.
- **Payload**: `{ "action": "logout" }`

---

## Aturan Otorisasi (Role-Based Access Control)
1. **Public Actions**: `ping`, `login`, `checkSession`, `logout`
2. **Admin-Only Actions**:
   - `createGuru`, `updateGuru`, `deleteGuru`
   - `createKelas`, `updateKelas`, `deleteKelas`
   - `createMapel`, `updateMapel`, `deleteMapel`
3. **Guru & Admin Actions**:
   - `getGuru`, `getSiswa`, `getKelas`, `getMapel`
   - `getPresensi`, `createPresensi`, `createPresensiBatch`, `updatePresensi`, `deletePresensi`
   - `getNilai`, `createNilai`, `createNilaiBatch`, `updateNilai`, `deleteNilai`
   - `getJurnal`, `createJurnal`, `updateJurnal`, `deleteJurnal`
   - `getDashboardStats`

---

## 1. Master Guru

### `getGuru` (GET / POST - Protected)
- **Parameter**: `search` (opsional), `id` (opsional)
- **Response**: Array data guru (password di-omit).

### `createGuru` (POST - Admin Only)
- **Payload**:
  ```json
  {
    "action": "createGuru",
    "token": "<token_admin>",
    "data": {
      "ID_GURU": "G004",
      "NAMA_GURU": "Rina Marlina, S.Pd.",
      "USERNAME": "rina",
      "PASSWORD": "password123",
      "MAPEL": "Bahasa Inggris"
    }
  }
  ```

### `updateGuru` (POST - Admin Only)
- **Payload**:
  ```json
  {
    "action": "updateGuru",
    "token": "<token_admin>",
    "data": {
      "ID_GURU": "G004",
      "NAMA_GURU": "Rina Marlina, M.Pd.",
      "MAPEL": "Bahasa Inggris"
    }
  }
  ```

### `deleteGuru` (POST - Admin Only)
- **Payload**: `{ "action": "deleteGuru", "token": "<token_admin>", "data": { "ID_GURU": "G004" } }`

---

## 2. Master Siswa

### `getSiswa` (GET / POST - Protected)
- **Parameter**: `kelas` (opsional), `nisn` (opsional), `search` (opsional)

### `createSiswa` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createSiswa",
    "token": "<token>",
    "data": {
      "NISN": "0081234511",
      "NAMA": "Kevin Sanjaya",
      "KELAS": "X TKJ 1",
      "JENIS_KELAMIN": "L"
    }
  }
  ```

### `updateSiswa` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "updateSiswa",
    "token": "<token>",
    "data": {
      "NISN": "0081234511",
      "NAMA": "Kevin Sanjaya Sukamuljo",
      "KELAS": "X TKJ 1",
      "JENIS_KELAMIN": "L"
    }
  }
  ```

### `deleteSiswa` (POST - Protected)
- **Payload**: `{ "action": "deleteSiswa", "token": "<token>", "data": { "NISN": "0081234511" } }`

---

## 3. Master Kelas

### `getKelas` (GET / POST - Protected)
- **Parameter**: `search` (opsional)

### `createKelas` (POST - Admin Only)
- **Payload**:
  ```json
  {
    "action": "createKelas",
    "token": "<token_admin>",
    "data": {
      "ID_KELAS": "K004",
      "NAMA_KELAS": "XI TKJ 2",
      "WALI_KELAS": "Rina Marlina, S.Pd."
    }
  }
  ```

---

## 4. Master Mapel

### `getMapel` (GET / POST - Protected)
- **Parameter**: `search` (opsional)

### `createMapel` (POST - Admin Only)
- **Payload**:
  ```json
  {
    "action": "createMapel",
    "token": "<token_admin>",
    "data": {
      "ID_MAPEL": "M004",
      "NAMA_MATA_PELAJARAN": "Fisika"
    }
  }
  ```

---

## 5. Presensi

### `getPresensi` (GET / POST - Protected)
- **Filter**: `tanggal`, `kelas`, `mapel`, `guru`, `pertemuan`

### `createPresensi` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createPresensi",
    "token": "<token>",
    "data": {
      "TANGGAL": "2026-08-14",
      "GURU": "Budi Santoso, S.Pd.",
      "MAPEL": "Matematika",
      "KELAS": "X TKJ 1",
      "PERTEMUAN": 1,
      "NAMA_SISWA": "Aditya Pratama",
      "STATUS": "Hadir",
      "CATATAN": ""
    }
  }
  ```

### `createPresensiBatch` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createPresensiBatch",
    "token": "<token>",
    "data": {
      "items": [
        {
          "TANGGAL": "2026-08-14",
          "GURU": "Budi Santoso, S.Pd.",
          "MAPEL": "Matematika",
          "KELAS": "X TKJ 1",
          "PERTEMUAN": 1,
          "NAMA_SISWA": "Aditya Pratama",
          "STATUS": "Hadir",
          "CATATAN": ""
        }
      ]
    }
  }
  ```

---

## 6. Nilai

### `getNilai` (GET / POST - Protected)
- **Filter**: `kelas`, `mapel`, `guru`, `jenis_penilaian`, `nama_penilaian`

### `createNilai` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createNilai",
    "token": "<token>",
    "data": {
      "GURU": "Budi Santoso, S.Pd.",
      "MAPEL": "Matematika",
      "KELAS": "X TKJ 1",
      "JENIS_PENILAIAN": "UH",
      "NAMA_PENILAIAN": "Ulangan Harian 1",
      "NAMA_SISWA": "Aditya Pratama",
      "NILAI": 88
    }
  }
  ```

### `createNilaiBatch` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createNilaiBatch",
    "token": "<token>",
    "data": {
      "items": [
        {
          "GURU": "Budi Santoso, S.Pd.",
          "MAPEL": "Matematika",
          "KELAS": "X TKJ 1",
          "JENIS_PENILAIAN": "UH",
          "NAMA_PENILAIAN": "Ulangan Harian 1",
          "NAMA_SISWA": "Aditya Pratama",
          "NILAI": 88
        }
      ]
    }
  }
  ```

---

## 7. Jurnal Mengajar

### `getJurnal` (GET / POST - Protected)
- **Filter**: `guru`, `kelas`, `mapel`, `tanggal`, `status`

### `createJurnal` (POST - Protected)
- **Payload**:
  ```json
  {
    "action": "createJurnal",
    "token": "<token>",
    "data": {
      "TANGGAL": "2026-08-14",
      "JAM": "07:30 - 09:00",
      "GURU": "Budi Santoso, S.Pd.",
      "MAPEL": "Matematika",
      "KELAS": "X TKJ 1",
      "MATERI": "Fungsi Kuadrat",
      "TUJUAN_PEMBELAJARAN": "Siswa mampu menentukan titik puncak",
      "AKTIVITAS": "Diskusi kelompok dan pemaparan grafik",
      "METODE": "Problem Based Learning",
      "MEDIA": "GeoGebra & Papan Tulis",
      "REFLEKSI": "Siswa aktif berdiskusi",
      "CATATAN": "Pertemuan berikutnya latihan soal",
      "STATUS": "Terlaksana"
    }
  }
  ```

---

## 8. Dashboard

### `getDashboardStats` (GET / POST - Protected)
- **Parameter**: `guru` (opsional, jika kosong menampilkan agregasi global)
