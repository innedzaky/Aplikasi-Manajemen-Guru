/**
 * =========================================================================
 * Auth.gs - Backend Authentication, Token Session & Role Authorization
 * =========================================================================
 * Mengelola verifikasi kredensial dari sheet Guru, pembuatan token sesi
 * berbasis HMAC-SHA256, verifikasi sesi, dan pembagian hak akses (role).
 */

var Auth = {
  /**
   * Durasi sesi aktif (default: 24 jam dalam milidetik)
   */
  SESSION_DURATION_MS: 24 * 60 * 60 * 1000,

  /**
   * Menghitung role pengguna berdasarkan username / ID_GURU
   * Rule: Username 'innedzaky' atau 'admin' memiliki role 'admin'
   * Pengguna lainnya memiliki role 'guru'
   */
  resolveRole: function(guruRecord) {
    if (!guruRecord) return 'guest';
    var username = String(guruRecord.USERNAME || '').toLowerCase();
    var idGuru = String(guruRecord.ID_GURU || '').toUpperCase();
    if (username === 'innedzaky' || username === 'admin' || idGuru === 'ADMIN' || idGuru === 'ADM001' || idGuru === 'ADM002' || idGuru === 'G000') {
      return 'admin';
    }
    return 'guru';
  },

  /**
   * Membuat Token Sesi bertandatangan HMAC-SHA256
   * Payload di-encode base64 dan ditandatangani dengan secret key backend
   */
  generateSessionToken: function(userObj) {
    var secret = CONFIG.getJwtSecret();
    var header = { alg: 'HS256', typ: 'JWT' };
    var now = new Date().getTime();
    var exp = now + this.SESSION_DURATION_MS;

    var payload = {
      id_guru: userObj.ID_GURU,
      nama_guru: userObj.NAMA_GURU,
      username: userObj.USERNAME,
      mapel: userObj.MAPEL || '',
      role: userObj.role,
      iat: now,
      exp: exp
    };

    var headerEncoded = Utilities.base64EncodeWebSafe(JSON.stringify(header));
    var payloadEncoded = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
    var dataToSign = headerEncoded + '.' + payloadEncoded;

    var signatureBytes = Utilities.computeHmacSha256Signature(dataToSign, secret);
    var signatureEncoded = Utilities.base64EncodeWebSafe(signatureBytes);

    return headerEncoded + '.' + payloadEncoded + '.' + signatureEncoded;
  },

  /**
   * Memverifikasi keabsahan Token Sesi dan masa berlakunya
   */
  verifySessionToken: function(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token sesi tidak ditemukan.' };
    }

    var parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format token sesi tidak valid.' };
    }

    var headerEncoded = parts[0];
    var payloadEncoded = parts[1];
    var signatureEncoded = parts[2];
    var secret = CONFIG.getJwtSecret();

    // Verifikasi tanda tangan HMAC
    var dataToSign = headerEncoded + '.' + payloadEncoded;
    var expectedSignatureBytes = Utilities.computeHmacSha256Signature(dataToSign, secret);
    var expectedSignatureEncoded = Utilities.base64EncodeWebSafe(expectedSignatureBytes);

    if (signatureEncoded !== expectedSignatureEncoded) {
      return { valid: false, error: 'Tanda tangan token sesi tidak sah atau telah dimanipulasi.' };
    }

    // Decode payload
    try {
      var payloadJson = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadEncoded)).getDataAsString();
      var payload = JSON.parse(payloadJson);

      // Cek kedaluwarsa
      var now = new Date().getTime();
      if (payload.exp && now > payload.exp) {
        return { valid: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' };
      }

      return {
        valid: true,
        user: {
          ID_GURU: payload.id_guru,
          NAMA_GURU: payload.nama_guru,
          USERNAME: payload.username,
          MAPEL: payload.mapel,
          role: payload.role
        }
      };
    } catch (e) {
      return { valid: false, error: 'Gagal membaca payload sesi.' };
    }
  },

  /**
   * Memproses Login
   */
  login: function(data) {
    try {
      if (!data || !data.username || !data.password) {
        return Utils.jsonError('Username dan password wajib diisi.');
      }

      var cleanUsername = String(data.username).trim().toLowerCase();
      var plainPassword = String(data.password).trim();

      // Cari di sheet Guru
      var guruList = SpreadsheetHelper.readAll(CONFIG.SHEETS.GURU);
      var matchedGuru = null;

      for (var i = 0; i < guruList.length; i++) {
        var g = guruList[i];
        if (String(g.USERNAME || '').trim().toLowerCase() === cleanUsername) {
          matchedGuru = g;
          break;
        }
      }

      // Khusus akun default Super Admin (innedzaky) dan Admin Biasa (admin) jika sheet belum memiliki baris
      if (!matchedGuru && cleanUsername === 'innedzaky') {
        if (plainPassword === '1sampai7' || plainPassword === '1234567') {
          matchedGuru = {
            ID_GURU: 'ADM001',
            NAMA_GURU: 'Inne Dzaky (Super Admin)',
            USERNAME: 'innedzaky',
            MAPEL: 'Semua Mapel'
          };
        }
      } else if (!matchedGuru && cleanUsername === 'admin') {
        if (plainPassword === 'admin123' || plainPassword === 'password123') {
          matchedGuru = {
            ID_GURU: 'ADM002',
            NAMA_GURU: 'Administrator Sekolah (Admin Biasa)',
            USERNAME: 'admin',
            MAPEL: 'Semua Mapel'
          };
        }
      }

      if (!matchedGuru) {
        return Utils.jsonError('Username atau password tidak cocok.');
      }

      // Verifikasi Password jika bukan akun fallback virtual
      if (matchedGuru.PASSWORD) {
        var isValidPass = Utils.verifyPassword(plainPassword, String(matchedGuru.PASSWORD));
        if (!isValidPass) {
          return Utils.jsonError('Username atau password tidak cocok.');
        }
      }

      var role = this.resolveRole(matchedGuru);

      var safeUser = {
        ID_GURU: String(matchedGuru.ID_GURU),
        NAMA_GURU: String(matchedGuru.NAMA_GURU),
        USERNAME: String(matchedGuru.USERNAME),
        MAPEL: String(matchedGuru.MAPEL || ''),
        role: role
      };

      var token = this.generateSessionToken(safeUser);

      return Utils.jsonSuccess('Login berhasil.', {
        token: token,
        user: safeUser,
        expiresInMs: this.SESSION_DURATION_MS
      });
    } catch (e) {
      return Utils.jsonError('Gagal memproses login.', e.message || e);
    }
  },

  /**
   * Memeriksa validitas sesi pengguna
   */
  checkSession: function(data) {
    try {
      var token = (data && data.token) ? data.token : null;
      var sessionResult = this.verifySessionToken(token);

      if (!sessionResult.valid) {
        return Utils.jsonError(sessionResult.error || 'Sesi tidak valid.');
      }

      return Utils.jsonSuccess('Sesi aktif dan valid.', {
        user: sessionResult.user
      });
    } catch (e) {
      return Utils.jsonError('Gagal memeriksa sesi.', e.message || e);
    }
  },

  /**
   * Memproses Logout
   */
  logout: function(data) {
    return Utils.jsonSuccess('Logout berhasil. Sesi telah diakhiri.');
  }
};
