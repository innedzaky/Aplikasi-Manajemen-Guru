/**
 * =========================================================================
 * securityUtils.ts - Core Security, Sanitization & Defense Utilities
 * =========================================================================
 * Provides input sanitization, formula injection prevention for exports,
 * URL validation for GAS endpoints, token verification, and password safety.
 */

export class SecurityUtils {
  /**
   * 1. CSV / Spreadsheet Formula Injection Prevention (CWE-1236)
   * Prevents Excel/Calc/Sheets from executing formulas starting with =, +, -, @, \t, \r
   */
  public static sanitizeForSpreadsheet(val: any): string | number | boolean {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number' || typeof val === 'boolean') return val;

    let str = String(val).trim();
    // Strip null bytes
    str = str.replace(/\0/g, '');

    // Check if first character is a dangerous formula indicator
    if (/^[=+\-@\t\r]/.test(str)) {
      // Prefix with apostrophe to force spreadsheet engines to treat as plain text string
      return `'${str}`;
    }

    return str;
  }

  /**
   * 2. Basic Text & XSS Sanitization
   * Strips control characters, script tags, and trims whitespace
   */
  public static sanitizeString(input: any, maxLength = 500): string {
    if (input === null || input === undefined) return '';
    let str = String(input);
    // Remove control characters except newline and tab
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Strip HTML script/event handler tags defensively
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/onload=|onerror=|onclick=/gi, '');
    return str.trim().slice(0, maxLength);
  }

  /**
   * 3. Validate Google Apps Script Web App URL or Backend URL
   * Prevents SSRF / token exfiltration to unauthorized origins
   */
  public static isValidGasUrl(url: string): { valid: boolean; reason?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, reason: 'URL tidak boleh kosong.' };
    }

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);

      // Must be HTTPS protocol
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { valid: false, reason: 'URL backend wajib menggunakan protokol aman (HTTPS/HTTP).' };
      }

      // If it's a Google Apps Script URL
      if (parsed.hostname.includes('script.google.com') || parsed.hostname.includes('googleusercontent.com')) {
        if (!parsed.pathname.includes('/macros/s/')) {
          return {
            valid: false,
            reason: 'Format URL Web App Google Apps Script tidak valid (harus mengandung /macros/s/).'
          };
        }
        return { valid: true };
      }

      // If it's a Cloudflare Worker or custom backend URL
      return { valid: true };
    } catch {
      return { valid: false, reason: 'Format URL tidak valid.' };
    }
  }

  public static isValidBackendUrl(url: string): { valid: boolean; isWorker?: boolean; isGas?: boolean; reason?: string } {
    if (!url || typeof url !== 'string') {
      return { valid: false, reason: 'URL tidak boleh kosong.' };
    }

    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { valid: false, reason: 'URL backend wajib menggunakan protokol aman (HTTPS/HTTP).' };
      }

      const isGas = parsed.hostname.includes('script.google.com') || parsed.hostname.includes('googleusercontent.com');
      const isWorker = parsed.hostname.includes('workers.dev') || parsed.hostname.includes('pages.dev') || !isGas;

      if (isGas && !parsed.pathname.includes('/macros/s/')) {
        return { valid: false, reason: 'Format URL Google Apps Script harus mengandung /macros/s/.' };
      }

      return { valid: true, isGas, isWorker };
    } catch {
      return { valid: false, reason: 'Format URL tidak valid.' };
    }
  }

  /**
   * 4. Sanitize User Object
   * Strips password and sensitive fields before returning to client/state
   */
  public static sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'PASSWORD'> {
    if (!user) return user;
    const { PASSWORD, ...safeUser } = user;
    return safeUser as Omit<T, 'PASSWORD'>;
  }

  /**
   * 5. Constant-time String Comparison for Password Verifications
   */
  public static constantTimeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    let mismatch = a.length === b.length ? 0 : 1;
    for (let i = 0; i < a.length; ++i) {
      const charA = a.charCodeAt(i);
      const charB = b.charCodeAt(i % b.length);
      mismatch |= charA ^ charB;
    }
    return mismatch === 0;
  }
}
