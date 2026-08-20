/**
 * Database Specification & Schema Contract
 * Single Source of Truth untuk struktur Google Spreadsheet
 */

export interface SheetSchema {
  sheetName: string;
  columns: string[];
  requiredColumns: string[];
  primaryKey?: string;
  allowedValues?: Record<string, string[]>;
}

export const DATABASE_SCHEMA: Record<string, SheetSchema> = {
  Guru: {
    sheetName: 'Guru',
    columns: ['ID_GURU', 'NAMA_GURU', 'USERNAME', 'PASSWORD', 'MAPEL'],
    requiredColumns: ['ID_GURU', 'NAMA_GURU', 'USERNAME', 'PASSWORD'],
    primaryKey: 'ID_GURU'
  },
  Siswa: {
    sheetName: 'Siswa',
    columns: ['NISN', 'NAMA', 'KELAS', 'JENIS_KELAMIN', 'STATUS'],
    requiredColumns: ['NISN', 'NAMA', 'KELAS', 'JENIS_KELAMIN'],
    primaryKey: 'NISN',
    allowedValues: {
      JENIS_KELAMIN: ['L', 'P'],
      STATUS: ['Aktif', 'Pindah', 'Lulus', 'Keluar']
    }
  },
  Kelas: {
    sheetName: 'Kelas',
    columns: ['ID_KELAS', 'NAMA_KELAS', 'WALI_KELAS'],
    requiredColumns: ['ID_KELAS', 'NAMA_KELAS'],
    primaryKey: 'ID_KELAS'
  },
  Mapel: {
    sheetName: 'Mapel',
    columns: ['ID_MAPEL', 'NAMA_MATA_PELAJARAN'],
    requiredColumns: ['ID_MAPEL', 'NAMA_MATA_PELAJARAN'],
    primaryKey: 'ID_MAPEL'
  },
  Presensi: {
    sheetName: 'Presensi',
    columns: ['TIMESTAMP', 'TANGGAL', 'GURU', 'MAPEL', 'KELAS', 'PERTEMUAN', 'NAMA_SISWA', 'STATUS', 'CATATAN'],
    requiredColumns: ['TANGGAL', 'GURU', 'MAPEL', 'KELAS', 'PERTEMUAN', 'NAMA_SISWA', 'STATUS'],
    allowedValues: {
      STATUS: ['Hadir', 'Izin', 'Sakit', 'Alpa']
    }
  },
  Nilai: {
    sheetName: 'Nilai',
    columns: ['TIMESTAMP', 'GURU', 'MAPEL', 'KELAS', 'JENIS_PENILAIAN', 'NAMA_PENILAIAN', 'NAMA_SISWA', 'NILAI'],
    requiredColumns: ['GURU', 'MAPEL', 'KELAS', 'JENIS_PENILAIAN', 'NAMA_PENILAIAN', 'NAMA_SISWA', 'NILAI'],
    allowedValues: {
      JENIS_PENILAIAN: ['Tugas', 'UH', 'PTS', 'PAS', 'Praktik', 'Project']
    }
  },
  Jurnal: {
    sheetName: 'Jurnal',
    columns: [
      'TIMESTAMP',
      'TANGGAL',
      'JAM',
      'GURU',
      'MAPEL',
      'KELAS',
      'MATERI',
      'TUJUAN_PEMBELAJARAN',
      'AKTIVITAS',
      'METODE',
      'MEDIA',
      'REFLEKSI',
      'CATATAN',
      'STATUS'
    ],
    requiredColumns: ['TANGGAL', 'JAM', 'GURU', 'MAPEL', 'KELAS', 'MATERI', 'STATUS'],
    allowedValues: {
      STATUS: ['Terlaksana', 'Sebagian', 'Tidak terlaksana']
    }
  }
};

// Interface Data Entity Types
export interface IGuru {
  ID_GURU: string;
  NAMA_GURU: string;
  USERNAME: string;
  PASSWORD?: string;
  MAPEL?: string;
}

export type StatusSiswa = 'Aktif' | 'Pindah' | 'Lulus' | 'Keluar';

export interface IStatusSiswaOption {
  value: StatusSiswa;
  label: string;
  badgeBg: string;
  dotBg: string;
}

export const STATUS_SISWA_OPTIONS: IStatusSiswaOption[] = [
  {
    value: 'Aktif',
    label: 'Aktif',
    badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40',
    dotBg: 'bg-emerald-500'
  },
  {
    value: 'Pindah',
    label: 'Pindah',
    badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40',
    dotBg: 'bg-amber-500'
  },
  {
    value: 'Lulus',
    label: 'Lulus',
    badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40',
    dotBg: 'bg-blue-500'
  },
  {
    value: 'Keluar',
    label: 'Keluar',
    badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/40',
    dotBg: 'bg-rose-500'
  }
];

export interface ISiswa {
  NISN: string;
  NAMA: string;
  KELAS: string;
  JENIS_KELAMIN: 'L' | 'P';
  STATUS?: StatusSiswa;
}

export interface IKelas {
  ID_KELAS: string;
  NAMA_KELAS: string;
  WALI_KELAS?: string;
}

export interface IMapel {
  ID_MAPEL: string;
  NAMA_MATA_PELAJARAN: string;
}

export interface IPresensi {
  _rowIndex?: number;
  TIMESTAMP?: string;
  TANGGAL: string;
  GURU: string;
  MAPEL: string;
  KELAS: string;
  PERTEMUAN: number | string;
  NAMA_SISWA: string;
  STATUS: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  CATATAN?: string;
  TAHUN_PELAJARAN?: string;
  SEMESTER?: 'Ganjil' | 'Genap';
}

export interface INilai {
  _rowIndex?: number;
  TIMESTAMP?: string;
  TANGGAL?: string;
  GURU: string;
  MAPEL: string;
  KELAS: string;
  JENIS_PENILAIAN: 'Tugas' | 'UH' | 'PTS' | 'PAS' | 'Praktik' | 'Project';
  NAMA_PENILAIAN: string;
  NAMA_SISWA: string;
  NILAI: number;
  TAHUN_PELAJARAN?: string;
  SEMESTER?: 'Ganjil' | 'Genap';
  CATATAN?: string;
}

export interface IJurnal {
  _rowIndex?: number;
  TIMESTAMP?: string;
  TANGGAL: string;
  JAM: string;
  GURU: string;
  MAPEL: string;
  KELAS: string;
  MATERI: string;
  TUJUAN_PEMBELAJARAN?: string;
  AKTIVITAS?: string;
  METODE?: string;
  MEDIA?: string;
  REFLEKSI?: string;
  CATATAN?: string;
  STATUS: 'Terlaksana' | 'Sebagian' | 'Tidak terlaksana';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Authentication & Session Types
export type UserRole = 'admin' | 'guru' | 'guest';

export interface IAuthUser {
  ID_GURU: string;
  NAMA_GURU: string;
  USERNAME: string;
  MAPEL?: string;
  role: UserRole;
  adminRole?: 'superadmin' | 'admin';
  isSuperAdmin?: boolean;
}

export interface IAdminAccount {
  ID_ADMIN: string;
  USERNAME: string;
  NAMA_LENGKAP: string;
  PASSWORD?: string;
  EMAIL?: string;
  ROLE: 'superadmin' | 'admin';
  CREATED_AT: string;
  LAST_LOGIN?: string;
  STATUS: 'aktif' | 'nonaktif';
}

export interface ISessionData {
  token: string;
  user: IAuthUser;
  expiresInMs: number;
}

