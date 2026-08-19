/**
 * =========================================================================
 * dashboard.ts - Type Definitions for Dashboard Analytics & Stats
 * =========================================================================
 */

export interface IDashboardSummary {
  totalGuru: number;
  totalSiswa: number;
  totalKelas: number;
  totalMapel: number;
  totalPresensi: number;
  totalNilai: number;
  totalJurnal: number;
}

export interface IDashboardToday {
  tanggal: string;
  presensiHariIni: number;
  jurnalHariIni: number;
}

export interface IPresensiDistribution {
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpa: number;
}

export interface IMonthlyActivityTrend {
  bulan: string;
  presensi: number;
  jurnal: number;
  rataRataNilai: number;
}

export interface IClassGradeAverage {
  kelas: string;
  rataRata: number;
  totalSiswaDinilai: number;
}

export interface IRecentActivity {
  id: string;
  tipe: 'presensi' | 'jurnal' | 'nilai';
  judul: string;
  subjudul: string;
  waktu: string;
  statusBadge?: string;
  statusColor?: string;
}

export interface IDashboardData {
  ringkasan: IDashboardSummary;
  hariIni: IDashboardToday;
  distribusiPresensi: IPresensiDistribution;
  grafikBulanan: IMonthlyActivityTrend[];
  rataRataNilaiKelas: IClassGradeAverage[];
  aktivitasTerbaru?: IRecentActivity[];
}
