/**
 * Google Apps Script - Config.gs
 * Defines Sheet Headers, Canonical Column Mappings, and Global Parameters for Outbox Sync.
 */

var SYNC_CONFIG = {
  DEFAULT_SECRET: 'dev-sync-secret-default-key-32b',
  REPLAY_WINDOW_SECONDS: 300, // ±5 minutes
  LOCK_TIMEOUT_MS: 15000,     // 15 seconds
  CACHE_EXPIRY_SECONDS: 1800, // 30 minutes

  SHEETS: {
    TEACHER: {
      tabName: 'Guru',
      primaryKey: 'TEACHER_ID',
      headers: [
        'TEACHER_ID',
        'SCHOOL_ID',
        'NIP',
        'NAMA_LENGKAP',
        'SPESIALISASI',
        'STATUS_AKTIF',
        'LAST_SYNCED_AT'
      ]
    },
    STUDENT: {
      tabName: 'Siswa',
      primaryKey: 'STUDENT_ID',
      headers: [
        'STUDENT_ID',
        'SCHOOL_ID',
        'NIS',
        'NISN',
        'NAMA_LENGKAP',
        'GENDER',
        'STATUS_AKTIF',
        'LAST_SYNCED_AT'
      ]
    },
    CLASS: {
      tabName: 'Kelas',
      primaryKey: 'CLASS_ID',
      headers: [
        'CLASS_ID',
        'SCHOOL_ID',
        'NAMA_KELAS',
        'TINGKAT',
        'TAHUN_AJARAN',
        'STATUS_AKTIF',
        'LAST_SYNCED_AT'
      ]
    },
    SUBJECT: {
      tabName: 'Mapel',
      primaryKey: 'SUBJECT_ID',
      headers: [
        'SUBJECT_ID',
        'SCHOOL_ID',
        'KODE_MAPEL',
        'NAMA_MAPEL',
        'KKM_DEFAULT',
        'STATUS_AKTIF',
        'LAST_SYNCED_AT'
      ]
    },
    ASSIGNMENT: {
      tabName: 'Penugasan',
      primaryKey: 'ASSIGNMENT_ID',
      headers: [
        'ASSIGNMENT_ID',
        'SCHOOL_ID',
        'TEACHER_ID',
        'NAMA_GURU',
        'SUBJECT_ID',
        'NAMA_MAPEL',
        'CLASS_ID',
        'NAMA_KELAS',
        'TAHUN_AJARAN',
        'SEMESTER',
        'LAST_SYNCED_AT'
      ]
    },
    ATTENDANCE: {
      tabName: 'Presensi',
      primaryKey: 'ATTENDANCE_RECORD_ID',
      headers: [
        'ATTENDANCE_RECORD_ID',
        'ATTENDANCE_SESSION_ID',
        'SCHOOL_ID',
        'TANGGAL',
        'PERTEMUAN_KE',
        'KELAS',
        'MATA_PELAJARAN',
        'GURU_PENGAJAR',
        'TOPIK_MATERI',
        'STUDENT_ID',
        'NIS',
        'NAMA_SISWA',
        'STATUS_KEHADIRAN',
        'CATATAN',
        'SYNCED_AT'
      ]
    },
    ASSESSMENT: {
      tabName: 'Penilaian',
      primaryKey: 'ASSESSMENT_ID',
      headers: [
        'ASSESSMENT_ID',
        'SCHOOL_ID',
        'JUDUL_PENILAIAN',
        'TIPE_PENILAIAN',
        'TANGGAL_PENILAIAN',
        'KKM',
        'BOBOT',
        'KELAS',
        'MATA_PELAJARAN',
        'GURU_PENGAJAR',
        'SYNCED_AT'
      ]
    },
    GRADE: {
      tabName: 'Nilai',
      primaryKey: 'GRADE_ID',
      headers: [
        'GRADE_ID',
        'ASSESSMENT_ID',
        'SCHOOL_ID',
        'JUDUL_PENILAIAN',
        'TIPE_PENILAIAN',
        'TANGGAL_PENILAIAN',
        'KKM',
        'BOBOT',
        'KELAS',
        'MATA_PELAJARAN',
        'GURU_PENGAJAR',
        'STUDENT_ID',
        'NIS',
        'NAMA_SISWA',
        'SKOR',
        'STATUS_TUNTAS',
        'FEEDBACK',
        'SYNCED_AT'
      ]
    },
    JOURNAL: {
      tabName: 'Jurnal',
      primaryKey: 'JOURNAL_ID',
      headers: [
        'JOURNAL_ID',
        'SCHOOL_ID',
        'TANGGAL',
        'PERTEMUAN_KE',
        'KELAS',
        'MATA_PELAJARAN',
        'GURU_PENGAJAR',
        'MATERI_PEMBELAJARAN',
        'METODE_BELAJAR',
        'RINGKASAN_KEHADIRAN',
        'CATATAN_KELAS',
        'TINDAK_LANJUT',
        'SYNCED_AT'
      ]
    }
  }
};

/**
 * Resolves the configured shared secret from Script Properties or defaults.
 */
function getSyncSecret() {
  var propSecret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
  return propSecret || SYNC_CONFIG.DEFAULT_SECRET;
}

/**
 * Resolves target Spreadsheet for a given school ID.
 */
function getTargetSpreadsheet(schoolId) {
  var propSpreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID_' + schoolId);
  if (propSpreadsheetId) {
    return SpreadsheetApp.openById(propSpreadsheetId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
