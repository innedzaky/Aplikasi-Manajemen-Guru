/**
 * =========================================================================
 * PresensiService.gs - CRUD Service Presensi Siswa
 * =========================================================================
 * Mendukung pembacaan terfilter, create perorangan, dan create batch satu kelas.
 */

var PresensiService = {
  /**
   * Mengambil data Presensi dengan opsi filter
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.PRESENSI);
      var results = rows.map(function(row) {
        return {
          _rowIndex: row._rowIndex,
          TIMESTAMP: row.TIMESTAMP ? String(row.TIMESTAMP) : '',
          TANGGAL: row.TANGGAL ? Utils.formatDate(row.TANGGAL) : '',
          GURU: String(row.GURU || ''),
          MAPEL: String(row.MAPEL || ''),
          KELAS: String(row.KELAS || ''),
          PERTEMUAN: row.PERTEMUAN !== undefined ? row.PERTEMUAN : '',
          NAMA_SISWA: String(row.NAMA_SISWA || ''),
          STATUS: String(row.STATUS || ''),
          CATATAN: String(row.CATATAN || '')
        };
      });

      if (params) {
        if (params.tanggal) {
          var tgl = Utils.formatDate(params.tanggal);
          results = results.filter(function(p) { return p.TANGGAL === tgl; });
        }
        if (params.kelas) {
          results = results.filter(function(p) {
            return p.KELAS.toLowerCase() === String(params.kelas).toLowerCase();
          });
        }
        if (params.mapel) {
          results = results.filter(function(p) {
            return p.MAPEL.toLowerCase() === String(params.mapel).toLowerCase();
          });
        }
        if (params.guru) {
          results = results.filter(function(p) {
            return p.GURU.toLowerCase() === String(params.guru).toLowerCase();
          });
        }
        if (params.pertemuan) {
          results = results.filter(function(p) {
            return String(p.PERTEMUAN) === String(params.pertemuan);
          });
        }
        if (params.nama_siswa) {
          var qNama = String(params.nama_siswa).toLowerCase();
          results = results.filter(function(p) {
            return p.NAMA_SISWA.toLowerCase().indexOf(qNama) !== -1;
          });
        }
      }

      return Utils.jsonSuccess('Data Presensi berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Presensi.', e.message || e);
    }
  },

  /**
   * Menambahkan satu data presensi siswa
   */
  create: function(data) {
    try {
      Validation.validatePresensi(data);

      var record = {
        TANGGAL: Utils.formatDate(data.TANGGAL || data.tanggal),
        GURU: Utils.sanitizeString(String(data.GURU || data.guru)),
        MAPEL: Utils.sanitizeString(String(data.MAPEL || data.mapel)),
        KELAS: Utils.sanitizeString(String(data.KELAS || data.kelas)),
        PERTEMUAN: Number(data.PERTEMUAN || data.pertemuan),
        NAMA_SISWA: Utils.sanitizeString(String(data.NAMA_SISWA || data.nama_siswa)),
        STATUS: Utils.sanitizeString(String(data.STATUS || data.status)),
        CATATAN: Utils.sanitizeString(String(data.CATATAN || data.catatan || ''))
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.PRESENSI, record);

      return Utils.jsonSuccess('Presensi berhasil disimpan.', record);
    } catch (e) {
      return Utils.jsonError('Gagal menyimpan Presensi.', e.message || e);
    }
  },

  /**
   * Menambahkan presensi massal (satu kelas) secara efisien dengan Batch Append
   */
  createBatch: function(data) {
    try {
      var items = data.items || data.presensiList || [];
      if (!items || items.length === 0) {
        return Utils.jsonError('Daftar presensi siswa (items) tidak boleh kosong.');
      }

      var sanitizedRows = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        Validation.validatePresensi(it);
        sanitizedRows.push({
          TANGGAL: Utils.formatDate(it.TANGGAL || it.tanggal),
          GURU: Utils.sanitizeString(String(it.GURU || it.guru)),
          MAPEL: Utils.sanitizeString(String(it.MAPEL || it.mapel)),
          KELAS: Utils.sanitizeString(String(it.KELAS || it.kelas)),
          PERTEMUAN: Number(it.PERTEMUAN || it.pertemuan),
          NAMA_SISWA: Utils.sanitizeString(String(it.NAMA_SISWA || it.nama_siswa)),
          STATUS: Utils.sanitizeString(String(it.STATUS || it.status)),
          CATATAN: Utils.sanitizeString(String(it.CATATAN || it.catatan || ''))
        });
      }

      var insertedCount = SpreadsheetHelper.appendBatch(CONFIG.SHEETS.PRESENSI, sanitizedRows);

      return Utils.jsonSuccess(insertedCount + ' data presensi kelas berhasil disimpan.', {
        total: insertedCount,
        kelas: sanitizedRows[0].KELAS,
        tanggal: sanitizedRows[0].TANGGAL,
        pertemuan: sanitizedRows[0].PERTEMUAN
      });
    } catch (e) {
      return Utils.jsonError('Gagal menyimpan batch Presensi.', e.message || e);
    }
  },

  /**
   * Mengubah data Presensi berdasarkan baris/kriteria
   */
  update: function(data) {
    try {
      if (!data._rowIndex && (!data.TANGGAL || !data.KELAS || !data.NAMA_SISWA || !data.PERTEMUAN)) {
        return Utils.jsonError('Dibutuhkan _rowIndex atau kombinasi (TANGGAL, KELAS, NAMA_SISWA, PERTEMUAN) untuk update.');
      }

      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.PRESENSI);
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.PRESENSI);
      var targetIndex = -1;

      if (data._rowIndex) {
        targetIndex = Number(data._rowIndex);
      } else {
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          if (Utils.formatDate(r.TANGGAL) === Utils.formatDate(data.TANGGAL) &&
              String(r.KELAS) === String(data.KELAS) &&
              String(r.NAMA_SISWA) === String(data.NAMA_SISWA) &&
              String(r.PERTEMUAN) === String(data.PERTEMUAN)) {
            targetIndex = r._rowIndex;
            break;
          }
        }
      }

      if (targetIndex <= 1 || targetIndex > sheet.getLastRow()) {
        return Utils.jsonError('Data presensi target tidak ditemukan.');
      }

      if (data.STATUS) {
        var allowedStatus = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
        if (allowedStatus.indexOf(data.STATUS) === -1) {
          return Utils.jsonError('STATUS harus salah satu dari: ' + allowedStatus.join(', '));
        }
      }

      var headers = CONFIG.HEADERS.Presensi;
      var currentRow = sheet.getRange(targetIndex, 1, 1, headers.length).getValues()[0];

      if (data.STATUS !== undefined) currentRow[headers.indexOf('STATUS')] = data.STATUS;
      if (data.CATATAN !== undefined) currentRow[headers.indexOf('CATATAN')] = Utils.sanitizeString(String(data.CATATAN));

      sheet.getRange(targetIndex, 1, 1, headers.length).setValues([currentRow]);

      return Utils.jsonSuccess('Presensi siswa berhasil diperbarui.', data);
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Presensi.', e.message || e);
    }
  },

  /**
   * Menghapus rekaman Presensi berdasarkan row index atau filter
   */
  remove: function(data) {
    try {
      if (!data || !data._rowIndex) {
        return Utils.jsonError('_rowIndex wajib disertakan untuk menghapus rekaman Presensi.');
      }
      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.PRESENSI);
      var rowIndex = Number(data._rowIndex);
      if (rowIndex <= 1 || rowIndex > sheet.getLastRow()) {
        return Utils.jsonError('Baris presensi tidak valid.');
      }

      sheet.deleteRow(rowIndex);
      return Utils.jsonSuccess('Rekaman presensi berhasil dihapus.', { _rowIndex: rowIndex });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Presensi.', e.message || e);
    }
  }
};
