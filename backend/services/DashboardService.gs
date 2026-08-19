/**
 * =========================================================================
 * DashboardService.gs - Statistik & Ringkasan Dashboard
 * =========================================================================
 */

var DashboardService = {
  /**
   * Mengambil statistik ringkasan untuk dashboard
   */
  getStats: function(params) {
    try {
      var guruRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.GURU);
      var siswaRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.SISWA);
      var kelasRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.KELAS);
      var mapelRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.MAPEL);
      var presensiRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.PRESENSI);
      var nilaiRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.NILAI);
      var jurnalRows = SpreadsheetHelper.readAll(CONFIG.SHEETS.JURNAL);

      var filterGuru = params && params.guru ? String(params.guru).toLowerCase() : null;

      // Filter presensi, nilai, jurnal jika login sebagai guru tertentu
      if (filterGuru) {
        presensiRows = presensiRows.filter(function(p) { return String(p.GURU).toLowerCase() === filterGuru; });
        nilaiRows = nilaiRows.filter(function(n) { return String(n.GURU).toLowerCase() === filterGuru; });
        jurnalRows = jurnalRows.filter(function(j) { return String(j.GURU).toLowerCase() === filterGuru; });
      }

      var todayStr = Utils.formatDate(new Date());

      // Presensi hari ini
      var presensiHariIni = presensiRows.filter(function(p) {
        return Utils.formatDate(p.TANGGAL) === todayStr;
      });

      var statusCount = {
        Hadir: 0,
        Izin: 0,
        Sakit: 0,
        Alpa: 0
      };

      for (var i = 0; i < presensiRows.length; i++) {
        var st = presensiRows[i].STATUS;
        if (statusCount[st] !== undefined) {
          statusCount[st]++;
        }
      }

      // Jurnal hari ini
      var jurnalHariIni = jurnalRows.filter(function(j) {
        return Utils.formatDate(j.TANGGAL) === todayStr;
      });

      // Hitung rata-rata nilai per kelas
      var nilaiPerKelas = {};
      for (var k = 0; k < nilaiRows.length; k++) {
        var item = nilaiRows[k];
        var kls = item.KELAS || 'Lainnya';
        if (!nilaiPerKelas[kls]) {
          nilaiPerKelas[kls] = { total: 0, count: 0 };
        }
        nilaiPerKelas[kls].total += Number(item.NILAI) || 0;
        nilaiPerKelas[kls].count += 1;
      }

      var rataRataKelas = [];
      var kelasKeys = Object.keys(nilaiPerKelas);
      for (var m = 0; m < kelasKeys.length; m++) {
        var cKey = kelasKeys[m];
        var info = nilaiPerKelas[cKey];
        rataRataKelas.push({
          kelas: cKey,
          rataRata: info.count > 0 ? Number((info.total / info.count).toFixed(1)) : 0,
          totalSiswaDinilai: info.count
        });
      }

      // Hitung grafik bulanan (6 bulan terakhir)
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      var monthlyStats = {};
      var now = new Date();
      
      // Inisialisasi 6 bulan terakhir
      for (var b = 5; b >= 0; b--) {
        var d = new Date(now.getFullYear(), now.getMonth() - b, 1);
        var key = d.getFullYear() + '-' + (d.getMonth() + 1);
        var label = monthNames[d.getMonth()];
        monthlyStats[key] = {
          bulan: label,
          presensi: 0,
          jurnal: 0,
          nilaiTotal: 0,
          nilaiCount: 0
        };
      }

      // Agregasi Presensi bulanan
      for (var pIdx = 0; pIdx < presensiRows.length; pIdx++) {
        var pDate = new Date(presensiRows[pIdx].TANGGAL);
        if (!isNaN(pDate.getTime())) {
          var pKey = pDate.getFullYear() + '-' + (pDate.getMonth() + 1);
          if (monthlyStats[pKey]) {
            monthlyStats[pKey].presensi++;
          }
        }
      }

      // Agregasi Jurnal bulanan
      for (var jIdx = 0; jIdx < jurnalRows.length; jIdx++) {
        var jDate = new Date(jurnalRows[jIdx].TANGGAL);
        if (!isNaN(jDate.getTime())) {
          var jKey = jDate.getFullYear() + '-' + (jDate.getMonth() + 1);
          if (monthlyStats[jKey]) {
            monthlyStats[jKey].jurnal++;
          }
        }
      }

      // Agregasi Nilai bulanan
      for (var nIdx = 0; nIdx < nilaiRows.length; nIdx++) {
        var nItem = nilaiRows[nIdx];
        var nDate = nItem.TANGGAL ? new Date(nItem.TANGGAL) : now;
        if (!isNaN(nDate.getTime())) {
          var nKey = nDate.getFullYear() + '-' + (nDate.getMonth() + 1);
          if (monthlyStats[nKey] && nItem.NILAI) {
            monthlyStats[nKey].nilaiTotal += Number(nItem.NILAI) || 0;
            monthlyStats[nKey].nilaiCount++;
          }
        }
      }

      var grafikBulanan = Object.keys(monthlyStats).map(function(k) {
        var item = monthlyStats[k];
        return {
          bulan: item.bulan,
          presensi: item.presensi,
          jurnal: item.jurnal,
          rataRataNilai: item.nilaiCount > 0 ? Number((item.nilaiTotal / item.nilaiCount).toFixed(1)) : 80
        };
      });

      var stats = {
        ringkasan: {
          totalGuru: guruRows.length,
          totalSiswa: siswaRows.length,
          totalKelas: kelasRows.length,
          totalMapel: mapelRows.length,
          totalPresensi: presensiRows.length,
          totalNilai: nilaiRows.length,
          totalJurnal: jurnalRows.length
        },
        hariIni: {
          tanggal: todayStr,
          presensiHariIni: presensiHariIni.length,
          jurnalHariIni: jurnalHariIni.length
        },
        distribusiPresensi: statusCount,
        grafikBulanan: grafikBulanan,
        rataRataNilaiKelas: rataRataKelas
      };

      return Utils.jsonSuccess('Statistik dashboard berhasil diambil.', stats);
    } catch (e) {
      return Utils.jsonError('Gagal mengambil statistik dashboard.', e.message || e);
    }
  }
};
