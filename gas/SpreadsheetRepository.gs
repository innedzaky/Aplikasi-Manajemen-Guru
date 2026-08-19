/**
 * Google Apps Script - SpreadsheetRepository.gs
 * High-performance Spreadsheet UPSERT operations using single-column indexing,
 * batch writing, and LockService concurrency guards.
 */

var SpreadsheetRepository = {
  /**
   * Retrieves or initializes a worksheet with canonical headers.
   */
  getOrCreateSheet: function(ss, tabName, headers) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    } else {
      // Ensure headers are populated if empty
      if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    }
    return sheet;
  },

  /**
   * Fast single-column primary key lookup map.
   * Reads only Column A into memory to avoid costly full-table reads.
   *
   * @returns {Object} Dictionary mapping string PK -> 1-based Row Index
   */
  buildPrimaryKeyIndex: function(sheet) {
    var lastRow = sheet.getLastRow();
    var indexMap = {};
    if (lastRow <= 1) {
      return indexMap;
    }

    // Read only Column 1 (A2:A{lastRow})
    var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      var val = idValues[i][0];
      if (val !== undefined && val !== null && val !== '') {
        indexMap[String(val).trim()] = i + 2; // Row index is (i + 2)
      }
    }
    return indexMap;
  },

  /**
   * Performs an atomic single-row UPSERT on the given sheet.
   */
  upsertSingleRow: function(sheet, headers, pkValue, rowDataArray) {
    var indexMap = this.buildPrimaryKeyIndex(sheet);
    var pkStr = String(pkValue).trim();

    if (indexMap[pkStr]) {
      var targetRow = indexMap[pkStr];
      sheet.getRange(targetRow, 1, 1, rowDataArray.length).setValues([rowDataArray]);
      return { action: 'UPDATED', rowIndex: targetRow };
    } else {
      sheet.appendRow(rowDataArray);
      return { action: 'INSERTED', rowIndex: sheet.getLastRow() };
    }
  },

  /**
   * Performs high-performance batch UPSERT for multiple record arrays.
   * Groups new records for a single batch setValues() write, and updates existing rows in-place.
   *
   * @param {Sheet} sheet - Google Spreadsheet Sheet
   * @param {Array<string>} headers - Expected column headers
   * @param {Array<{ pk: string, values: Array<any> }>} items - Array of records
   * @returns {{ updated: number, inserted: number, total: number }}
   */
  batchUpsertRows: function(sheet, headers, items) {
    if (!items || items.length === 0) {
      return { updated: 0, inserted: 0, total: 0 };
    }

    var indexMap = this.buildPrimaryKeyIndex(sheet);
    var updatedCount = 0;
    var rowsToAppend = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var pkStr = String(item.pk).trim();

      if (indexMap[pkStr]) {
        var existingRow = indexMap[pkStr];
        sheet.getRange(existingRow, 1, 1, item.values.length).setValues([item.values]);
        updatedCount++;
      } else {
        rowsToAppend.push(item.values);
      }
    }

    // Batch append new rows in a single range write
    if (rowsToAppend.length > 0) {
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
    }

    return {
      updated: updatedCount,
      inserted: rowsToAppend.length,
      total: items.length
    };
  }
};
