/**
 * =========================================================================
 * statsCalculator.ts - Dynamic Real-Time Statistics & Analytics Engine
 * Calculates Presensi, Nilai, Jurnal, and Monthly Trends directly from real data arrays
 * =========================================================================
 */

import { IPresensi, INilai, IJurnal, IKelas, ISiswa, IGuru, IMapel } from '../types.ts';
import {
  IDashboardData,
  IPresensiDistribution,
  IMonthlyActivityTrend,
  IClassGradeAverage,
  IRecentActivity
} from '../types/dashboard.ts';
import { parseDateSafe, formatIndoDate } from './dateUtils.ts';

export interface IStatistikPresensiDetail {
  total: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentaseHadir: number;
  persentaseIzin: number;
  persentaseSakit: number;
  persentaseAlpa: number;
}

export interface IStatistikNilaiDetail {
  total: number;
  rataRata: number;
  nilaiTertinggi: number;
  nilaiTerendah: number;
  totalTuntas: number;
  totalRemedial: number;
  persentaseTuntas: number;
  distribusiGrade: {
    A: number; // >= 90
    B: number; // 80 - 89
    C: number; // 75 - 79
    D: number; // < 75
  };
  rataRataPerJenis: {
    jenis: string;
    rataRata: number;
    count: number;
  }[];
}

export interface IStatistikJurnalDetail {
  total: number;
  terlaksana: number;
  sebagian: number;
  tidakTerlaksana: number;
  persentaseTerlaksana: number;
  topMapel: { mapel: string; count: number }[];
  topKelas: { kelas: string; count: number }[];
}

export class StatsCalculator {
  /**
   * Hitung statistik rekapitulasi presensi Hadir/Izin/Sakit/Alpa dari data aktual
   */
  public static calculatePresensiStats(presensiList: IPresensi[]): IStatistikPresensiDetail {
    const total = presensiList.length;
    if (total === 0) {
      return {
        total: 0,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
        persentaseHadir: 0,
        persentaseIzin: 0,
        persentaseSakit: 0,
        persentaseAlpa: 0
      };
    }

    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    presensiList.forEach((p) => {
      const status = (p.STATUS || '').toLowerCase().trim();
      if (status === 'hadir') hadir++;
      else if (status === 'izin') izin++;
      else if (status === 'sakit') sakit++;
      else if (status === 'alpa' || status === 'tanpa keterangan') alpa++;
      else hadir++; // default fallback
    });

    return {
      total,
      hadir,
      izin,
      sakit,
      alpa,
      persentaseHadir: Number(((hadir / total) * 100).toFixed(1)),
      persentaseIzin: Number(((izin / total) * 100).toFixed(1)),
      persentaseSakit: Number(((sakit / total) * 100).toFixed(1)),
      persentaseAlpa: Number(((alpa / total) * 100).toFixed(1))
    };
  }

  /**
   * Hitung statistik nilai (Rata-rata, Max, Min, Ketuntasan, Distribusi) dari data aktual
   */
  public static calculateNilaiStats(nilaiList: INilai[], kkm: number = 75): IStatistikNilaiDetail {
    const total = nilaiList.length;
    if (total === 0) {
      return {
        total: 0,
        rataRata: 0,
        nilaiTertinggi: 0,
        nilaiTerendah: 0,
        totalTuntas: 0,
        totalRemedial: 0,
        persentaseTuntas: 0,
        distribusiGrade: { A: 0, B: 0, C: 0, D: 0 },
        rataRataPerJenis: []
      };
    }

    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let tuntas = 0;
    const gradeCount = { A: 0, B: 0, C: 0, D: 0 };
    const jenisMap: Record<string, { total: number; count: number }> = {};

    nilaiList.forEach((n) => {
      const score = Number(n.NILAI) || 0;
      sum += score;
      if (score > max) max = score;
      if (score < min) min = score;

      if (score >= kkm) tuntas++;

      if (score >= 90) gradeCount.A++;
      else if (score >= 80) gradeCount.B++;
      else if (score >= 75) gradeCount.C++;
      else gradeCount.D++;

      const jenis = n.JENIS_PENILAIAN || 'Lainnya';
      if (!jenisMap[jenis]) jenisMap[jenis] = { total: 0, count: 0 };
      jenisMap[jenis].total += score;
      jenisMap[jenis].count += 1;
    });

    const rataRataPerJenis = Object.keys(jenisMap).map((j) => ({
      jenis: j,
      rataRata: Number((jenisMap[j].total / jenisMap[j].count).toFixed(1)),
      count: jenisMap[j].count
    }));

    return {
      total,
      rataRata: Number((sum / total).toFixed(1)),
      nilaiTertinggi: max === -Infinity ? 0 : max,
      nilaiTerendah: min === Infinity ? 0 : min,
      totalTuntas: tuntas,
      totalRemedial: total - tuntas,
      persentaseTuntas: Number(((tuntas / total) * 100).toFixed(1)),
      distribusiGrade: gradeCount,
      rataRataPerJenis
    };
  }

  /**
   * Hitung statistik jurnal mengajar (Keterlaksanaan KBM & Top Mapel/Kelas)
   */
  public static calculateJurnalStats(jurnalList: IJurnal[]): IStatistikJurnalDetail {
    const total = jurnalList.length;
    if (total === 0) {
      return {
        total: 0,
        terlaksana: 0,
        sebagian: 0,
        tidakTerlaksana: 0,
        persentaseTerlaksana: 0,
        topMapel: [],
        topKelas: []
      };
    }

    let terlaksana = 0;
    let sebagian = 0;
    let tidakTerlaksana = 0;

    const mapelCount: Record<string, number> = {};
    const kelasCount: Record<string, number> = {};

    jurnalList.forEach((j) => {
      const status = (j.STATUS || '').toLowerCase();
      if (status.includes('terlaksana') && !status.includes('tidak')) {
        terlaksana++;
      } else if (status.includes('sebagian')) {
        sebagian++;
      } else {
        tidakTerlaksana++;
      }

      if (j.MAPEL) mapelCount[j.MAPEL] = (mapelCount[j.MAPEL] || 0) + 1;
      if (j.KELAS) kelasCount[j.KELAS] = (kelasCount[j.KELAS] || 0) + 1;
    });

    const topMapel = Object.entries(mapelCount)
      .map(([mapel, count]) => ({ mapel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topKelas = Object.entries(kelasCount)
      .map(([kelas, count]) => ({ kelas, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      terlaksana,
      sebagian,
      tidakTerlaksana,
      persentaseTerlaksana: Number(((terlaksana / total) * 100).toFixed(1)),
      topMapel,
      topKelas
    };
  }

  /**
   * Hitung agregasi bulanan dinamis (6 bulan terakhir) dari presensi, jurnal, dan nilai
   */
  public static calculateMonthlyTrends(
    presensiList: IPresensi[],
    jurnalList: IJurnal[],
    nilaiList: INilai[]
  ): IMonthlyActivityTrend[] {
    // Generate 6 bulan terakhir mundur dari sekarang
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const result: IMonthlyActivityTrend[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth(); // 0-11
      const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIndex]} ${year !== now.getFullYear() ? `'${String(year).slice(-2)}` : ''}`.trim();

      // Hitung presensi di bulan ini
      const monthPresensi = presensiList.filter((p) => {
        if (!p.TANGGAL) return false;
        const dObj = parseDateSafe(p.TANGGAL);
        if (dObj) {
          return dObj.getFullYear() === year && dObj.getMonth() === monthIndex;
        }
        return p.TANGGAL.startsWith(monthPrefix);
      }).length;

      // Hitung jurnal di bulan ini
      const monthJurnal = jurnalList.filter((j) => {
        if (!j.TANGGAL) return false;
        const dObj = parseDateSafe(j.TANGGAL);
        if (dObj) {
          return dObj.getFullYear() === year && dObj.getMonth() === monthIndex;
        }
        return j.TANGGAL.startsWith(monthPrefix);
      }).length;

      // Hitung rata-rata nilai di bulan ini
      const monthNilai = nilaiList.filter((n) => {
        if (!n.TANGGAL) return false;
        const dObj = parseDateSafe(n.TANGGAL);
        if (dObj) {
          return dObj.getFullYear() === year && dObj.getMonth() === monthIndex;
        }
        return n.TANGGAL.startsWith(monthPrefix);
      });

      let avgNilai = 0;
      if (monthNilai.length > 0) {
        const sum = monthNilai.reduce((acc, curr) => acc + (Number(curr.NILAI) || 0), 0);
        avgNilai = Number((sum / monthNilai.length).toFixed(1));
      } else {
        // Jika belum ada nilai di bulan lampau, gunakan rata-rata keseluruhan jika ada
        if (nilaiList.length > 0) {
          const overallSum = nilaiList.reduce((acc, curr) => acc + (Number(curr.NILAI) || 0), 0);
          avgNilai = Number((overallSum / nilaiList.length).toFixed(1));
        } else {
          avgNilai = 0;
        }
      }

      result.push({
        bulan: label,
        presensi: monthPresensi,
        jurnal: monthJurnal,
        rataRataNilai: avgNilai
      });
    }

    return result;
  }

  /**
   * Hitung performa rata-rata per kelas dari data nilai aktual
   */
  public static calculateClassPerformance(
    nilaiList: INilai[],
    kelasList: IKelas[]
  ): IClassGradeAverage[] {
    const map: Record<string, { total: number; count: number }> = {};

    // Inisialisasi setiap kelas yang terdaftar
    kelasList.forEach((k) => {
      map[k.NAMA_KELAS] = { total: 0, count: 0 };
    });

    nilaiList.forEach((n) => {
      const k = n.KELAS;
      if (k) {
        if (!map[k]) map[k] = { total: 0, count: 0 };
        map[k].total += Number(n.NILAI) || 0;
        map[k].count += 1;
      }
    });

    return Object.keys(map).map((kelasName) => {
      const item = map[kelasName];
      const rataRata = item.count > 0 ? Number((item.total / item.count).toFixed(1)) : 0;
      return {
        kelas: kelasName,
        rataRata,
        totalSiswaDinilai: item.count
      };
    });
  }

  /**
   * Bangun keseluruhan objek IDashboardData secara realtime dari data murni database
   */
  public static buildFullDashboardStats(
    presensiList: IPresensi[],
    nilaiList: INilai[],
    jurnalList: IJurnal[],
    kelasList: IKelas[],
    siswaList: ISiswa[],
    guruList: IGuru[],
    mapelList: IMapel[],
    filterGuru?: string
  ): IDashboardData {
    let pList = [...presensiList];
    let nList = [...nilaiList];
    let jList = [...jurnalList];

    if (filterGuru) {
      const gLower = filterGuru.toLowerCase().trim();
      pList = pList.filter((p) => (p.GURU || '').toLowerCase().includes(gLower));
      nList = nList.filter((n) => (n.GURU || '').toLowerCase().includes(gLower));
      jList = jList.filter((j) => (j.GURU || '').toLowerCase().includes(gLower));
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const presensiHariIni = pList.filter((p) => p.TANGGAL && p.TANGGAL.startsWith(todayStr)).length;
    const jurnalHariIni = jList.filter((j) => j.TANGGAL && j.TANGGAL.startsWith(todayStr)).length;

    const presensiStats = this.calculatePresensiStats(pList);
    const distribusiPresensi: IPresensiDistribution = {
      Hadir: presensiStats.hadir,
      Izin: presensiStats.izin,
      Sakit: presensiStats.sakit,
      Alpa: presensiStats.alpa
    };

    const grafikBulanan = this.calculateMonthlyTrends(pList, jList, nList);
    const rataRataNilaiKelas = this.calculateClassPerformance(nList, kelasList);

    // Aktivitas terbaru digabungkan dari jurnal, presensi, dan nilai
    const aktivitasTerbaru: IRecentActivity[] = [
      ...jList.slice(0, 3).map((j, idx) => ({
        id: `act-j-${idx}-${j._rowIndex || idx}`,
        tipe: 'jurnal' as const,
        judul: `Jurnal Pembelajaran: ${j.KELAS} - ${j.MAPEL}`,
        subjudul: j.MATERI || 'Materi pembelajaran terselesaikan',
        waktu: formatIndoDate(j.TANGGAL),
        statusBadge: j.STATUS,
        statusColor: 'emerald'
      })),
      ...pList.slice(0, 3).map((p, idx) => ({
        id: `act-p-${idx}-${p._rowIndex || idx}`,
        tipe: 'presensi' as const,
        judul: `Presensi: ${p.NAMA_SISWA} (${p.KELAS})`,
        subjudul: `Pertemuan #${p.PERTEMUAN} - Status: ${p.STATUS}`,
        waktu: formatIndoDate(p.TANGGAL),
        statusBadge: p.STATUS,
        statusColor: p.STATUS === 'Hadir' ? 'blue' : p.STATUS === 'Izin' ? 'amber' : 'rose'
      }))
    ].slice(0, 5);

    return {
      ringkasan: {
        totalGuru: guruList.length,
        totalSiswa: siswaList.length,
        totalKelas: kelasList.length,
        totalMapel: mapelList.length,
        totalPresensi: pList.length,
        totalNilai: nList.length,
        totalJurnal: jList.length
      },
      hariIni: {
        tanggal: todayStr,
        presensiHariIni,
        jurnalHariIni
      },
      distribusiPresensi,
      grafikBulanan,
      rataRataNilaiKelas,
      aktivitasTerbaru
    };
  }
}
