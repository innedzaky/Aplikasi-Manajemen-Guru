/**
 * =========================================================================
 * dateUtils.ts - Standarisasi Format Tanggal & Waktu Bahasa Indonesia
 * Format: DD/MM/YYYY ; HH:mm WIB (atau WITA / WIT sesuai sistem lokal)
 * =========================================================================
 */

/**
 * Mendapatkan singkatan zona waktu lokal sistem (WIB, WITA, WIT, atau GMT+X)
 */
export function getLocalTimezoneAbbr(): string {
  try {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;

    if (offsetHours === 7) return 'WIB';
    if (offsetHours === 8) return 'WITA';
    if (offsetHours === 9) return 'WIT';

    // Cek format nama zona sistem via Intl
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone.includes('Jakarta') || timeZone.includes('Pontianak') || timeZone.includes('Bangkok') || timeZone.includes('Asia/Jakarta')) {
      return 'WIB';
    }
    if (timeZone.includes('Makassar') || timeZone.includes('Bali') || timeZone.includes('Singapore') || timeZone.includes('Asia/Makassar')) {
      return 'WITA';
    }
    if (timeZone.includes('Jayapura') || timeZone.includes('Tokyo') || timeZone.includes('Asia/Jayapura')) {
      return 'WIT';
    }

    if (offsetHours >= 0) {
      return `GMT+${offsetHours}`;
    }
    return `GMT${offsetHours}`;
  } catch {
    return 'WIB';
  }
}

/**
 * Mem-parse input string/Date tanggal dari berbagai format
 * (termasuk format Google Apps Script / Google Spreadsheet Date string)
 */
export function parseDateSafe(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === '-' || trimmed === 'undefined' || trimmed === 'null') return null;

    // 1. Cek format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    // 2. Cek format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/').map(Number);
      return new Date(y, m - 1, d);
    }

    // 3. Coba standard Date parse (termasuk "Mon Aug 17 2026 00:00:00 GMT+0700 ...")
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Format tanggal ke standar Indonesia: DD/MM/YYYY ; HH:mm WIB
 * @param input Tanggal (string, Date, atau timestamp)
 * @param options Konfigurasi format
 *   - showTime: true (selalu tampilkan jam), false (hanya tanggal), 'auto' (jika ada jam non-nol atau timestamp penuh)
 *   - defaultTime: jam default jika input hanya tanggal dan showTime diaktifkan (misal '00:00')
 */
export function formatIndoDate(
  input: any,
  options?: {
    showTime?: boolean | 'auto';
    customTime?: string;
  }
): string {
  if (!input && input !== 0) return '-';

  const rawStr = String(input).trim();
  const dateObj = parseDateSafe(input);

  if (!dateObj) {
    return rawStr || '-';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const tz = getLocalTimezoneAbbr();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes} ${tz}`;

  const showTime = options?.showTime ?? 'auto';

  // Jika dipaksa tampil waktu
  if (showTime === true) {
    if (options?.customTime) {
      return `${dateFormatted} ; ${options.customTime} ${tz}`;
    }
    return `${dateFormatted} ; ${timeFormatted}`;
  }

  // Jika tidak tampil waktu
  if (showTime === false) {
    return dateFormatted;
  }

  // Mode 'auto':
  // Jika rawStr memiliki indikator jam (seperti GMT, ISO T, atau jam bukan 00:00)
  const hasTimeIndicator =
    rawStr.includes('GMT') ||
    rawStr.includes('T') ||
    rawStr.includes(':') ||
    dateObj.getHours() !== 0 ||
    dateObj.getMinutes() !== 0;

  if (hasTimeIndicator && (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || rawStr.includes(':'))) {
    return `${dateFormatted} ; ${timeFormatted}`;
  }

  return dateFormatted;
}

/**
 * Format tanggal singkat: DD/MM/YYYY (contoh: 17/08/2026)
 */
export function formatIndoDateOnly(input: any): string {
  return formatIndoDate(input, { showTime: false });
}

/**
 * Format tanggal lengkap dengan jam & zona: DD/MM/YYYY ; HH:mm WIB
 */
export function formatIndoDateTime(input: any): string {
  return formatIndoDate(input, { showTime: true });
}
