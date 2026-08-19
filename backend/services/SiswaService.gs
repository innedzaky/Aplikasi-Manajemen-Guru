/**
 * =========================================================================
 * SiswaService.gs - CRUD Service Master Siswa
 * =========================================================================
 */

var SiswaService = {
  /**
   * Mengambil semua data Siswa (dapat difilter berdasarkan KELAS atau NISN)
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.SISWA);
      var results = rows.map(function(row) {
        return {
          NISN: String(row.NISN || ''),
          NAMA: String(row.NAMA || ''),
          KELAS: String(row.KELAS || ''),
          JENIS_KELAMIN: String(row.JENIS_KELAMIN || '').toUpperCase()
        };
      });

      if (params) {
        if (params.kelas) {
          results = results.filter(function(s) {
            return s.KELAS.toLowerCase() === String(params.kelas).toLowerCase();
          });
        }
        if (params.nisn) {
          results = results.filter(function(s) {
            return s.NISN === String(params.nisn);
          });
        }
        if (params.search) {
          var query = String(params.search).toLowerCase();
          results = results.filter(function(s) {
            return s.NAMA.toLowerCase().indexOf(query) !== -1 ||
                   s.NISN.indexOf(query) !== -1 ||
                   s.KELAS.toLowerCase().indexOf(query) !== -1;
          });
        }
      }

      return Utils.jsonSuccess('Data Siswa berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Siswa.', e.message || e);
    }
  },

  /**
   * Menambahkan Siswa baru
   */
  create: function(data) {
    try {
      Validation.validateSiswa(data, false);

      var cleanNisn = Utils.sanitizeString(String(data.NISN));
      var cleanNama = Utils.sanitizeString(String(data.NAMA));
      var cleanKelas = Utils.sanitizeString(String(data.KELAS));
      var cleanJk = String(data.JENIS_KELAMIN).toUpperCase();

      // Cek duplikasi NISN
      var existing = SpreadsheetHelper.readAll(CONFIG.SHEETS.SISWA);
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i].NISN) === cleanNisn) {
          return Utils.jsonError('Siswa dengan NISN ' + cleanNisn + ' sudah terdaftar.');
        }
      }

      var newRecord = {
        NISN: cleanNisn,
        NAMA: cleanNama,
        KELAS: cleanKelas,
        JENIS_KELAMIN: cleanJk
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.SISWA, newRecord);

      return Utils.jsonSuccess('Siswa berhasil ditambahkan.', newRecord);
    } catch (e) {
      return Utils.jsonError('Gagal menambahkan Siswa.', e.message || e);
    }
  },

  /**
   * Mengubah data Siswa
   */
  update: function(data) {
    try {
      Validation.validateSiswa(data, true);
      var nisn = Utils.sanitizeString(String(data.NISN));

      var updateFields = {};
      if (data.NAMA !== undefined) updateFields.NAMA = Utils.sanitizeString(String(data.NAMA));
      if (data.KELAS !== undefined) updateFields.KELAS = Utils.sanitizeString(String(data.KELAS));
      if (data.JENIS_KELAMIN !== undefined) {
        var jk = String(data.JENIS_KELAMIN).toUpperCase();
        if (['L', 'P'].indexOf(jk) === -1) {
          return Utils.jsonError('JENIS_KELAMIN harus L atau P');
        }
        updateFields.JENIS_KELAMIN = jk;
      }

      SpreadsheetHelper.updateByPk(CONFIG.SHEETS.SISWA, 'NISN', nisn, updateFields);

      return Utils.jsonSuccess('Data Siswa berhasil diperbarui.', {
        NISN: nisn,
        NAMA: updateFields.NAMA,
        KELAS: updateFields.KELAS,
        JENIS_KELAMIN: updateFields.JENIS_KELAMIN
      });
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Siswa.', e.message || e);
    }
  },

  /**
   * Menghapus Siswa berdasarkan NISN
   */
  remove: function(data) {
    try {
      if (!data || !data.NISN) {
        return Utils.jsonError('NISN wajib disertakan untuk menghapus Siswa.');
      }
      var nisn = Utils.sanitizeString(String(data.NISN));
      SpreadsheetHelper.deleteByPk(CONFIG.SHEETS.SISWA, 'NISN', nisn);

      return Utils.jsonSuccess('Siswa dengan NISN ' + nisn + ' berhasil dihapus.', { NISN: nisn });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Siswa.', e.message || e);
    }
  }
};
