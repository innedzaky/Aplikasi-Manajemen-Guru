/**
 * =========================================================================
 * filterUtils.ts - Reusable Search and Multi-Criteria Filtering Engine
 * =========================================================================
 * Single source of truth for unified filtering logic across all modules:
 * Presensi, Nilai, Jurnal, Master Guru, Master Siswa, Master Kelas, and Mapel.
 */

import { parseDateSafe } from './dateUtils.ts';

export interface CommonFilterCriteria {
  search?: string;
  searchFields?: string[];
  tanggal?: string;
  startDate?: string;
  endDate?: string;
  guru?: string;
  kelas?: string;
  mapel?: string;
  semester?: string;
  tahunPelajaran?: string;
  jenisPenilaian?: string;
  status?: string;
  jenisKelamin?: string;
  tingkat?: string;
  pertemuan?: string | number;
  rentangNilai?: string;
  [key: string]: any;
}

/**
 * Standard Academic Years
 */
export const STANDARD_TAHUN_PELAJARAN = [
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028'
] as const;

/**
 * Standard Semesters
 */
export const STANDARD_SEMESTER = ['Ganjil', 'Genap'] as const;

/**
 * Standard Assessment Types (Jenis Penilaian)
 */
export const STANDARD_JENIS_PENILAIAN = [
  'Tugas',
  'UH',
  'PTS',
  'PAS',
  'Praktik',
  'Project'
] as const;

/**
 * Standard Attendance Statuses
 */
export const STANDARD_STATUS_PRESENSI = [
  'Hadir',
  'Izin',
  'Sakit',
  'Alpa'
] as const;

/**
 * Standard Journal Statuses
 */
export const STANDARD_STATUS_JURNAL = [
  'Terlaksana',
  'Sebagian',
  'Tidak terlaksana'
] as const;

/**
 * Checks if a search query matches any of the specified object fields
 */
export function matchSearchQuery<T extends Record<string, any>>(
  item: T,
  query: string,
  fields: (keyof T | string)[]
): boolean {
  if (!query || !query.trim()) return true;
  const normalizedQuery = query.trim().toLowerCase();

  return fields.some((field) => {
    const val = item[field as keyof T];
    if (val === undefined || val === null) return false;
    return String(val).toLowerCase().includes(normalizedQuery);
  });
}

/**
 * Checks if an item's property matches a filter criteria value (exact or case-insensitive)
 * Handles 'ALL', '', and undefined as "no filter applied" (returns true)
 */
export function matchSelectFilter(
  itemValue: string | number | undefined | null,
  filterValue: string | number | undefined | null
): boolean {
  if (
    filterValue === undefined ||
    filterValue === null ||
    filterValue === '' ||
    filterValue === 'ALL' ||
    filterValue === 'Semua'
  ) {
    return true;
  }

  if (itemValue === undefined || itemValue === null) {
    return false;
  }

  const strItem = String(itemValue).trim().toLowerCase();
  const strFilter = String(filterValue).trim().toLowerCase();

  return strItem === strFilter;
}

/**
 * Checks date equality or date range
 */
export function matchDateCriteria(
  itemDateStr: string | undefined | null,
  criteria: {
    exactDate?: string;
    startDate?: string;
    endDate?: string;
  }
): boolean {
  if (!criteria.exactDate && !criteria.startDate && !criteria.endDate) {
    return true;
  }
  if (!itemDateStr) return false;

  const itemDateObj = parseDateSafe(itemDateStr);
  if (!itemDateObj) return false;

  const itemYear = itemDateObj.getFullYear();
  const itemMonth = String(itemDateObj.getMonth() + 1).padStart(2, '0');
  const itemDay = String(itemDateObj.getDate()).padStart(2, '0');
  const cleanItemDate = `${itemYear}-${itemMonth}-${itemDay}`;

  // 1. Exact Date Matching
  if (criteria.exactDate && criteria.exactDate.trim()) {
    const exactDateObj = parseDateSafe(criteria.exactDate);
    const cleanExact = exactDateObj
      ? `${exactDateObj.getFullYear()}-${String(exactDateObj.getMonth() + 1).padStart(2, '0')}-${String(exactDateObj.getDate()).padStart(2, '0')}`
      : criteria.exactDate.trim();
    if (cleanItemDate !== cleanExact) return false;
  }

  // 2. Range Matching
  if (criteria.startDate && criteria.startDate.trim()) {
    const startObj = parseDateSafe(criteria.startDate);
    const cleanStart = startObj
      ? `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, '0')}-${String(startObj.getDate()).padStart(2, '0')}`
      : criteria.startDate.trim();
    if (cleanItemDate < cleanStart) return false;
  }

  if (criteria.endDate && criteria.endDate.trim()) {
    const endObj = parseDateSafe(criteria.endDate);
    const cleanEnd = endObj
      ? `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`
      : criteria.endDate.trim();
    if (cleanItemDate > cleanEnd) return false;
  }

  return true;
}

/**
 * Checks score range category
 * A: 90 - 100
 * B: 80 - 89
 * C: 75 - 79
 * D: < 75 (Remedial)
 */
export function matchRentangNilai(
  score: number | string | undefined | null,
  rangeCategory: string | undefined | null
): boolean {
  if (!rangeCategory || rangeCategory === 'ALL' || rangeCategory === 'Semua') {
    return true;
  }
  if (score === undefined || score === null) return false;
  const num = typeof score === 'number' ? score : parseFloat(String(score));
  if (isNaN(num)) return false;

  switch (rangeCategory.toUpperCase()) {
    case 'A':
      return num >= 90;
    case 'B':
      return num >= 80 && num < 90;
    case 'C':
      return num >= 75 && num < 80;
    case 'D':
      return num < 75;
    case 'TUNTAS':
      return num >= 75;
    case 'REMEDIAL':
      return num < 75;
    default:
      return true;
  }
}

/**
 * Generic Reusable Filter Engine
 */
export function filterRecords<T extends Record<string, any>>(
  records: T[],
  filters: CommonFilterCriteria,
  defaultSearchFields: (keyof T | string)[] = []
): T[] {
  if (!records || !records.length) return [];

  const searchFields = filters.searchFields && filters.searchFields.length > 0
    ? filters.searchFields
    : defaultSearchFields;

  return records.filter((item) => {
    // 1. Search Query
    if (filters.search && searchFields.length > 0) {
      if (!matchSearchQuery(item, filters.search, searchFields)) {
        return false;
      }
    }

    // 2. Tanggal (Exact or Range)
    if (filters.tanggal || filters.startDate || filters.endDate) {
      const itemDate = item.TANGGAL || item.tanggal || item.TIMESTAMP || item.timestamp;
      if (!matchDateCriteria(itemDate, {
        exactDate: filters.tanggal,
        startDate: filters.startDate,
        endDate: filters.endDate
      })) {
        return false;
      }
    }

    // 3. Guru
    if (filters.guru !== undefined && filters.guru !== 'ALL' && filters.guru !== '') {
      const itemGuru = item.GURU || item.NAMA_GURU || item.WALI_KELAS || item.guru;
      if (!matchSelectFilter(itemGuru, filters.guru)) {
        return false;
      }
    }

    // 4. Kelas
    if (filters.kelas !== undefined && filters.kelas !== 'ALL' && filters.kelas !== '') {
      const itemKelas = item.KELAS || item.NAMA_KELAS || item.kelas;
      if (!matchSelectFilter(itemKelas, filters.kelas)) {
        return false;
      }
    }

    // 5. Mapel
    if (filters.mapel !== undefined && filters.mapel !== 'ALL' && filters.mapel !== '') {
      const itemMapel = item.MAPEL || item.NAMA_MATA_PELAJARAN || item.mapel;
      if (!matchSelectFilter(itemMapel, filters.mapel)) {
        return false;
      }
    }

    // 6. Semester
    if (filters.semester !== undefined && filters.semester !== 'ALL' && filters.semester !== '') {
      const itemSemester = item.SEMESTER || item.semester;
      if (itemSemester && !matchSelectFilter(itemSemester, filters.semester)) {
        return false;
      }
    }

    // 7. Tahun Pelajaran
    if (filters.tahunPelajaran !== undefined && filters.tahunPelajaran !== 'ALL' && filters.tahunPelajaran !== '') {
      const itemTP = item.TAHUN_PELAJARAN || item.tahunPelajaran;
      if (itemTP && !matchSelectFilter(itemTP, filters.tahunPelajaran)) {
        return false;
      }
    }

    // 8. Jenis Penilaian
    if (filters.jenisPenilaian !== undefined && filters.jenisPenilaian !== 'ALL' && filters.jenisPenilaian !== '') {
      const itemJenis = item.JENIS_PENILAIAN || item.jenisPenilaian;
      if (!matchSelectFilter(itemJenis, filters.jenisPenilaian)) {
        return false;
      }
    }

    // 9. Status (Presensi / Jurnal)
    if (filters.status !== undefined && filters.status !== 'ALL' && filters.status !== '') {
      const itemStatus = item.STATUS || item.status;
      if (!matchSelectFilter(itemStatus, filters.status)) {
        return false;
      }
    }

    // 10. Jenis Kelamin (Siswa)
    if (filters.jenisKelamin !== undefined && filters.jenisKelamin !== 'ALL' && filters.jenisKelamin !== '') {
      const itemJK = item.JENIS_KELAMIN || item.jenisKelamin;
      if (!matchSelectFilter(itemJK, filters.jenisKelamin)) {
        return false;
      }
    }

    // 11. Tingkat Kelas (X, XI, XII)
    if (filters.tingkat !== undefined && filters.tingkat !== 'ALL' && filters.tingkat !== '') {
      const itemKelasName = String(item.KELAS || item.NAMA_KELAS || '');
      const cleanTingkat = filters.tingkat.trim().toUpperCase();
      // Match beginning of class name e.g. "X TKJ 1" starts with "X "
      const regex = new RegExp(`^${cleanTingkat}\\b`, 'i');
      if (!regex.test(itemKelasName.trim())) {
        return false;
      }
    }

    // 12. Pertemuan
    if (filters.pertemuan !== undefined && filters.pertemuan !== 'ALL' && filters.pertemuan !== '') {
      const itemPertemuan = item.PERTEMUAN || item.pertemuan;
      if (String(itemPertemuan) !== String(filters.pertemuan)) {
        return false;
      }
    }

    // 13. Rentang Nilai
    if (filters.rentangNilai !== undefined && filters.rentangNilai !== 'ALL' && filters.rentangNilai !== '') {
      const itemScore = item.NILAI !== undefined ? item.NILAI : item.nilai;
      if (!matchRentangNilai(itemScore, filters.rentangNilai)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extract unique non-empty string values from dataset
 */
export function extractUniqueOptions<T extends Record<string, any>>(
  data: T[],
  key: keyof T
): string[] {
  if (!data || !data.length) return [];
  const set = new Set<string>();
  data.forEach((item) => {
    const val = item[key];
    if (val !== undefined && val !== null && String(val).trim()) {
      set.add(String(val).trim());
    }
  });
  return Array.from(set).sort();
}
