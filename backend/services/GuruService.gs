/**
 * =========================================================================
 * GuruService.gs - CRUD Service Master Guru
 * =========================================================================
 * Catatan Keamanan: Password TIDAK PERNAH dikembalikan dalam API response.
 */

var GuruService = {
  /**
   * Mengambil semua data Guru (atau filter berdasarkan ID_GURU / USERNAME)
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.GURU);
      var results = rows.map(function(row) {
        return {
          ID_GURU: String(row.ID_GURU || ''),
          NAMA_GURU: String(row.NAMA_GURU || ''),
          USERNAME: String(row.USERNAME || ''),
          MAPEL: String(row.MAPEL || '')
          // PASSWORD sengaja di-omit untuk keamanan
        };
      });

      // Filter jika parameter ID_GURU disertakan
      if (params && params.id) {
        results = results.filter(function(g) { return g.ID_GURU === String(params.id); });
      } else if (params && params.search) {
        var query = String(params.search).toLowerCase();
        results = results.filter(function(g) {
          return g.NAMA_GURU.toLowerCase().indexOf(query) !== -1 ||
                 g.USERNAME.toLowerCase().indexOf(query) !== -1 ||
                 g.MAPEL.toLowerCase().indexOf(query) !== -1;
        });
      }

      return Utils.jsonSuccess('Data Guru berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Guru.', e.message || e);
    }
  },

  /**
   * Menambahkan Guru baru
   */
  create: function(data) {
    try {
      Validation.validateGuru(data, false);

      var cleanId = Utils.sanitizeString(String(data.ID_GURU));
      var cleanNama = Utils.sanitizeString(String(data.NAMA_GURU));
      var cleanUsername = Utils.sanitizeString(String(data.USERNAME));
      var cleanMapel = Utils.sanitizeString(String(data.MAPEL || ''));

      // Cek duplikasi ID_GURU atau USERNAME
      var existing = SpreadsheetHelper.readAll(CONFIG.SHEETS.GURU);
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i].ID_GURU) === cleanId) {
          return Utils.jsonError('ID Guru "' + cleanId + '" sudah digunakan.');
        }
        if (String(existing[i].USERNAME).toLowerCase() === cleanUsername.toLowerCase()) {
          return Utils.jsonError('Username "' + cleanUsername + '" sudah digunakan.');
        }
      }

      var hashedPassword = Utils.hashPassword(String(data.PASSWORD));

      var newRecord = {
        ID_GURU: cleanId,
        NAMA_GURU: cleanNama,
        USERNAME: cleanUsername,
        PASSWORD: hashedPassword,
        MAPEL: cleanMapel
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.GURU, newRecord);

      return Utils.jsonSuccess('Guru berhasil ditambahkan.', {
        ID_GURU: cleanId,
        NAMA_GURU: cleanNama,
        USERNAME: cleanUsername,
        MAPEL: cleanMapel
      });
    } catch (e) {
      return Utils.jsonError('Gagal menambahkan Guru.', e.message || e);
    }
  },

  /**
   * Mengubah data Guru
   */
  update: function(data) {
    try {
      Validation.validateGuru(data, true);
      var idGuru = Utils.sanitizeString(String(data.ID_GURU));

      var updateFields = {};
      if (data.NAMA_GURU !== undefined) updateFields.NAMA_GURU = Utils.sanitizeString(String(data.NAMA_GURU));
      if (data.USERNAME !== undefined) updateFields.USERNAME = Utils.sanitizeString(String(data.USERNAME));
      if (data.MAPEL !== undefined) updateFields.MAPEL = Utils.sanitizeString(String(data.MAPEL));
      if (data.PASSWORD && String(data.PASSWORD).trim() !== '') {
        updateFields.PASSWORD = Utils.hashPassword(String(data.PASSWORD));
      }

      SpreadsheetHelper.updateByPk(CONFIG.SHEETS.GURU, 'ID_GURU', idGuru, updateFields);

      return Utils.jsonSuccess('Data Guru berhasil diperbarui.', {
        ID_GURU: idGuru,
        NAMA_GURU: updateFields.NAMA_GURU,
        USERNAME: updateFields.USERNAME,
        MAPEL: updateFields.MAPEL
      });
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Guru.', e.message || e);
    }
  },

  /**
   * Menghapus Guru berdasarkan ID_GURU
   */
  remove: function(data) {
    try {
      if (!data || !data.ID_GURU) {
        return Utils.jsonError('ID_GURU wajib disertakan untuk menghapus Guru.');
      }
      var idGuru = Utils.sanitizeString(String(data.ID_GURU));
      SpreadsheetHelper.deleteByPk(CONFIG.SHEETS.GURU, 'ID_GURU', idGuru);

      return Utils.jsonSuccess('Guru dengan ID ' + idGuru + ' berhasil dihapus.', { ID_GURU: idGuru });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Guru.', e.message || e);
    }
  }
};
