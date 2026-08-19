/**
 * =========================================================================
 * KelasService.gs - CRUD Service Master Kelas
 * =========================================================================
 */

var KelasService = {
  /**
   * Mengambil semua data Kelas
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.KELAS);
      var results = rows.map(function(row) {
        return {
          ID_KELAS: String(row.ID_KELAS || ''),
          NAMA_KELAS: String(row.NAMA_KELAS || ''),
          WALI_KELAS: String(row.WALI_KELAS || '')
        };
      });

      if (params && params.search) {
        var query = String(params.search).toLowerCase();
        results = results.filter(function(k) {
          return k.NAMA_KELAS.toLowerCase().indexOf(query) !== -1 ||
                 k.WALI_KELAS.toLowerCase().indexOf(query) !== -1;
        });
      }

      return Utils.jsonSuccess('Data Kelas berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Kelas.', e.message || e);
    }
  },

  /**
   * Menambahkan Kelas baru
   */
  create: function(data) {
    try {
      Validation.validateKelas(data, false);

      var cleanId = Utils.sanitizeString(String(data.ID_KELAS));
      var cleanNama = Utils.sanitizeString(String(data.NAMA_KELAS));
      var cleanWali = Utils.sanitizeString(String(data.WALI_KELAS || ''));

      // Cek duplikasi ID_KELAS atau NAMA_KELAS
      var existing = SpreadsheetHelper.readAll(CONFIG.SHEETS.KELAS);
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i].ID_KELAS) === cleanId) {
          return Utils.jsonError('ID Kelas "' + cleanId + '" sudah ada.');
        }
        if (String(existing[i].NAMA_KELAS).toLowerCase() === cleanNama.toLowerCase()) {
          return Utils.jsonError('Nama Kelas "' + cleanNama + '" sudah terdaftar.');
        }
      }

      var newRecord = {
        ID_KELAS: cleanId,
        NAMA_KELAS: cleanNama,
        WALI_KELAS: cleanWali
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.KELAS, newRecord);

      return Utils.jsonSuccess('Kelas berhasil ditambahkan.', newRecord);
    } catch (e) {
      return Utils.jsonError('Gagal menambahkan Kelas.', e.message || e);
    }
  },

  /**
   * Mengubah data Kelas
   */
  update: function(data) {
    try {
      Validation.validateKelas(data, true);
      var idKelas = Utils.sanitizeString(String(data.ID_KELAS));

      var updateFields = {};
      if (data.NAMA_KELAS !== undefined) updateFields.NAMA_KELAS = Utils.sanitizeString(String(data.NAMA_KELAS));
      if (data.WALI_KELAS !== undefined) updateFields.WALI_KELAS = Utils.sanitizeString(String(data.WALI_KELAS));

      SpreadsheetHelper.updateByPk(CONFIG.SHEETS.KELAS, 'ID_KELAS', idKelas, updateFields);

      return Utils.jsonSuccess('Data Kelas berhasil diperbarui.', {
        ID_KELAS: idKelas,
        NAMA_KELAS: updateFields.NAMA_KELAS,
        WALI_KELAS: updateFields.WALI_KELAS
      });
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Kelas.', e.message || e);
    }
  },

  /**
   * Menghapus Kelas berdasarkan ID_KELAS
   */
  remove: function(data) {
    try {
      if (!data || !data.ID_KELAS) {
        return Utils.jsonError('ID_KELAS wajib disertakan untuk menghapus Kelas.');
      }
      var idKelas = Utils.sanitizeString(String(data.ID_KELAS));
      SpreadsheetHelper.deleteByPk(CONFIG.SHEETS.KELAS, 'ID_KELAS', idKelas);

      return Utils.jsonSuccess('Kelas dengan ID ' + idKelas + ' berhasil dihapus.', { ID_KELAS: idKelas });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Kelas.', e.message || e);
    }
  }
};
