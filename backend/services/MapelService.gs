/**
 * =========================================================================
 * MapelService.gs - CRUD Service Master Mata Pelajaran
 * =========================================================================
 */

var MapelService = {
  /**
   * Mengambil semua data Mapel
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.MAPEL);
      var results = rows.map(function(row) {
        return {
          ID_MAPEL: String(row.ID_MAPEL || ''),
          NAMA_MATA_PELAJARAN: String(row.NAMA_MATA_PELAJARAN || '')
        };
      });

      if (params && params.search) {
        var query = String(params.search).toLowerCase();
        results = results.filter(function(m) {
          return m.NAMA_MATA_PELAJARAN.toLowerCase().indexOf(query) !== -1 ||
                 m.ID_MAPEL.toLowerCase().indexOf(query) !== -1;
        });
      }

      return Utils.jsonSuccess('Data Mata Pelajaran berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Mata Pelajaran.', e.message || e);
    }
  },

  /**
   * Menambahkan Mapel baru
   */
  create: function(data) {
    try {
      Validation.validateMapel(data, false);

      var cleanId = Utils.sanitizeString(String(data.ID_MAPEL));
      var cleanNama = Utils.sanitizeString(String(data.NAMA_MATA_PELAJARAN));

      // Cek duplikasi ID_MAPEL atau NAMA_MATA_PELAJARAN
      var existing = SpreadsheetHelper.readAll(CONFIG.SHEETS.MAPEL);
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i].ID_MAPEL) === cleanId) {
          return Utils.jsonError('ID Mapel "' + cleanId + '" sudah ada.');
        }
        if (String(existing[i].NAMA_MATA_PELAJARAN).toLowerCase() === cleanNama.toLowerCase()) {
          return Utils.jsonError('Mata Pelajaran "' + cleanNama + '" sudah terdaftar.');
        }
      }

      var newRecord = {
        ID_MAPEL: cleanId,
        NAMA_MATA_PELAJARAN: cleanNama
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.MAPEL, newRecord);

      return Utils.jsonSuccess('Mata Pelajaran berhasil ditambahkan.', newRecord);
    } catch (e) {
      return Utils.jsonError('Gagal menambahkan Mata Pelajaran.', e.message || e);
    }
  },

  /**
   * Mengubah data Mapel
   */
  update: function(data) {
    try {
      Validation.validateMapel(data, true);
      var idMapel = Utils.sanitizeString(String(data.ID_MAPEL));

      var updateFields = {};
      if (data.NAMA_MATA_PELAJARAN !== undefined) {
        updateFields.NAMA_MATA_PELAJARAN = Utils.sanitizeString(String(data.NAMA_MATA_PELAJARAN));
      }

      SpreadsheetHelper.updateByPk(CONFIG.SHEETS.MAPEL, 'ID_MAPEL', idMapel, updateFields);

      return Utils.jsonSuccess('Data Mata Pelajaran berhasil diperbarui.', {
        ID_MAPEL: idMapel,
        NAMA_MATA_PELAJARAN: updateFields.NAMA_MATA_PELAJARAN
      });
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Mata Pelajaran.', e.message || e);
    }
  },

  /**
   * Menghapus Mapel berdasarkan ID_MAPEL
   */
  remove: function(data) {
    try {
      if (!data || !data.ID_MAPEL) {
        return Utils.jsonError('ID_MAPEL wajib disertakan untuk menghapus Mata Pelajaran.');
      }
      var idMapel = Utils.sanitizeString(String(data.ID_MAPEL));
      SpreadsheetHelper.deleteByPk(CONFIG.SHEETS.MAPEL, 'ID_MAPEL', idMapel);

      return Utils.jsonSuccess('Mata Pelajaran dengan ID ' + idMapel + ' berhasil dihapus.', { ID_MAPEL: idMapel });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Mata Pelajaran.', e.message || e);
    }
  }
};
