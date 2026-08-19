/**
 * =========================================================================
 * NilaiService.gs - CRUD Service Penilaian Siswa
 * =========================================================================
 * Memastikan nilai angka 0–100 dan validasi jenis penilaian.
 */

var NilaiService = {
  /**
   * Mengambil data Nilai dengan filter
   */
  getAll: function(params) {
    try {
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.NILAI);
      var results = rows.map(function(row) {
        return {
          _rowIndex: row._rowIndex,
          TIMESTAMP: row.TIMESTAMP ? String(row.TIMESTAMP) : '',
          GURU: String(row.GURU || ''),
          MAPEL: String(row.MAPEL || ''),
          KELAS: String(row.KELAS || ''),
          JENIS_PENILAIAN: String(row.JENIS_PENILAIAN || ''),
          NAMA_PENILAIAN: String(row.NAMA_PENILAIAN || ''),
          NAMA_SISWA: String(row.NAMA_SISWA || ''),
          NILAI: Number(row.NILAI)
        };
      });

      if (params) {
        if (params.kelas) {
          results = results.filter(function(n) {
            return n.KELAS.toLowerCase() === String(params.kelas).toLowerCase();
          });
        }
        if (params.mapel) {
          results = results.filter(function(n) {
            return n.MAPEL.toLowerCase() === String(params.mapel).toLowerCase();
          });
        }
        if (params.guru) {
          results = results.filter(function(n) {
            return n.GURU.toLowerCase() === String(params.guru).toLowerCase();
          });
        }
        if (params.jenis_penilaian) {
          results = results.filter(function(n) {
            return n.JENIS_PENILAIAN.toLowerCase() === String(params.jenis_penilaian).toLowerCase();
          });
        }
        if (params.nama_penilaian) {
          results = results.filter(function(n) {
            return n.NAMA_PENILAIAN.toLowerCase() === String(params.nama_penilaian).toLowerCase();
          });
        }
        if (params.nama_siswa) {
          var qNama = String(params.nama_siswa).toLowerCase();
          results = results.filter(function(n) {
            return n.NAMA_SISWA.toLowerCase().indexOf(qNama) !== -1;
          });
        }
      }

      return Utils.jsonSuccess('Data Nilai berhasil diambil.', results);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil data Nilai.', e.message || e);
    }
  },

  /**
   * Menambahkan satu data nilai siswa
   */
  create: function(data) {
    try {
      Validation.validateNilai(data);

      var record = {
        GURU: Utils.sanitizeString(String(data.GURU || data.guru)),
        MAPEL: Utils.sanitizeString(String(data.MAPEL || data.mapel)),
        KELAS: Utils.sanitizeString(String(data.KELAS || data.kelas)),
        JENIS_PENILAIAN: Utils.sanitizeString(String(data.JENIS_PENILAIAN || data.jenis_penilaian)),
        NAMA_PENILAIAN: Utils.sanitizeString(String(data.NAMA_PENILAIAN || data.nama_penilaian)),
        NAMA_SISWA: Utils.sanitizeString(String(data.NAMA_SISWA || data.nama_siswa)),
        NILAI: Number(data.NILAI !== undefined ? data.NILAI : data.nilai)
      };

      SpreadsheetHelper.appendRow(CONFIG.SHEETS.NILAI, record);

      return Utils.jsonSuccess('Nilai siswa berhasil disimpan.', record);
    } catch (e) {
      return Utils.jsonError('Gagal menyimpan Nilai.', e.message || e);
    }
  },

  /**
   * Menambahkan nilai massal (satu kelas) dengan Batch Append
   */
  createBatch: function(data) {
    try {
      var items = data.items || data.nilaiList || [];
      if (!items || items.length === 0) {
        return Utils.jsonError('Daftar nilai siswa (items) tidak boleh kosong.');
      }

      var sanitizedRows = [];
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        Validation.validateNilai(it);
        sanitizedRows.push({
          GURU: Utils.sanitizeString(String(it.GURU || it.guru)),
          MAPEL: Utils.sanitizeString(String(it.MAPEL || it.mapel)),
          KELAS: Utils.sanitizeString(String(it.KELAS || it.kelas)),
          JENIS_PENILAIAN: Utils.sanitizeString(String(it.JENIS_PENILAIAN || it.jenis_penilaian)),
          NAMA_PENILAIAN: Utils.sanitizeString(String(it.NAMA_PENILAIAN || it.nama_penilaian)),
          NAMA_SISWA: Utils.sanitizeString(String(it.NAMA_SISWA || it.nama_siswa)),
          NILAI: Number(it.NILAI !== undefined ? it.NILAI : it.nilai)
        });
      }

      var insertedCount = SpreadsheetHelper.appendBatch(CONFIG.SHEETS.NILAI, sanitizedRows);

      return Utils.jsonSuccess(insertedCount + ' data nilai siswa berhasil disimpan.', {
        total: insertedCount,
        kelas: sanitizedRows[0].KELAS,
        mapel: sanitizedRows[0].MAPEL,
        penilaian: sanitizedRows[0].NAMA_PENILAIAN
      });
    } catch (e) {
      return Utils.jsonError('Gagal menyimpan batch Nilai.', e.message || e);
    }
  },

  /**
   * Mengubah nilai siswa
   */
  update: function(data) {
    try {
      if (!data._rowIndex && (!data.KELAS || !data.NAMA_PENILAIAN || !data.NAMA_SISWA)) {
        return Utils.jsonError('Dibutuhkan _rowIndex atau kombinasi (KELAS, NAMA_PENILAIAN, NAMA_SISWA) untuk update nilai.');
      }

      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.NILAI);
      var rows = SpreadsheetHelper.readAll(CONFIG.SHEETS.NILAI);
      var targetIndex = -1;

      if (data._rowIndex) {
        targetIndex = Number(data._rowIndex);
      } else {
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          if (String(r.KELAS) === String(data.KELAS) &&
              String(r.NAMA_PENILAIAN) === String(data.NAMA_PENILAIAN) &&
              String(r.NAMA_SISWA) === String(data.NAMA_SISWA)) {
            targetIndex = r._rowIndex;
            break;
          }
        }
      }

      if (targetIndex <= 1 || targetIndex > sheet.getLastRow()) {
        return Utils.jsonError('Data nilai target tidak ditemukan.');
      }

      if (data.NILAI !== undefined) {
        var num = Number(data.NILAI);
        if (isNaN(num) || num < 0 || num > 100) {
          return Utils.jsonError('NILAI harus berupa angka 0–100.');
        }
      }

      var headers = CONFIG.HEADERS.Nilai;
      var currentRow = sheet.getRange(targetIndex, 1, 1, headers.length).getValues()[0];

      if (data.NILAI !== undefined) currentRow[headers.indexOf('NILAI')] = Number(data.NILAI);
      if (data.JENIS_PENILAIAN !== undefined) currentRow[headers.indexOf('JENIS_PENILAIAN')] = Utils.sanitizeString(String(data.JENIS_PENILAIAN));
      if (data.NAMA_PENILAIAN !== undefined) currentRow[headers.indexOf('NAMA_PENILAIAN')] = Utils.sanitizeString(String(data.NAMA_PENILAIAN));

      sheet.getRange(targetIndex, 1, 1, headers.length).setValues([currentRow]);

      return Utils.jsonSuccess('Nilai siswa berhasil diperbarui.', data);
    } catch (e) {
      return Utils.jsonError('Gagal memperbarui Nilai.', e.message || e);
    }
  },

  /**
   * Menghapus rekaman Nilai berdasarkan _rowIndex
   */
  remove: function(data) {
    try {
      if (!data || !data._rowIndex) {
        return Utils.jsonError('_rowIndex wajib disertakan untuk menghapus nilai.');
      }
      var sheet = SpreadsheetHelper.getSheet(CONFIG.SHEETS.NILAI);
      var rowIndex = Number(data._rowIndex);
      if (rowIndex <= 1 || rowIndex > sheet.getLastRow()) {
        return Utils.jsonError('Baris nilai tidak valid.');
      }

      sheet.deleteRow(rowIndex);
      return Utils.jsonSuccess('Rekaman nilai berhasil dihapus.', { _rowIndex: rowIndex });
    } catch (e) {
      return Utils.jsonError('Gagal menghapus Nilai.', e.message || e);
    }
  }
};
