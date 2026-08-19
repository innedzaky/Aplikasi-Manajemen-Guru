/**
 * =========================================================================
 * JurnalService.gs - CRUD Service Jurnal Mengajar Guru
 * =========================================================================
 */

var JurnalService = {
  /**
   * Mengambil data Jurnal dengan filter
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.JURNAL);
      var results = rows.map(function(row) {
        return {
          _rowIndex: row._rowIndex,
          TIMESTAMP: row.TIMESTAMP ? String(row.TIMESTAMP) : '',
          TANGGAL: row.TANGGAL ? Utils.formatDate(row.TANGGAL) : '',
          JAM: String(row.JAM || ''),
          GURU: String(row.GURU || ''),
          MAPEL: String(row.MAPEL || ''),
          KELAS: String(row.KELAS || ''),
          MATERI: String(row.MATERI || ''),
          TUJUAN_PEMBELAJARAN: String(row.TUJUAN_PEMBELAJARAN || ''),
          AKTIVITAS: String(row.AKTIVITAS || ''),
          METODE: String(row.METODE || ''),
          MEDIA: String(row.MEDIA || ''),
          REFLEKSI: String(row.REFLEKSI || ''),
          CATATAN: String(row.CATATAN || ''),
          STATUS: String(row.STATUS || '')
        };
      });

      if (params) {
        if (params.guru) {
          results = results.filter(function(j) {
            return j.GURU.toLowerCase() === String(params.guru).toLowerCase();
          });
        }
        if (params.kelas) {
          results = results.filter(function(j) {
            return j.KELAS.toLowerCase() === String(params.kelas).toLowerCase();
          });
        }
        if (params.mapel) {
          results = results.filter(function(j) {
            return j.MAPEL.toLowerCase() === String(params.mapel).toLowerCase();
          });
        }
        if (params.tanggal) {
          var tgl = Utils.formatDate(params.tanggal);
          results = results.filter(function(j) { return j.TANGGAL === tgl; });
        }
        if (params.status) {
          results = results.filter(function(j) {
            return j.STATUS.toLowerCase() === String(params.status).toLowerCase();
          });
        }
        if (params.search) {
          var query = String(params.search).toLowerCase();
          results = results.filter(function(j) {
            return j.MATERI.toLowerCase().indexOf(query) !== -1 ||
                   j.KELAS.toLowerCase().indexOf(query) !== -1 ||
                   j.MAPEL.toLowerCase().indexOf(query) !== -1;
          });
        }
      }

      return Utils.jsonSuccess('Data Jurnal berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Jurnal.', e.message || e);
    }
  },

  /**
   * Menambahkan entri Jurnal Mengajar baru
   */
  create: function(data) {
    try {
      Validation.validateJurnal(data);

      var record = {
        TANGGAL: Utils.formatDate(data.TANGGAL || data.tanggal),
        JAM: Utils.sanitizeString(String(data.JAM || data.jam)),
        GURU: Utils.sanitizeString(String(data.GURU || data.guru)),
        MAPEL: Utils.sanitizeString(String(data.MAPEL || data.mapel)),
        KELAS: Utils.sanitizeString(String(data.KELAS || data.kelas)),
        MATERI: Utils.sanitizeString(String(data.MATERI || data.materi)),
        TUJUAN_PEMBELAJARAN: Utils.sanitizeString(String(data.TUJUAN_PEMBELAJARAN || data.tujuan_pembelajaran || '')),
        AKTIVITAS: Utils.sanitizeString(String(data.AKTIVITAS || data.aktivitas || '')),
        METODE: Utils.sanitizeString(String(data.METODE || data.metode || '')),
        MEDIA: Utils.sanitizeString(String(data.MEDIA || data.media || '')),
        REFLEKSI: Utils.sanitizeString(String(data.REFLEKSI || data.refleksi || '')),
        CATATAN: Utils.sanitizeString(String(data.CATATAN || data.catatan || '')),
        STATUS: Utils.sanitizeString(String(data.STATUS || data.status))
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.JURNAL, record);

      return Utils.jsonSuccess('Jurnal mengajar berhasil disimpan.', record);
    } catch (e) {
      return Utils.jsonError('Gagal menyimpan Jurnal Mengajar.', e.message || e);
    }
  },

  /**
   * Mengubah entri Jurnal Mengajar
   */
  update: function(data) {
    try {
      if (!data._rowIndex) {
        return Utils.jsonError('_rowIndex wajib disertakan untuk update Jurnal.');
      }

      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.JURNAL);
      var rowIndex = Number(data._rowIndex);
      if (rowIndex <= 1 || rowIndex > sheet.getLastRow()) {
        return Utils.jsonError('Baris jurnal target tidak valid.');
      }

      var headers = CONFIG.HEADERS.Jurnal;
      var currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

      var editableFields = [
        'TANGGAL', 'JAM', 'GURU', 'MAPEL', 'KELAS', 'MATERI',
        'TUJUAN_PEMBELAJARAN', 'AKTIVITAS', 'METODE', 'MEDIA', 'REFLEKSI', 'CATATAN', 'STATUS'
      ];

      for (var i = 0; i < editableFields.length; i++) {
        var key = editableFields[i];
        if (data[key] !== undefined) {
          var val = data[key];
          if (key === 'TANGGAL') val = Utils.formatDate(val);
          else if (key === 'STATUS') {
            var allowed = ['Terlaksana', 'Sebagian', 'Tidak terlaksana'];
            if (allowed.indexOf(val) === -1) {
              return Utils.jsonError('STATUS Jurnal tidak valid.');
            }
          } else {
            val = Utils.sanitizeString(String(val));
          }
          currentRow[headers.indexOf(key)] = val;
        }
      }

      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([currentRow]);

      return Utils.jsonSuccess('Jurnal mengajar berhasil diperbarui.', data);
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Jurnal.', e.message || e);
    }
  },

  /**
   * Menghapus entri Jurnal berdasarkan _rowIndex
   */
  remove: function(data) {
    try {
      if (!data || !data._rowIndex) {
        return Utils.jsonError('_rowIndex wajib disertakan untuk menghapus Jurnal.');
      }
      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.JURNAL);
      var rowIndex = Number(data._rowIndex);
      if (rowIndex <= 1 || rowIndex > sheet.getLastRow()) {
        return Utils.jsonError('Baris jurnal tidak valid.');
      }

      sheet.deleteRow(rowIndex);
      return Utils.jsonSuccess('Jurnal mengajar berhasil dihapus.', { _rowIndex: rowIndex });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Jurnal.', e.message || e);
    }
  }
};
