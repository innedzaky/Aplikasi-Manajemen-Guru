/**
 * =========================================================================
 * Spreadsheet.gs - Spreadsheet Data Access Layer & Optimization Helper
 * =========================================================================
 * Mengimplementasikan batch reads/writes untuk mencegah pemanggilan
 * getRange / getValue berulang dalam loop.
 */

var SpreadsheetHelper = {
  /**
   * Mendapatkan instance Spreadsheet aktif
   */
  getSpreadsheet: function() {
    var ssId = CONFIG.getSpreadsheetId();
    return SpreadsheetApp.openById(ssId);
  },

  /**
   * Mendapatkan sheet berdasarkan nama, buat baru jika belum ada
   */
  getSheet: function(sheetName) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Auto pasang header jika ada definisi di CONFIG
      if (CONFIG.HEADERS[sheetName]) {
        sheet.appendRow(CONFIG.HEADERS[sheetName]);
        sheet.setFrozenRows(1);
      }
    }
    return sheet;
  },

  /**
   * Membaca semua data dari sheet sebagai array of objects
   * Batch reading: getDataRange().getValues() dalam 1 kali call
   */
  readAll: function(sheetName) {
    var sheet = this.getSheet(sheetName);
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();

    if (!values || values.length <= 1) {
      return []; // Hanya header atau kosong
    }

    var headers = values[0].map(function(h) {
      return String(h).trim();
    });

    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Skip baris yang seluruh kolomnya kosong
      var isAllEmpty = row.every(function(cell) {
        return cell === '' || cell === null || cell === undefined;
      });
      if (isAllEmpty) continue;

      var obj = { _rowIndex: i + 1 }; // 1-based index di spreadsheet
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        if (key) {
          obj[key] = row[j];
        }
      }
      rows.push(obj);
    }
    return rows;
  },

  /**
   * Menambahkan single record ke sheet
   */
  appendRow: function(sheetName, rowObject) {
    var sheet = this.getSheet(sheetName);
    var headers = CONFIG.HEADERS[sheetName] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var rowValues = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header === 'TIMESTAMP') {
        rowValues.push(new Date().toISOString());
      } else {
        rowValues.push(rowObject[header] !== undefined ? rowObject[header] : '');
      }
    }

    sheet.appendRow(rowValues);
    return rowObject;
  },

  /**
   * Batch append multiple rows (Sangat efisien untuk input presensi / nilai massal)
   */
  appendBatch: function(sheetName, rowsArray) {
    if (!rowsArray || rowsArray.length === 0) return 0;
    
    var sheet = this.getSheet(sheetName);
    var headers = CONFIG.HEADERS[sheetName] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var timestamp = new Date().toISOString();

    var matrix = [];
    for (var r = 0; r < rowsArray.length; r++) {
      var item = rowsArray[r];
      var rowValues = [];
      for (var c = 0; c < headers.length; c++) {
        var header = headers[c];
        if (header === 'TIMESTAMP') {
          rowValues.push(timestamp);
        } else {
          rowValues.push(item[header] !== undefined ? item[header] : '');
        }
      }
      matrix.push(rowValues);
    }

    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, matrix.length, headers.length).setValues(matrix);
    return matrix.length;
  },

  /**
   * Update record berdasarkan Primary Key
   */
  updateByPk: function(sheetName, pkField, pkValue, updatedFields) {
    var sheet = this.getSheet(sheetName);
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();

    if (!values || values.length <= 1) {
      throw new Error('Data tidak ditemukan');
    }

    var headers = values[0].map(function(h) { return String(h).trim(); });
    var pkIndex = headers.indexOf(pkField);
    if (pkIndex === -1) {
      throw new Error('Primary Key field ' + pkField + ' tidak ditemukan di sheet ' + sheetName);
    }

    var targetRowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][pkIndex]).trim() === String(pkValue).trim()) {
        targetRowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error('Data dengan ' + pkField + '=' + pkValue + ' tidak ditemukan.');
    }

    // Ambil baris target dan ubah field yang relevan
    var currentRowValues = sheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
    for (var k = 0; k < headers.length; k++) {
      var key = headers[k];
      if (updatedFields[key] !== undefined && key !== 'TIMESTAMP' && key !== pkField) {
        currentRowValues[k] = updatedFields[key];
      }
    }

    sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([currentRowValues]);
    return true;
  },

  /**
   * Delete record berdasarkan Primary Key
   */
  deleteByPk: function(sheetName, pkField, pkValue) {
    var sheet = this.getSheet(sheetName);
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();

    if (!values || values.length <= 1) {
      throw new Error('Data tidak ditemukan');
    }

    var headers = values[0].map(function(h) { return String(h).trim(); });
    var pkIndex = headers.indexOf(pkField);
    if (pkIndex === -1) {
      throw new Error('Primary Key field ' + pkField + ' tidak ditemukan di sheet ' + sheetName);
    }

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][pkIndex]).trim() === String(pkValue).trim()) {
        sheet.deleteRow(i + 1); // 1-based index
        return true;
      }
    }

    throw new Error('Data dengan ' + pkField + '=' + pkValue + ' tidak ditemukan untuk dihapus.');
  },

  /**
   * Inisialisasi dan verifikasi semua sheet dan header sesuai DATABASE_SPECIFICATION.md
   */
  initDatabase: function() {
    var ss = this.getSpreadsheet();
    var results = [];
    var sheetKeys = Object.keys(CONFIG.HEADERS);

    for (var i = 0; i < sheetKeys.length; i++) {
      var sheetName = sheetKeys[i];
      var expectedHeaders = CONFIG.HEADERS[sheetName];
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(expectedHeaders);
        sheet.setFrozenRows(1);
        results.push('Sheet ' + sheetName + ' dibuat dengan header.');
      } else {
        // Cek header baris 1
        var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
        if (existingHeaders.length === 0 || existingHeaders[0] === '') {
          sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
          sheet.setFrozenRows(1);
          results.push('Sheet ' + sheetName + ' diisi header.');
        } else {
          results.push('Sheet ' + sheetName + ' sudah terverifikasi.');
        }
      }
    }

    return results;
  }
};
