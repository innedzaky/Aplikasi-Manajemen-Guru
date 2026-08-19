/**
 * =========================================================================
 * Config.gs - Konfigurasi Utama Google Apps Script Backend
 * =========================================================================
 * Konfigurasi aman menggunakan Script Properties.
 * Jangan hard-code Spreadsheet ID di file produksi.
 */

var CONFIG = {
  // Ambil Spreadsheet ID dari Script Properties
  getSpreadsheetId: function() {
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty('SPREADSHEET_ID');
    if (!id) {
      // Fallback ke active spreadsheet jika script container-bound
      try {
        var active = SpreadsheetApp.getActiveSpreadsheet();
        if (active) return active.getId();
      } catch (e) {
        // standalone script
      }
      throw new Error('SPREADSHEET_ID belum dikonfigurasi pada Script Properties.');
    }
    return id;
  },

  // Inisialisasi properti (dijalankan satu kali oleh Admin via menu / editor)
  setSpreadsheetId: function(spreadsheetId) {
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', spreadsheetId.trim());
    return 'SPREADSHEET_ID berhasil disimpan: ' + spreadsheetId;
  },

  // JWT/Session Secret Key
  getJwtSecret: function() {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('SESSION_SECRET');
    if (!secret) {
      secret = 'MANAJEMEN_GURU_DEFAULT_SECRET_KEY_2026';
      props.setProperty('SESSION_SECRET', secret);
    }
    return secret;
  },

  // Daftar nama Sheet resmi
  SHEETS: {
    GURU: 'Guru',
    SISWA: 'Siswa',
    KELAS: 'Kelas',
    MAPEL: 'Mapel',
    PRESENSI: 'Presensi',
    NILAI: 'Nilai',
    JURNAL: 'Jurnal'
  },

  // Definisi header kolom untuk verifikasi & auto-create
  HEADERS: {
    Guru: ['ID_GURU', 'NAMA_GURU', 'USERNAME', 'PASSWORD', 'MAPEL'],
    Siswa: ['NISN', 'NAMA', 'KELAS', 'JENIS_KELAMIN'],
    Kelas: ['ID_KELAS', 'NAMA_KELAS', 'WALI_KELAS'],
    Mapel: ['ID_MAPEL', 'NAMA_MATA_PELAJARAN'],
    Presensi: ['TIMESTAMP', 'TANGGAL', 'GURU', 'MAPEL', 'KELAS', 'PERTEMUAN', 'NAMA_SISWA', 'STATUS', 'CATATAN'],
    Nilai: ['TIMESTAMP', 'GURU', 'MAPEL', 'KELAS', 'JENIS_PENILAIAN', 'NAMA_PENILAIAN', 'NAMA_SISWA', 'NILAI'],
    Jurnal: ['TIMESTAMP', 'TANGGAL', 'JAM', 'GURU', 'MAPEL', 'KELAS', 'MATERI', 'TUJUAN_PEMBELAJARAN', 'AKTIVITAS', 'METODE', 'MEDIA', 'REFLEKSI', 'CATATAN', 'STATUS']
  }
};
