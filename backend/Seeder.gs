/**
 * =========================================================================
 * Seeder.gs - Google Apps Script Initial Data Population Helper
 * =========================================================================
 * Digunakan untuk mengisi spreadsheet baru dengan data dummy demo awal.
 */

function seedDatabaseDemo() {
  var ss = SpreadsheetHelper.getSpreadsheet();
  SpreadsheetHelper.initDatabase();

  // 1. Seed Guru
  var guruData = [
    ['G001', 'Budi Santoso, S.Pd.', 'budi', Utils.hashPassword('password123'), 'Matematika'],
    ['G002', 'Siti Aminah, M.Pd.', 'siti', Utils.hashPassword('password123'), 'Bahasa Indonesia'],
    ['G003', 'Ahmad Fauzi, S.Kom.', 'ahmad', Utils.hashPassword('password123'), 'Informatika']
  ];
  var sheetGuru = SpreadsheetHelper.getSheet(CONFIG.SHEETS.GURU);
  if (sheetGuru.getLastRow() <= 1) {
    sheetGuru.getRange(2, 1, guruData.length, guruData[0].length).setValues(guruData);
  }

  // 2. Seed Kelas
  var kelasData = [
    ['K01', 'X TKJ 1', 'Ahmad Fauzi, S.Kom.'],
    ['K02', 'X TKJ 2', 'Siti Aminah, M.Pd.'],
    ['K03', 'XI RPL 1', 'Budi Santoso, S.Pd.'],
    ['K04', 'XII MM 1', 'Budi Santoso, S.Pd.']
  ];
  var sheetKelas = SpreadsheetHelper.getSheet(CONFIG.SHEETS.KELAS);
  if (sheetKelas.getLastRow() <= 1) {
    sheetKelas.getRange(2, 1, kelasData.length, kelasData[0].length).setValues(kelasData);
  }

  // 3. Seed Mapel
  var mapelData = [
    ['M01', 'Matematika'],
    ['M02', 'Bahasa Indonesia'],
    ['M03', 'Informatika'],
    ['M04', 'Pemrograman Web'],
    ['M05', 'Basis Data']
  ];
  var sheetMapel = SpreadsheetHelper.getSheet(CONFIG.SHEETS.MAPEL);
  if (sheetMapel.getLastRow() <= 1) {
    sheetMapel.getRange(2, 1, mapelData.length, mapelData[0].length).setValues(mapelData);
  }

  // 4. Seed Siswa
  var siswaData = [
    ['0081234501', 'Aditya Pratama', 'X TKJ 1', 'L'],
    ['0081234502', 'Anisa Rahmawati', 'X TKJ 1', 'P'],
    ['0081234503', 'Bagus Setiawan', 'X TKJ 1', 'L'],
    ['0081234504', 'Citra Dewi', 'X TKJ 1', 'P'],
    ['0081234505', 'Dimas Anggara', 'X TKJ 1', 'L'],
    ['0081234506', 'Eka Lestari', 'X TKJ 2', 'P'],
    ['0081234507', 'Fajar Nugraha', 'X TKJ 2', 'L'],
    ['0081234508', 'Gilang Ramadhan', 'XI RPL 1', 'L'],
    ['0081234509', 'Hana Fitria', 'XI RPL 1', 'P'],
    ['0081234510', 'Indra Gunawan', 'XII MM 1', 'L']
  ];
  var sheetSiswa = SpreadsheetHelper.getSheet(CONFIG.SHEETS.SISWA);
  if (sheetSiswa.getLastRow() <= 1) {
    sheetSiswa.getRange(2, 1, siswaData.length, siswaData[0].length).setValues(siswaData);
  }

  Logger.log('Seeder database dummy berhasil diselesaikan.');
  return 'Database Google Spreadsheet berhasil di-seed!';
}
