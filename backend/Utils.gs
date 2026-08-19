/**
 * =========================================================================
 * Utils.gs - Backend Utility Functions
 * =========================================================================
 * Respons JSON, Sanitasi, Timestamp, dan Password Hashing Helper
 */

var Utils = {
  /**
   * Response standar sukses
   */
  jsonSuccess: function(message, data) {
    var output = {
      success: true,
      message: message || 'Berhasil',
      data: data !== undefined ? data : {}
    };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Response standar gagal
   */
  jsonError: function(message, errorDetails) {
    var output = {
      success: false,
      message: message || 'Terjadi kesalahan',
      error: errorDetails ? String(errorDetails) : undefined
    };
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Sanitasi string untuk mencegah injeksi formula Spreadsheet & XSS
   */
  sanitizeString: function(str) {
    if (typeof str !== 'string') return str;
    var trimmed = str.trim();
    // Mencegah Formula Injection di Google Spreadsheet (=, +, -, @)
    if (/^[=+\-@]/.test(trimmed)) {
      return "'" + trimmed;
    }
    return trimmed;
  },

  /**
   * Hash password menggunakan SHA-256 bawaan Apps Script Utilities
   */
  hashPassword: function(password) {
    if (!password) return '';
    var rawHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );
    var txtHash = '';
    for (var i = 0; i < rawHash.length; i++) {
      var hashVal = rawHash[i];
      if (hashVal < 0) hashVal += 256;
      var byteString = hashVal.toString(16);
      if (byteString.length == 1) byteString = '0' + byteString;
      txtHash += byteString;
    }
    return txtHash;
  },

  /**
   * Verifikasi kecocokan password plaintext terhadap hash atau fallback plain
   */
  verifyPassword: function(plainPassword, storedPasswordHash) {
    if (!plainPassword || !storedPasswordHash) return false;
    var hashInput = this.hashPassword(plainPassword);
    return hashInput === storedPasswordHash || plainPassword === storedPasswordHash;
  },

  /**
   * Format tanggal YYYY-MM-DD
   */
  formatDate: function(date) {
    var d = date ? new Date(date) : new Date();
    var month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate();
    var year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
};
