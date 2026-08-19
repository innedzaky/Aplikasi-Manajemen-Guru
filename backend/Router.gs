/**
 * =========================================================================
 * Router.gs - Central Action Dispatcher, Auth Middleware & Access Control
 * =========================================================================
 * Memetakan request action ke Service yang sesuai dengan verifikasi otentikasi
 * dan pembatasan otorisasi peran (Admin vs Guru).
 */

var Router = {
  /**
   * Action publik yang tidak mewajibkan token sesi
   */
  PUBLIC_ACTIONS: ['ping', 'login', 'checkSession', 'logout'],

  /**
   * Action khusus role Admin (Guru biasa tidak boleh memutasi master sistem)
   */
  ADMIN_ONLY_ACTIONS: [
    'createGuru', 'updateGuru', 'deleteGuru',
    'createKelas', 'updateKelas', 'deleteKelas',
    'createMapel', 'updateMapel', 'deleteMapel'
  ],

  /**
   * Router untuk GET request
   */
  handleGet: function(e) {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action;

    // Tanpa action: Tampilkan status API
    if (!action) {
      return Utils.jsonSuccess('API Manajemen Guru aktif & siap digunakan.', {
        name: 'Aplikasi Manajemen Guru API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // Auth check jika action bukan publik
    if (this.PUBLIC_ACTIONS.indexOf(action) === -1) {
      var token = params.token;
      var authResult = Auth.verifySessionToken(token);
      if (!authResult.valid) {
        return Utils.jsonError('Akses ditolak: ' + (authResult.error || 'Token tidak valid atau sesi berakhir.'));
      }
    }

    switch (action) {
      // ----------------- Public / Auth -----------------
      case 'ping':
        return Utils.jsonSuccess('PONG', { time: new Date().toISOString() });
      case 'checkSession':
        return Auth.checkSession(params);
      case 'logout':
        return Auth.logout(params);

      // ----------------- Master Read -----------------
      case 'getGuru':
        return GuruService.getAll(params);
      case 'getSiswa':
        return SiswaService.getAll(params);
      case 'getKelas':
        return KelasService.getAll(params);
      case 'getMapel':
        return MapelService.getAll(params);

      // ----------------- Transaksi Read -----------------
      case 'getPresensi':
        return PresensiService.getAll(params);
      case 'getNilai':
        return NilaiService.getAll(params);
      case 'getJurnal':
        return JurnalService.getAll(params);

      // ----------------- Dashboard -----------------
      case 'getDashboardStats':
        return DashboardService.getStats(params);

      default:
        return Utils.jsonError('Action GET "' + action + '" tidak dikenali.');
    }
  },

  /**
   * Router untuk POST request (Action-Dispatcher CRUD + Auth Protection)
   */
  handlePost: function(e) {
    var payload;
    try {
      if (e && e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      } else if (e && e.parameter) {
        payload = e.parameter;
        if (typeof payload.data === 'string') {
          payload.data = JSON.parse(payload.data);
        }
      } else {
        payload = {};
      }
    } catch (parseError) {
      return Utils.jsonError('Format JSON request tidak valid.', parseError.message);
    }

    var action = payload.action;
    var data = payload.data || {};
    var token = payload.token || data.token;

    if (!action) {
      return Utils.jsonError('Parameter "action" wajib disertakan pada payload POST.');
    }

    // 1. Eksekusi Aksi Publik
    if (action === 'login') {
      return Auth.login(data);
    }
    if (action === 'checkSession') {
      return Auth.checkSession({ token: token });
    }
    if (action === 'logout') {
      return Auth.logout(data);
    }

    // 2. Middleware Verifikasi Sesi Token untuk Seluruh Aksi Private
    var authResult = Auth.verifySessionToken(token);
    if (!authResult.valid) {
      return Utils.jsonError('Akses tidak diizinkan: ' + (authResult.error || 'Silakan login terlebih dahulu.'));
    }

    var authenticatedUser = authResult.user;

    // 3. Middleware Otorisasi Hak Akses (Role-Based Access Control)
    if (this.ADMIN_ONLY_ACTIONS.indexOf(action) !== -1) {
      if (authenticatedUser.role !== 'admin') {
        return Utils.jsonError('Akses ditolak: Operasi ini hanya diizinkan untuk Administrator.');
      }
    }

    // Inject konteks guru jika aksi presensi/nilai/jurnal dilakukan oleh guru
    if (authenticatedUser.role === 'guru') {
      if (!data.GURU && !data.guru) {
        data.GURU = authenticatedUser.NAMA_GURU;
        data.guru = authenticatedUser.NAMA_GURU;
      }
    }

    // 4. Dispatching ke Service
    switch (action) {
      // -------------------------------------------------------------
      // 1. MASTER GURU
      // -------------------------------------------------------------
      case 'getGuru':
        return GuruService.getAll(data);
      case 'createGuru':
        return GuruService.create(data);
      case 'updateGuru':
        return GuruService.update(data);
      case 'deleteGuru':
        return GuruService.remove(data);

      // -------------------------------------------------------------
      // 2. MASTER SISWA
      // -------------------------------------------------------------
      case 'getSiswa':
        return SiswaService.getAll(data);
      case 'createSiswa':
        return SiswaService.create(data);
      case 'updateSiswa':
        return SiswaService.update(data);
      case 'deleteSiswa':
        return SiswaService.remove(data);

      // -------------------------------------------------------------
      // 3. MASTER KELAS
      // -------------------------------------------------------------
      case 'getKelas':
        return KelasService.getAll(data);
      case 'createKelas':
        return KelasService.create(data);
      case 'updateKelas':
        return KelasService.update(data);
      case 'deleteKelas':
        return KelasService.remove(data);

      // -------------------------------------------------------------
      // 4. MASTER MAPEL
      // -------------------------------------------------------------
      case 'getMapel':
        return MapelService.getAll(data);
      case 'createMapel':
        return MapelService.create(data);
      case 'updateMapel':
        return MapelService.update(data);
      case 'deleteMapel':
        return MapelService.remove(data);

      // -------------------------------------------------------------
      // 5. PRESENSI
      // -------------------------------------------------------------
      case 'getPresensi':
        return PresensiService.getAll(data);
      case 'createPresensi':
        return PresensiService.create(data);
      case 'createPresensiBatch':
        return PresensiService.createBatch(data);
      case 'updatePresensi':
        return PresensiService.update(data);
      case 'deletePresensi':
        return PresensiService.remove(data);

      // -------------------------------------------------------------
      // 6. NILAI
      // -------------------------------------------------------------
      case 'getNilai':
        return NilaiService.getAll(data);
      case 'createNilai':
        return NilaiService.create(data);
      case 'createNilaiBatch':
        return NilaiService.createBatch(data);
      case 'updateNilai':
        return NilaiService.update(data);
      case 'deleteNilai':
        return NilaiService.remove(data);

      // -------------------------------------------------------------
      // 7. JURNAL MENGAJAR
      // -------------------------------------------------------------
      case 'getJurnal':
        return JurnalService.getAll(data);
      case 'createJurnal':
        return JurnalService.create(data);
      case 'updateJurnal':
        return JurnalService.update(data);
      case 'deleteJurnal':
        return JurnalService.remove(data);

      // -------------------------------------------------------------
      // 8. DASHBOARD & STATISTIK
      // -------------------------------------------------------------
      case 'getDashboardStats':
        return DashboardService.getStats(data);

      default:
        return Utils.jsonError('Action POST "' + action + '" tidak dikenali.');
    }
  }
};
