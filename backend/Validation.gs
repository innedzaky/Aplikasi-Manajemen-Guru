/**
 * =========================================================================
 * Validation.gs - Skema & Input Validator Backend
 * =========================================================================
 * Memastikan setiap data yang masuk valid sebelum menyentuh Spreadsheet.
 */

var Validation = {
  /**
   * Validasi field wajib tidak boleh kosong
   */
  requireFields: function(dataObject, requiredFieldsList) {
    var missing = [];
    for (var i = 0; i < requiredFieldsList.length; i++) {
      var field = requiredFieldsList[i];
      var value = dataObject[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      throw new Error('Field berikut wajib diisi: ' + missing.join(', '));
    }
  },

  /**
   * Validasi Guru
   */
  validateGuru: function(data, isUpdate) {
    if (!isUpdate) {
      this.requireFields(data, ['ID_GURU', 'NAMA_GURU', 'USERNAME', 'PASSWORD']);
    } else {
      this.requireFields(data, ['ID_GURU']);
    }
  },

  /**
   * Validasi Siswa
   */
  validateSiswa: function(data, isUpdate) {
    if (!isUpdate) {
      this.requireFields(data, ['NISN', 'NAMA', 'KELAS', 'JENIS_KELAMIN']);
    } else {
      this.requireFields(data, ['NISN']);
    }

    if (data.JENIS_KELAMIN && ['L', 'P'].indexOf(String(data.JENIS_KELAMIN).toUpperCase()) === -1) {
      throw new Error('JENIS_KELAMIN harus berupa "L" atau "P"');
    }
  },

  /**
   * Validasi Kelas
   */
  validateKelas: function(data, isUpdate) {
    if (!isUpdate) {
      this.requireFields(data, ['ID_KELAS', 'NAMA_KELAS']);
    } else {
      this.requireFields(data, ['ID_KELAS']);
    }
  },

  /**
   * Validasi Mapel
   */
  validateMapel: function(data, isUpdate) {
    if (!isUpdate) {
      this.requireFields(data, ['ID_MAPEL', 'NAMA_MATA_PELAJARAN']);
    } else {
      this.requireFields(data, ['ID_MAPEL']);
    }
  },

  /**
   * Validasi Presensi
   */
  validatePresensi: function(data) {
    this.requireFields(data, ['TANGGAL', 'GURU', 'MAPEL', 'KELAS', 'PERTEMUAN', 'NAMA_SISWA', 'STATUS']);
    var allowedStatus = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
    if (allowedStatus.indexOf(data.STATUS) === -1) {
      throw new Error('STATUS Presensi harus salah satu dari: ' + allowedStatus.join(', '));
    }
  },

  /**
   * Validasi Nilai (0 - 100)
   */
  validateNilai: function(data) {
    this.requireFields(data, ['GURU', 'MAPEL', 'KELAS', 'JENIS_PENILAIAN', 'NAMA_PENILAIAN', 'NAMA_SISWA', 'NILAI']);
    var allowedJenis = ['Tugas', 'UH', 'PTS', 'PAS', 'Praktik', 'Project'];
    if (allowedJenis.indexOf(data.JENIS_PENILAIAN) === -1) {
      throw new Error('JENIS_PENILAIAN harus salah satu dari: ' + allowedJenis.join(', '));
    }

    var numVal = Number(data.NILAI);
    if (isNaN(numVal) || numVal < 0 || numVal > 100) {
      throw new Error('NILAI harus berupa angka dalam rentang 0 sampai 100');
    }
  },

  /**
   * Validasi Jurnal Mengajar
   */
  validateJurnal: function(data) {
    this.requireFields(data, ['TANGGAL', 'JAM', 'GURU', 'MAPEL', 'KELAS', 'MATERI', 'STATUS']);
    var allowedStatus = ['Terlaksana', 'Sebagian', 'Tidak terlaksana'];
    if (allowedStatus.indexOf(data.STATUS) === -1) {
      throw new Error('STATUS Jurnal harus salah satu dari: ' + allowedStatus.join(', '));
    }
  }
};
