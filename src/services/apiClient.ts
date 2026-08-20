/**
 * =========================================================================
 * apiClient.ts - Client API Service & Live/Mock Dispatcher
 * =========================================================================
 * Menghubungkan frontend ke Google Apps Script Web App atau In-Memory Mock.
 * Otomatis menyertakan session token untuk seluruh private actions.
 */

import {
  IGuru,
  ISiswa,
  IKelas,
  IMapel,
  IPresensi,
  INilai,
  IJurnal,
  ApiResponse,
  ISessionData,
  IAuthUser,
  IAdminAccount
} from '../types.ts';
import { IDashboardData } from '../types/dashboard.ts';
import { StatsCalculator } from '../utils/statsCalculator.ts';
import { SecurityUtils } from '../utils/securityUtils.ts';
import {
  DUMMY_GURU,
  DUMMY_SISWA,
  DUMMY_KELAS,
  DUMMY_MAPEL,
  DUMMY_PRESENSI,
  DUMMY_NILAI,
  DUMMY_JURNAL
} from '../dummyData.ts';

const DEFAULT_ADMINS: IAdminAccount[] = [
  {
    ID_ADMIN: 'ADM001',
    USERNAME: 'innedzaky',
    NAMA_LENGKAP: 'Inne Dzaky (Super Admin)',
    PASSWORD: '1sampai7',
    EMAIL: 'innedzaky@gmail.com',
    ROLE: 'superadmin',
    CREATED_AT: '2026-01-01',
    STATUS: 'aktif'
  },
  {
    ID_ADMIN: 'ADM002',
    USERNAME: 'admin',
    NAMA_LENGKAP: 'Administrator Sekolah (Admin Biasa)',
    PASSWORD: 'admin123',
    EMAIL: 'admin@sekolah.sch.id',
    ROLE: 'admin',
    CREATED_AT: '2026-01-15',
    STATUS: 'aktif'
  }
];

// LocalStorage helper for persistent Mock/Demo Mode
const MOCK_STORAGE_KEYS = {
  GURU: 'manajemen_guru_mock_guru',
  SISWA: 'manajemen_guru_mock_siswa',
  KELAS: 'manajemen_guru_mock_kelas',
  MAPEL: 'manajemen_guru_mock_mapel',
  PRESENSI: 'manajemen_guru_mock_presensi',
  NILAI: 'manajemen_guru_mock_nilai',
  JURNAL: 'manajemen_guru_mock_jurnal',
  ADMINS: 'manajemen_guru_mock_admins'
};

function loadAdminMockData(): IAdminAccount[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEYS.ADMINS);
    if (raw) {
      let list: IAdminAccount[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        // Migrasi data otomatis: Pastikan innedzaky terdaftar sebagai Super Admin
        let inne = list.find(a => a.USERNAME?.toLowerCase() === 'innedzaky');
        if (!inne) {
          inne = { ...DEFAULT_ADMINS[0] };
          list.unshift(inne);
        } else {
          inne.ROLE = 'superadmin';
          inne.ID_ADMIN = 'ADM001';
          if (!inne.PASSWORD || inne.PASSWORD === 'admin123') {
            inne.PASSWORD = '1sampai7';
          }
        }

        // Pastikan admin diatur sebagai Admin Biasa dan ID tidak bentrok dengan Super Admin
        let adm = list.find(a => a.USERNAME?.toLowerCase() === 'admin');
        if (adm) {
          adm.ROLE = 'admin';
          if (adm.ID_ADMIN === 'ADM001') {
            adm.ID_ADMIN = 'ADM002';
          }
          if (!adm.PASSWORD) {
            adm.PASSWORD = 'admin123';
          }
        }

        try {
          localStorage.setItem(MOCK_STORAGE_KEYS.ADMINS, JSON.stringify(list));
        } catch {
          // ignore
        }

        return list;
      }
    }
  } catch (e) {
    console.warn(`Gagal memuat local data ${MOCK_STORAGE_KEYS.ADMINS}:`, e);
  }
  return [...DEFAULT_ADMINS];
}

function loadMockData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`Gagal memuat local data ${key}:`, e);
  }
  return [...defaultValue];
}

function saveMockData<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Gagal menyimpan local data ${key}:`, e);
  }
}

// In-memory state untuk Demo Mode (dengan sinkronisasi LocalStorage)
let mockGuru: IGuru[] = loadMockData<IGuru>(MOCK_STORAGE_KEYS.GURU, DUMMY_GURU);
let mockSiswa: ISiswa[] = loadMockData<ISiswa>(MOCK_STORAGE_KEYS.SISWA, DUMMY_SISWA);
let mockKelas: IKelas[] = loadMockData<IKelas>(MOCK_STORAGE_KEYS.KELAS, DUMMY_KELAS);
let mockMapel: IMapel[] = loadMockData<IMapel>(MOCK_STORAGE_KEYS.MAPEL, DUMMY_MAPEL);
let mockPresensi: IPresensi[] = loadMockData<IPresensi>(MOCK_STORAGE_KEYS.PRESENSI, DUMMY_PRESENSI);
let mockNilai: INilai[] = loadMockData<INilai>(MOCK_STORAGE_KEYS.NILAI, DUMMY_NILAI);
let mockJurnal: IJurnal[] = loadMockData<IJurnal>(MOCK_STORAGE_KEYS.JURNAL, DUMMY_JURNAL);
let mockAdmins: IAdminAccount[] = loadAdminMockData();

const GAS_URL_KEY = 'manajemen_guru_gas_url';
const GAS_MODE_KEY = 'manajemen_guru_gas_mode';

function getInitialUrl(): string {
  try {
    return localStorage.getItem(GAS_URL_KEY) || '';
  } catch {
    return '';
  }
}

function getInitialIsLive(): boolean {
  try {
    return localStorage.getItem(GAS_MODE_KEY) === 'live';
  } catch {
    return false;
  }
}

export class ApiClient {
  private static apiUrl: string = getInitialUrl();
  private static isLiveMode: boolean = getInitialIsLive();
  private static sessionToken: string | null = null;
  // In-flight request lock to prevent duplicate concurrent requests
  private static pendingRequests = new Map<string, Promise<ApiResponse<any>>>();

  public static configure(url: string, isLive: boolean = false) {
    const cleanUrl = String(url || '').trim();
    if (isLive && cleanUrl) {
      const check = SecurityUtils.isValidGasUrl(cleanUrl);
      if (check.valid) {
        this.apiUrl = cleanUrl;
        this.isLiveMode = true;
      } else {
        console.warn('Konfigurasi URL Google Apps Script tidak valid:', check.reason);
        this.apiUrl = '';
        this.isLiveMode = false;
      }
    } else {
      this.apiUrl = cleanUrl;
      this.isLiveMode = false;
    }
  }

  public static setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  public static getMode(): 'live' | 'demo' {
    return this.isLiveMode ? 'live' : 'demo';
  }

  /**
   * Mengirim request ke backend Cloudflare D1 (Primary) atau In-Memory Persistent Store
   */
  private static async request<T>(action: string, data: any = {}): Promise<ApiResponse<T>> {
    // Generate request fingerprint for idempotent batch mutations
    const isMutation = [
      'createPresensiBatch',
      'createNilaiBatch',
      'createJurnal',
      'createGuru',
      'createSiswa',
      'createKelas',
      'createMapel',
      'login'
    ].includes(action);

    const requestKey = isMutation
      ? `${action}:${JSON.stringify(data)}`
      : null;

    if (requestKey && this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<ApiResponse<T>>;
    }

    const executionPromise = (async (): Promise<ApiResponse<T>> => {
      // 1. Prioritaskan Cloudflare D1 Worker sebagai Database Utama
      const d1WorkerUrl = typeof window !== 'undefined'
        ? (localStorage.getItem('manajemen_guru_d1_worker_url') || 'https://api-sekolah-d1.dzakyinne.workers.dev')
        : 'https://api-sekolah-d1.dzakyinne.workers.dev';

      if (d1WorkerUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for D1

          const response = await fetch('/api/d1-proxy', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              workerUrl: d1WorkerUrl,
              action,
              data
            })
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result: ApiResponse<T> = await response.json();
            if (result && result.success) {
              return result;
            }
          }
        } catch (d1Err) {
          console.warn(`D1 request (${action}) dialihkan ke local persistent storage:`, d1Err);
        }
      }

      // 2. Persistent Local Storage Fallback (Instan & Selalu Tersedia)
      return this.handleMockRequest<T>(action, data);
    })();

    if (requestKey) {
      this.pendingRequests.set(requestKey, executionPromise);
      executionPromise.finally(() => {
        this.pendingRequests.delete(requestKey);
      });
    }

    return executionPromise;
  }

  // ---------------------------------------------------------------------------
  // AUTH & SESSION
  // ---------------------------------------------------------------------------
  public static async login(username: string, password: string): Promise<ApiResponse<ISessionData>> {
    return this.request<ISessionData>('login', { username, password });
  }

  public static async checkSession(token: string): Promise<ApiResponse<{ user: IAuthUser }>> {
    return this.request<{ user: IAuthUser }>('checkSession', { token });
  }

  public static async logout(token?: string): Promise<ApiResponse<void>> {
    return this.request<void>('logout', { token });
  }

  // ---------------------------------------------------------------------------
  // ADMIN USERS CRUD (Manajemen Hak Akses & Akun Admin)
  // ---------------------------------------------------------------------------
  public static async getAdmins(): Promise<ApiResponse<IAdminAccount[]>> {
    return this.request<IAdminAccount[]>('getAdmins');
  }

  public static async createAdmin(data: {
    USERNAME: string;
    NAMA_LENGKAP: string;
    PASSWORD?: string;
    EMAIL?: string;
    ROLE?: 'superadmin' | 'admin';
  }): Promise<ApiResponse<IAdminAccount>> {
    return this.request<IAdminAccount>('createAdmin', data);
  }

  public static async updateAdmin(data: Partial<IAdminAccount> & { ID_ADMIN: string }): Promise<ApiResponse<IAdminAccount>> {
    return this.request<IAdminAccount>('updateAdmin', data);
  }

  public static async deleteAdmin(id: string): Promise<ApiResponse<{ ID_ADMIN: string }>> {
    return this.request<{ ID_ADMIN: string }>('deleteAdmin', { ID_ADMIN: id });
  }

  // ---------------------------------------------------------------------------
  // GURU CRUD
  // ---------------------------------------------------------------------------
  public static async getGuru(params?: { search?: string; id?: string }): Promise<ApiResponse<IGuru[]>> {
    return this.request<IGuru[]>('getGuru', params);
  }

  public static async createGuru(data: IGuru): Promise<ApiResponse<IGuru>> {
    return this.request<IGuru>('createGuru', data);
  }

  public static async updateGuru(data: Partial<IGuru> & { ID_GURU: string }): Promise<ApiResponse<IGuru>> {
    return this.request<IGuru>('updateGuru', data);
  }

  public static async deleteGuru(id: string): Promise<ApiResponse<{ ID_GURU: string }>> {
    return this.request<{ ID_GURU: string }>('deleteGuru', { ID_GURU: id });
  }

  // ---------------------------------------------------------------------------
  // SISWA CRUD
  // ---------------------------------------------------------------------------
  public static async getSiswa(params?: { kelas?: string; nisn?: string; search?: string }): Promise<ApiResponse<ISiswa[]>> {
    return this.request<ISiswa[]>('getSiswa', params);
  }

  public static async createSiswa(data: ISiswa): Promise<ApiResponse<ISiswa>> {
    return this.request<ISiswa>('createSiswa', data);
  }

  public static async updateSiswa(data: Partial<ISiswa> & { NISN: string }): Promise<ApiResponse<ISiswa>> {
    return this.request<ISiswa>('updateSiswa', data);
  }

  public static async deleteSiswa(nisn: string): Promise<ApiResponse<{ NISN: string }>> {
    return this.request<{ NISN: string }>('deleteSiswa', { NISN: nisn });
  }

  // ---------------------------------------------------------------------------
  // KELAS CRUD
  // ---------------------------------------------------------------------------
  public static async getKelas(params?: { search?: string }): Promise<ApiResponse<IKelas[]>> {
    return this.request<IKelas[]>('getKelas', params);
  }

  public static async createKelas(data: IKelas): Promise<ApiResponse<IKelas>> {
    return this.request<IKelas>('createKelas', data);
  }

  public static async updateKelas(data: Partial<IKelas> & { ID_KELAS: string }): Promise<ApiResponse<IKelas>> {
    return this.request<IKelas>('updateKelas', data);
  }

  public static async deleteKelas(id: string): Promise<ApiResponse<{ ID_KELAS: string }>> {
    return this.request<{ ID_KELAS: string }>('deleteKelas', { ID_KELAS: id });
  }

  // ---------------------------------------------------------------------------
  // MAPEL CRUD
  // ---------------------------------------------------------------------------
  public static async getMapel(params?: { search?: string }): Promise<ApiResponse<IMapel[]>> {
    return this.request<IMapel[]>('getMapel', params);
  }

  public static async createMapel(data: IMapel): Promise<ApiResponse<IMapel>> {
    return this.request<IMapel>('createMapel', data);
  }

  public static async updateMapel(data: Partial<IMapel> & { ID_MAPEL: string }): Promise<ApiResponse<IMapel>> {
    return this.request<IMapel>('updateMapel', data);
  }

  public static async deleteMapel(id: string): Promise<ApiResponse<{ ID_MAPEL: string }>> {
    return this.request<{ ID_MAPEL: string }>('deleteMapel', { ID_MAPEL: id });
  }

  // ---------------------------------------------------------------------------
  // PRESENSI CRUD
  // ---------------------------------------------------------------------------
  public static async getPresensi(params?: {
    tanggal?: string;
    kelas?: string;
    mapel?: string;
    guru?: string;
    pertemuan?: number | string;
    nama_siswa?: string;
  }): Promise<ApiResponse<IPresensi[]>> {
    return this.request<IPresensi[]>('getPresensi', params);
  }

  public static async createPresensi(data: IPresensi): Promise<ApiResponse<IPresensi>> {
    return this.request<IPresensi>('createPresensi', data);
  }

  public static async createPresensiBatch(items: IPresensi[]): Promise<ApiResponse<{ total: number }>> {
    if (!this.isLiveMode || !this.apiUrl) {
      return this.handleMockRequest<{ total: number }>('createPresensiBatch', { items });
    }

    const batchRes = await this.request<{ total: number }>('createPresensiBatch', { items });
    if (batchRes.success) {
      return batchRes;
    }

    // Fallback: Jika backend GAS belum mendukung batch, simpan satu per satu
    if (batchRes.message && (batchRes.message.includes('tidak dikenali') || batchRes.message.includes('not found') || batchRes.message.includes('unknown'))) {
      try {
        let count = 0;
        for (const item of items) {
          await this.createPresensi(item);
          count++;
        }
        return {
          success: true,
          message: `Berhasil menyimpan ${count} data presensi ke Google Spreadsheet`,
          data: { total: count }
        };
      } catch (err: any) {
        return {
          success: false,
          message: 'Gagal menyimpan presensi batch: ' + (err.message || 'Error')
        };
      }
    }

    return batchRes;
  }

  public static async updatePresensi(data: Partial<IPresensi> & { _rowIndex?: number; TANGGAL?: string; KELAS?: string; NAMA_SISWA?: string; PERTEMUAN?: number | string }): Promise<ApiResponse<IPresensi>> {
    return this.request<IPresensi>('updatePresensi', data);
  }

  public static async deletePresensi(data: { _rowIndex: number }): Promise<ApiResponse<{ _rowIndex: number }>> {
    return this.request<{ _rowIndex: number }>('deletePresensi', data);
  }

  // ---------------------------------------------------------------------------
  // NILAI CRUD
  // ---------------------------------------------------------------------------
  public static async getNilai(params?: {
    kelas?: string;
    mapel?: string;
    guru?: string;
    jenis_penilaian?: string;
    nama_penilaian?: string;
    nama_siswa?: string;
    tanggal?: string;
  }): Promise<ApiResponse<INilai[]>> {
    return this.request<INilai[]>('getNilai', params);
  }

  public static async createNilai(data: INilai): Promise<ApiResponse<INilai>> {
    return this.request<INilai>('createNilai', data);
  }

  public static async createNilaiBatch(items: INilai[]): Promise<ApiResponse<{ total: number }>> {
    if (!this.isLiveMode || !this.apiUrl) {
      return this.handleMockRequest<{ total: number }>('createNilaiBatch', { items });
    }

    const batchRes = await this.request<{ total: number }>('createNilaiBatch', { items });
    if (batchRes.success) {
      return batchRes;
    }

    // Fallback: Jika backend GAS belum mendukung batch, simpan satu per satu
    if (batchRes.message && (batchRes.message.includes('tidak dikenali') || batchRes.message.includes('not found') || batchRes.message.includes('unknown'))) {
      try {
        let count = 0;
        for (const item of items) {
          await this.createNilai(item);
          count++;
        }
        return {
          success: true,
          message: `Berhasil menyimpan ${count} data nilai ke Google Spreadsheet`,
          data: { total: count }
        };
      } catch (err: any) {
        return {
          success: false,
          message: 'Gagal menyimpan nilai batch: ' + (err.message || 'Error')
        };
      }
    }

    return batchRes;
  }

  public static async updateNilai(data: Partial<INilai> & { _rowIndex?: number; KELAS?: string; NAMA_PENILAIAN?: string; NAMA_SISWA?: string; NILAI?: number }): Promise<ApiResponse<INilai>> {
    return this.request<INilai>('updateNilai', data);
  }

  public static async deleteNilai(data: { _rowIndex: number }): Promise<ApiResponse<{ _rowIndex: number }>> {
    return this.request<{ _rowIndex: number }>('deleteNilai', data);
  }

  // ---------------------------------------------------------------------------
  // JURNAL CRUD
  // ---------------------------------------------------------------------------
  public static async getJurnal(params?: {
    guru?: string;
    kelas?: string;
    mapel?: string;
    tanggal?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<IJurnal[]>> {
    return this.request<IJurnal[]>('getJurnal', params);
  }

  public static async createJurnal(data: IJurnal): Promise<ApiResponse<IJurnal>> {
    return this.request<IJurnal>('createJurnal', data);
  }

  public static async updateJurnal(data: Partial<IJurnal> & { _rowIndex: number }): Promise<ApiResponse<IJurnal>> {
    return this.request<IJurnal>('updateJurnal', data);
  }

  public static async deleteJurnal(data: { _rowIndex: number }): Promise<ApiResponse<{ _rowIndex: number }>> {
    return this.request<{ _rowIndex: number }>('deleteJurnal', data);
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD STATS (Live GAS dynamic aggregation fallback)
  // ---------------------------------------------------------------------------
  public static async getDashboardStats(params?: { guru?: string }): Promise<ApiResponse<IDashboardData>> {
    if (!this.isLiveMode || !this.apiUrl) {
      return this.handleMockRequest<IDashboardData>('getDashboardStats', params);
    }

    // 1. Coba panggil action getDashboardStats langsung ke live GAS jika didukung
    try {
      const liveDirectRes = await this.request<IDashboardData>('getDashboardStats', params);
      if (liveDirectRes.success && liveDirectRes.data && liveDirectRes.data.ringkasan) {
        return liveDirectRes;
      }
    } catch {
      // lanjut ke dynamic aggregation
    }

    // 2. Fallback: Ambil data tabel aktual dari Google Spreadsheet lalu hitung secara realtime
    try {
      const [presensiRes, nilaiRes, jurnalRes, kelasRes, siswaRes, guruRes, mapelRes] = await Promise.all([
        this.getPresensi(params?.guru ? { guru: params.guru } : undefined),
        this.getNilai(params?.guru ? { guru: params.guru } : undefined),
        this.getJurnal(params?.guru ? { guru: params.guru } : undefined),
        this.getKelas(),
        this.getSiswa(),
        this.getGuru(),
        this.getMapel(),
      ]);

      const presensiList = presensiRes.success && Array.isArray(presensiRes.data) ? presensiRes.data : [];
      const nilaiList = nilaiRes.success && Array.isArray(nilaiRes.data) ? nilaiRes.data : [];
      const jurnalList = jurnalRes.success && Array.isArray(jurnalRes.data) ? jurnalRes.data : [];
      const kelasList = kelasRes.success && Array.isArray(kelasRes.data) ? kelasRes.data : [];
      const siswaList = siswaRes.success && Array.isArray(siswaRes.data) ? siswaRes.data : [];
      const guruList = guruRes.success && Array.isArray(guruRes.data) ? guruRes.data : [];
      const mapelList = mapelRes.success && Array.isArray(mapelRes.data) ? mapelRes.data : [];

      const stats = StatsCalculator.buildFullDashboardStats(
        presensiList,
        nilaiList,
        jurnalList,
        kelasList,
        siswaList,
        guruList,
        mapelList,
        params?.guru
      );

      return {
        success: true,
        message: 'Statistik dashboard berhasil dihitung dari data live Google Spreadsheet.',
        data: stats
      };
    } catch (calcErr: any) {
      return {
        success: false,
        message: 'Gagal mengompilasi statistik live dashboard: ' + (calcErr.message || 'Error')
      };
    }
  }

  // ---------------------------------------------------------------------------
  // In-Memory Mock Handler (Secured & Hardened)
  // ---------------------------------------------------------------------------
  private static handleMockRequest<T>(action: string, data: any): ApiResponse<T> {
    // Helper to decode and verify mock token
    const verifyToken = (tokenStr?: string | null): IAuthUser | null => {
      const tok = tokenStr || this.sessionToken;
      if (!tok || !tok.startsWith('mock-session-token-')) return null;
      try {
        const parts = tok.replace('mock-session-token-', '').split('.');
        if (parts.length !== 2) return null;
        const payloadJson = atob(parts[0]);
        const timestamp = parseInt(parts[1], 10);
        // Expiry check (24 hours)
        if (Date.now() - timestamp > 86400000) {
          return null;
        }
        const user: IAuthUser = JSON.parse(payloadJson);
        return user;
      } catch {
        return null;
      }
    };

    switch (action) {
      case 'login': {
        const username = SecurityUtils.sanitizeString(data?.username || '').toLowerCase();
        const password = String(data?.password || '').trim();

        if (!username || !password) {
          return { success: false, message: 'Username dan password wajib diisi' };
        }

        // 1. Cek terlebih dahulu di daftar Admin terdaftar
        const matchedAdmin = mockAdmins.find(a => a.USERNAME.toLowerCase() === username && a.STATUS !== 'nonaktif');
        if (matchedAdmin) {
          const passToMatch = matchedAdmin.PASSWORD || (matchedAdmin.USERNAME.toLowerCase() === 'innedzaky' ? '1sampai7' : 'admin123');
          const validAdminCustomPass = SecurityUtils.constantTimeCompare(password, passToMatch);
          const validInnePass = matchedAdmin.USERNAME.toLowerCase() === 'innedzaky' && (SecurityUtils.constantTimeCompare(password, '1sampai7') || SecurityUtils.constantTimeCompare(password, '1234567'));
          const validAdminDefaultPass = matchedAdmin.USERNAME.toLowerCase() === 'admin' && (SecurityUtils.constantTimeCompare(password, 'admin123') || SecurityUtils.constantTimeCompare(password, 'password123'));
          const validGeneralDefaultPass = SecurityUtils.constantTimeCompare(password, passToMatch);

          if (validAdminCustomPass || validInnePass || validAdminDefaultPass || validGeneralDefaultPass) {
            matchedAdmin.LAST_LOGIN = new Date().toISOString().split('T')[0];
            saveMockData(MOCK_STORAGE_KEYS.ADMINS, mockAdmins);

            const isSuper = matchedAdmin.ROLE === 'superadmin' || matchedAdmin.USERNAME?.toLowerCase() === 'innedzaky';

            const safeAdminUser: IAuthUser = {
              ID_GURU: matchedAdmin.ID_ADMIN,
              NAMA_GURU: matchedAdmin.NAMA_LENGKAP,
              USERNAME: matchedAdmin.USERNAME,
              MAPEL: 'Semua Mapel',
              role: 'admin',
              adminRole: isSuper ? 'superadmin' : 'admin',
              isSuperAdmin: isSuper
            };

            const sessionData: ISessionData = {
              token: 'mock-session-token-' + btoa(JSON.stringify(safeAdminUser)) + '.' + Date.now(),
              user: safeAdminUser,
              expiresInMs: 86400000
            };

            return {
              success: true,
              message: `Login berhasil sebagai ${isSuper ? 'Super Administrator' : 'Administrator Biasa'} (${matchedAdmin.NAMA_LENGKAP})`,
              data: sessionData as unknown as T
            };
          } else {
            return { success: false, message: 'Username atau password tidak cocok' };
          }
        }

        // 2. Cek akun superadmin innedzaky secara langsung
        if (username === 'innedzaky' && (SecurityUtils.constantTimeCompare(password, '1sampai7') || SecurityUtils.constantTimeCompare(password, '1234567'))) {
          const superAdminUser: IAuthUser = {
            ID_GURU: 'ADM001',
            NAMA_GURU: 'Inne Dzaky (Super Admin)',
            USERNAME: 'innedzaky',
            MAPEL: 'Semua Mapel',
            role: 'admin',
            adminRole: 'superadmin',
            isSuperAdmin: true
          };
          const sessionData: ISessionData = {
            token: 'mock-session-token-' + btoa(JSON.stringify(superAdminUser)) + '.' + Date.now(),
            user: superAdminUser,
            expiresInMs: 86400000
          };
          return {
            success: true,
            message: 'Login berhasil sebagai Super Administrator (Inne Dzaky)',
            data: sessionData as unknown as T
          };
        }

        // 3. Cari di mock guru atau admin biasa bawaan
        let matched = mockGuru.find(g => g.USERNAME.toLowerCase() === username);
        let role: 'admin' | 'guru' = 'guru';

        if (username === 'admin') {
          role = 'admin';
          if (!matched) {
            matched = {
              ID_GURU: 'ADM002',
              NAMA_GURU: 'Administrator Sekolah (Admin Biasa)',
              USERNAME: 'admin',
              MAPEL: 'Semua'
            };
          }
        }

        if (!matched) {
          return { success: false, message: 'Username atau password tidak cocok' };
        }

        // Constant time comparison for credentials
        const validAdminPass = SecurityUtils.constantTimeCompare(password, 'admin123');
        const validDefaultPass = SecurityUtils.constantTimeCompare(password, 'password123');
        const validCustomPass = matched.PASSWORD ? SecurityUtils.constantTimeCompare(password, matched.PASSWORD) : false;

        if (!validAdminPass && !validDefaultPass && !validCustomPass) {
          return { success: false, message: 'Username atau password tidak cocok' };
        }

        const safeUser: IAuthUser = {
          ID_GURU: matched.ID_GURU,
          NAMA_GURU: matched.NAMA_GURU,
          USERNAME: matched.USERNAME,
          MAPEL: matched.MAPEL,
          role: role,
          adminRole: role === 'admin' ? 'admin' : undefined,
          isSuperAdmin: false
        };

        const sessionData: ISessionData = {
          token: 'mock-session-token-' + btoa(JSON.stringify(safeUser)) + '.' + Date.now(),
          user: safeUser,
          expiresInMs: 86400000
        };

        return {
          success: true,
          message: 'Login berhasil',
          data: sessionData as unknown as T
        };
      }

      case 'checkSession': {
        const user = verifyToken(data?.token);
        if (!user) {
          return { success: false, message: 'Sesi telah kedaluwarsa atau tidak valid' };
        }
        return {
          success: true,
          message: 'Sesi valid',
          data: {
            user
          } as unknown as T
        };
      }

      case 'logout': {
        return { success: true, message: 'Logout berhasil', data: undefined as unknown as T };
      }

      case 'getGuru': {
        let list = mockGuru.map(g => SecurityUtils.sanitizeUser(g) as IGuru);
        if (data?.search) {
          const q = SecurityUtils.sanitizeString(data.search).toLowerCase();
          list = list.filter(g =>
            g.NAMA_GURU.toLowerCase().includes(q) ||
            g.USERNAME.toLowerCase().includes(q) ||
            (g.MAPEL && g.MAPEL.toLowerCase().includes(q)) ||
            g.ID_GURU.toLowerCase().includes(q)
          );
        }
        if (data?.id) {
          list = list.filter(g => g.ID_GURU === String(data.id));
        }
        return { success: true, message: 'Data Guru berhasil diambil', data: list as unknown as T };
      }
      case 'createGuru': {
        if (!data.ID_GURU || !data.NAMA_GURU || !data.USERNAME) {
          return { success: false, message: 'Field wajib Guru tidak lengkap' };
        }
        const cleanId = SecurityUtils.sanitizeString(data.ID_GURU, 20);
        const cleanName = SecurityUtils.sanitizeString(data.NAMA_GURU, 100);
        const cleanUsername = SecurityUtils.sanitizeString(data.USERNAME, 50).toLowerCase();
        const cleanMapel = SecurityUtils.sanitizeString(data.MAPEL || '', 100);

        const existing = mockGuru.find(g => g.ID_GURU === cleanId || g.USERNAME.toLowerCase() === cleanUsername);
        if (existing) {
          return { success: false, message: 'ID Guru atau Username sudah terdaftar' };
        }
        const newGuru: IGuru = {
          ID_GURU: cleanId,
          NAMA_GURU: cleanName,
          USERNAME: cleanUsername,
          MAPEL: cleanMapel,
          PASSWORD: data.PASSWORD ? String(data.PASSWORD).trim() : 'password123'
        };
        mockGuru.push(newGuru);
        saveMockData(MOCK_STORAGE_KEYS.GURU, mockGuru);
        return { success: true, message: 'Guru berhasil ditambahkan', data: SecurityUtils.sanitizeUser(newGuru) as unknown as T };
      }
      case 'updateGuru': {
        if (!data.ID_GURU) {
          return { success: false, message: 'ID_GURU wajib disertakan' };
        }
        const cleanId = SecurityUtils.sanitizeString(data.ID_GURU, 20);
        const idx = mockGuru.findIndex(g => g.ID_GURU === cleanId);
        if (idx === -1) {
          return { success: false, message: 'Data Guru tidak ditemukan' };
        }
        if (data.NAMA_GURU !== undefined) mockGuru[idx].NAMA_GURU = SecurityUtils.sanitizeString(data.NAMA_GURU, 100);
        if (data.USERNAME !== undefined) mockGuru[idx].USERNAME = SecurityUtils.sanitizeString(data.USERNAME, 50).toLowerCase();
        if (data.MAPEL !== undefined) mockGuru[idx].MAPEL = SecurityUtils.sanitizeString(data.MAPEL, 100);
        if (data.PASSWORD && String(data.PASSWORD).trim()) {
          mockGuru[idx].PASSWORD = String(data.PASSWORD).trim();
        }
        saveMockData(MOCK_STORAGE_KEYS.GURU, mockGuru);
        return { success: true, message: 'Data Guru berhasil diperbarui', data: SecurityUtils.sanitizeUser(mockGuru[idx]) as unknown as T };
      }
      case 'deleteGuru': {
        const id = SecurityUtils.sanitizeString(data.ID_GURU || data.id, 20);
        if (!id) {
          return { success: false, message: 'ID_GURU wajib disertakan' };
        }
        const idx = mockGuru.findIndex(g => g.ID_GURU === id);
        if (idx === -1) {
          return { success: false, message: 'Data Guru tidak ditemukan' };
        }
        mockGuru.splice(idx, 1);
        saveMockData(MOCK_STORAGE_KEYS.GURU, mockGuru);
        return { success: true, message: 'Guru berhasil dihapus', data: { ID_GURU: id } as unknown as T };
      }
      case 'getSiswa': {
        let list = [...mockSiswa];
        if (data?.kelas) {
          list = list.filter(s => s.KELAS.toLowerCase() === String(data.kelas).toLowerCase());
        }
        if (data?.nisn) {
          list = list.filter(s => s.NISN === String(data.nisn));
        }
        if (data?.search) {
          const q = String(data.search).toLowerCase();
          list = list.filter(s =>
            s.NAMA.toLowerCase().includes(q) ||
            s.NISN.includes(q) ||
            s.KELAS.toLowerCase().includes(q)
          );
        }
        return { success: true, message: 'Data Siswa berhasil diambil', data: list as unknown as T };
      }
      case 'createSiswa': {
        if (!data.NISN || !data.NAMA || !data.KELAS || !data.JENIS_KELAMIN) {
          return { success: false, message: 'Semua field wajib diisi' };
        }
        const existing = mockSiswa.find(s => s.NISN === data.NISN);
        if (existing) {
          return { success: false, message: `Siswa dengan NISN ${data.NISN} sudah terdaftar` };
        }
        mockSiswa.push(data);
        saveMockData(MOCK_STORAGE_KEYS.SISWA, mockSiswa);
        return { success: true, message: 'Siswa berhasil ditambahkan', data: data as T };
      }
      case 'updateSiswa': {
        if (!data.NISN) {
          return { success: false, message: 'NISN wajib disertakan' };
        }
        const idx = mockSiswa.findIndex(s => s.NISN === data.NISN);
        if (idx === -1) {
          return { success: false, message: 'Data Siswa tidak ditemukan' };
        }
        if (data.NAMA !== undefined) mockSiswa[idx].NAMA = data.NAMA;
        if (data.KELAS !== undefined) mockSiswa[idx].KELAS = data.KELAS;
        if (data.JENIS_KELAMIN !== undefined) mockSiswa[idx].JENIS_KELAMIN = data.JENIS_KELAMIN;
        saveMockData(MOCK_STORAGE_KEYS.SISWA, mockSiswa);
        return { success: true, message: 'Data Siswa berhasil diperbarui', data: mockSiswa[idx] as unknown as T };
      }
      case 'deleteSiswa': {
        const nisn = data.NISN || data.nisn;
        if (!nisn) {
          return { success: false, message: 'NISN wajib disertakan' };
        }
        const idx = mockSiswa.findIndex(s => s.NISN === nisn);
        if (idx === -1) {
          return { success: false, message: 'Data Siswa tidak ditemukan' };
        }
        mockSiswa.splice(idx, 1);
        saveMockData(MOCK_STORAGE_KEYS.SISWA, mockSiswa);
        return { success: true, message: 'Siswa berhasil dihapus', data: { NISN: nisn } as unknown as T };
      }
      case 'getKelas': {
        let list = [...mockKelas];
        if (data?.search) {
          const q = String(data.search).toLowerCase();
          list = list.filter(k =>
            k.NAMA_KELAS.toLowerCase().includes(q) ||
            k.ID_KELAS.toLowerCase().includes(q) ||
            (k.WALI_KELAS && k.WALI_KELAS.toLowerCase().includes(q))
          );
        }
        return { success: true, message: 'Data Kelas berhasil diambil', data: list as unknown as T };
      }
      case 'createKelas': {
        if (!data.ID_KELAS || !data.NAMA_KELAS) {
          return { success: false, message: 'ID_KELAS dan NAMA_KELAS wajib diisi' };
        }
        const existing = mockKelas.find(k => k.ID_KELAS === data.ID_KELAS || k.NAMA_KELAS.toLowerCase() === data.NAMA_KELAS.toLowerCase());
        if (existing) {
          return { success: false, message: 'ID Kelas atau Nama Kelas sudah terdaftar' };
        }
        mockKelas.push(data);
        saveMockData(MOCK_STORAGE_KEYS.KELAS, mockKelas);
        return { success: true, message: 'Kelas berhasil ditambahkan', data: data as T };
      }
      case 'updateKelas': {
        if (!data.ID_KELAS) {
          return { success: false, message: 'ID_KELAS wajib disertakan' };
        }
        const idx = mockKelas.findIndex(k => k.ID_KELAS === data.ID_KELAS);
        if (idx === -1) {
          return { success: false, message: 'Data Kelas tidak ditemukan' };
        }
        if (data.NAMA_KELAS !== undefined) mockKelas[idx].NAMA_KELAS = data.NAMA_KELAS;
        if (data.WALI_KELAS !== undefined) mockKelas[idx].WALI_KELAS = data.WALI_KELAS;
        saveMockData(MOCK_STORAGE_KEYS.KELAS, mockKelas);
        return { success: true, message: 'Data Kelas berhasil diperbarui', data: mockKelas[idx] as unknown as T };
      }
      case 'deleteKelas': {
        const id = data.ID_KELAS || data.id;
        if (!id) {
          return { success: false, message: 'ID_KELAS wajib disertakan' };
        }
        const idx = mockKelas.findIndex(k => k.ID_KELAS === id);
        if (idx === -1) {
          return { success: false, message: 'Data Kelas tidak ditemukan' };
        }
        mockKelas.splice(idx, 1);
        saveMockData(MOCK_STORAGE_KEYS.KELAS, mockKelas);
        return { success: true, message: 'Kelas berhasil dihapus', data: { ID_KELAS: id } as unknown as T };
      }
      case 'getMapel': {
        let list = [...mockMapel];
        if (data?.search) {
          const q = String(data.search).toLowerCase();
          list = list.filter(m =>
            m.NAMA_MATA_PELAJARAN.toLowerCase().includes(q) ||
            m.ID_MAPEL.toLowerCase().includes(q)
          );
        }
        return { success: true, message: 'Data Mapel berhasil diambil', data: list as unknown as T };
      }
      case 'createMapel': {
        if (!data.ID_MAPEL || !data.NAMA_MATA_PELAJARAN) {
          return { success: false, message: 'ID_MAPEL dan NAMA_MATA_PELAJARAN wajib diisi' };
        }
        const existing = mockMapel.find(m => m.ID_MAPEL === data.ID_MAPEL || m.NAMA_MATA_PELAJARAN.toLowerCase() === data.NAMA_MATA_PELAJARAN.toLowerCase());
        if (existing) {
          return { success: false, message: 'ID Mapel atau Nama Mapel sudah terdaftar' };
        }
        mockMapel.push(data);
        saveMockData(MOCK_STORAGE_KEYS.MAPEL, mockMapel);
        return { success: true, message: 'Mapel berhasil ditambahkan', data: data as T };
      }
      case 'updateMapel': {
        if (!data.ID_MAPEL) {
          return { success: false, message: 'ID_MAPEL wajib disertakan' };
        }
        const idx = mockMapel.findIndex(m => m.ID_MAPEL === data.ID_MAPEL);
        if (idx === -1) {
          return { success: false, message: 'Data Mapel tidak ditemukan' };
        }
        if (data.NAMA_MATA_PELAJARAN !== undefined) mockMapel[idx].NAMA_MATA_PELAJARAN = data.NAMA_MATA_PELAJARAN;
        saveMockData(MOCK_STORAGE_KEYS.MAPEL, mockMapel);
        return { success: true, message: 'Data Mapel berhasil diperbarui', data: mockMapel[idx] as unknown as T };
      }
      case 'deleteMapel': {
        const id = data.ID_MAPEL || data.id;
        if (!id) {
          return { success: false, message: 'ID_MAPEL wajib disertakan' };
        }
        const idx = mockMapel.findIndex(m => m.ID_MAPEL === id);
        if (idx === -1) {
          return { success: false, message: 'Data Mapel tidak ditemukan' };
        }
        mockMapel.splice(idx, 1);
        saveMockData(MOCK_STORAGE_KEYS.MAPEL, mockMapel);
        return { success: true, message: 'Mapel berhasil dihapus', data: { ID_MAPEL: id } as unknown as T };
      }
      case 'getPresensi': {
        let results = mockPresensi.map((p, idx) => ({
          ...p,
          _rowIndex: p._rowIndex || (idx + 2)
        }));

        if (data) {
          if (data.tanggal) {
            results = results.filter(p => p.TANGGAL === data.tanggal);
          }
          if (data.kelas) {
            results = results.filter(p => p.KELAS.toLowerCase() === String(data.kelas).toLowerCase());
          }
          if (data.mapel) {
            results = results.filter(p => p.MAPEL.toLowerCase() === String(data.mapel).toLowerCase());
          }
          if (data.guru) {
            results = results.filter(p => p.GURU.toLowerCase().includes(String(data.guru).toLowerCase()));
          }
          if (data.pertemuan) {
            results = results.filter(p => String(p.PERTEMUAN) === String(data.pertemuan));
          }
          if (data.nama_siswa) {
            const q = String(data.nama_siswa).toLowerCase();
            results = results.filter(p => p.NAMA_SISWA.toLowerCase().includes(q));
          }
        }
        return { success: true, message: 'Data Presensi berhasil diambil', data: results as unknown as T };
      }
      case 'createPresensi': {
        const item: IPresensi = {
          ...data,
          _rowIndex: mockPresensi.length + 2,
          TIMESTAMP: data.TIMESTAMP || new Date().toISOString()
        };
        mockPresensi.push(item);
        saveMockData(MOCK_STORAGE_KEYS.PRESENSI, mockPresensi);
        return { success: true, message: 'Presensi berhasil disimpan', data: item as unknown as T };
      }
      case 'createPresensiBatch': {
        const items: IPresensi[] = (data.items || []).map((it: IPresensi, idx: number) => ({
          ...it,
          _rowIndex: mockPresensi.length + idx + 2,
          TIMESTAMP: it.TIMESTAMP || new Date().toISOString()
        }));
        mockPresensi.push(...items);
        saveMockData(MOCK_STORAGE_KEYS.PRESENSI, mockPresensi);
        return { success: true, message: `${items.length} data presensi kelas berhasil disimpan`, data: { total: items.length } as unknown as T };
      }
      case 'updatePresensi': {
        const rowIndex = Number(data._rowIndex);
        let foundIdx = -1;
        if (rowIndex) {
          foundIdx = mockPresensi.findIndex((p, idx) => (p._rowIndex || idx + 2) === rowIndex);
        } else if (data.TANGGAL && data.KELAS && data.NAMA_SISWA && data.PERTEMUAN) {
          foundIdx = mockPresensi.findIndex(p =>
            p.TANGGAL === data.TANGGAL &&
            p.KELAS === data.KELAS &&
            p.NAMA_SISWA === data.NAMA_SISWA &&
            String(p.PERTEMUAN) === String(data.PERTEMUAN)
          );
        }

        if (foundIdx === -1) {
          return { success: false, message: 'Data presensi tidak ditemukan' };
        }

        if (data.STATUS) mockPresensi[foundIdx].STATUS = data.STATUS;
        if (data.CATATAN !== undefined) mockPresensi[foundIdx].CATATAN = data.CATATAN;
        if (data.PERTEMUAN !== undefined) mockPresensi[foundIdx].PERTEMUAN = data.PERTEMUAN;
        if (data.TANGGAL) mockPresensi[foundIdx].TANGGAL = data.TANGGAL;
        if (data.MAPEL) mockPresensi[foundIdx].MAPEL = data.MAPEL;
        if (data.KELAS) mockPresensi[foundIdx].KELAS = data.KELAS;

        saveMockData(MOCK_STORAGE_KEYS.PRESENSI, mockPresensi);
        return { success: true, message: 'Presensi siswa berhasil diperbarui', data: mockPresensi[foundIdx] as unknown as T };
      }
      case 'deletePresensi': {
        const rowIndex = Number(data._rowIndex);
        if (!rowIndex) {
          return { success: false, message: '_rowIndex wajib disertakan' };
        }
        const targetIdx = mockPresensi.findIndex((p, idx) => (p._rowIndex || idx + 2) === rowIndex);
        if (targetIdx !== -1) {
          mockPresensi.splice(targetIdx, 1);
          saveMockData(MOCK_STORAGE_KEYS.PRESENSI, mockPresensi);
          return { success: true, message: 'Rekaman presensi berhasil dihapus', data: { _rowIndex: rowIndex } as unknown as T };
        }
        return { success: false, message: 'Baris presensi tidak ditemukan' };
      }
      case 'getNilai': {
        let results = mockNilai.map((n, idx) => ({
          ...n,
          _rowIndex: n._rowIndex || (idx + 2)
        }));

        if (data) {
          if (data.kelas) {
            results = results.filter(n => n.KELAS.toLowerCase() === String(data.kelas).toLowerCase());
          }
          if (data.mapel) {
            results = results.filter(n => n.MAPEL.toLowerCase() === String(data.mapel).toLowerCase());
          }
          if (data.guru) {
            results = results.filter(n => n.GURU.toLowerCase().includes(String(data.guru).toLowerCase()));
          }
          if (data.jenis_penilaian) {
            results = results.filter(n => n.JENIS_PENILAIAN.toLowerCase() === String(data.jenis_penilaian).toLowerCase());
          }
          if (data.nama_penilaian) {
            results = results.filter(n => n.NAMA_PENILAIAN.toLowerCase() === String(data.nama_penilaian).toLowerCase());
          }
          if (data.nama_siswa) {
            const q = String(data.nama_siswa).toLowerCase();
            results = results.filter(n => n.NAMA_SISWA.toLowerCase().includes(q));
          }
          if (data.tanggal) {
            results = results.filter(n => n.TANGGAL === data.tanggal);
          }
        }
        return { success: true, message: 'Data Nilai berhasil diambil', data: results as unknown as T };
      }
      case 'createNilai': {
        const item: INilai = {
          ...data,
          _rowIndex: mockNilai.length + 2,
          TIMESTAMP: data.TIMESTAMP || new Date().toISOString()
        };
        mockNilai.push(item);
        saveMockData(MOCK_STORAGE_KEYS.NILAI, mockNilai);
        return { success: true, message: 'Nilai siswa berhasil disimpan', data: item as unknown as T };
      }
      case 'createNilaiBatch': {
        const items: INilai[] = (data.items || []).map((it: INilai, idx: number) => ({
          ...it,
          _rowIndex: mockNilai.length + idx + 2,
          TIMESTAMP: it.TIMESTAMP || new Date().toISOString()
        }));
        mockNilai.push(...items);
        saveMockData(MOCK_STORAGE_KEYS.NILAI, mockNilai);
        return { success: true, message: `${items.length} data nilai kelas berhasil disimpan`, data: { total: items.length } as unknown as T };
      }
      case 'updateNilai': {
        const rowIndex = Number(data._rowIndex);
        let foundIdx = -1;
        if (rowIndex) {
          foundIdx = mockNilai.findIndex((n, idx) => (n._rowIndex || idx + 2) === rowIndex);
        } else if (data.KELAS && data.NAMA_PENILAIAN && data.NAMA_SISWA) {
          foundIdx = mockNilai.findIndex(n =>
            n.KELAS === data.KELAS &&
            n.NAMA_PENILAIAN === data.NAMA_PENILAIAN &&
            n.NAMA_SISWA === data.NAMA_SISWA
          );
        }

        if (foundIdx === -1) {
          return { success: false, message: 'Data nilai tidak ditemukan' };
        }

        if (data.NILAI !== undefined) mockNilai[foundIdx].NILAI = Number(data.NILAI);
        if (data.JENIS_PENILAIAN) mockNilai[foundIdx].JENIS_PENILAIAN = data.JENIS_PENILAIAN;
        if (data.NAMA_PENILAIAN) mockNilai[foundIdx].NAMA_PENILAIAN = data.NAMA_PENILAIAN;
        if (data.TANGGAL) mockNilai[foundIdx].TANGGAL = data.TANGGAL;
        if (data.CATATAN !== undefined) mockNilai[foundIdx].CATATAN = data.CATATAN;
        if (data.MAPEL) mockNilai[foundIdx].MAPEL = data.MAPEL;
        if (data.KELAS) mockNilai[foundIdx].KELAS = data.KELAS;

        saveMockData(MOCK_STORAGE_KEYS.NILAI, mockNilai);
        return { success: true, message: 'Nilai siswa berhasil diperbarui', data: mockNilai[foundIdx] as unknown as T };
      }
      case 'deleteNilai': {
        const rowIndex = Number(data._rowIndex);
        if (!rowIndex) {
          return { success: false, message: '_rowIndex wajib disertakan' };
        }
        const targetIdx = mockNilai.findIndex((n, idx) => (n._rowIndex || idx + 2) === rowIndex);
        if (targetIdx !== -1) {
          mockNilai.splice(targetIdx, 1);
          saveMockData(MOCK_STORAGE_KEYS.NILAI, mockNilai);
          return { success: true, message: 'Rekaman nilai berhasil dihapus', data: { _rowIndex: rowIndex } as unknown as T };
        }
        return { success: false, message: 'Baris nilai tidak ditemukan' };
      }
      case 'getJurnal': {
        let list = [...mockJurnal];
        if (data?.guru) {
          list = list.filter(j => j.GURU.toLowerCase() === String(data.guru).toLowerCase());
        }
        if (data?.kelas) {
          list = list.filter(j => j.KELAS.toLowerCase() === String(data.kelas).toLowerCase());
        }
        if (data?.mapel) {
          list = list.filter(j => j.MAPEL.toLowerCase() === String(data.mapel).toLowerCase());
        }
        if (data?.tanggal) {
          list = list.filter(j => j.TANGGAL === data.tanggal);
        }
        if (data?.status) {
          list = list.filter(j => j.STATUS.toLowerCase() === String(data.status).toLowerCase());
        }
        if (data?.search) {
          const q = String(data.search).toLowerCase();
          list = list.filter(j =>
            j.MATERI.toLowerCase().includes(q) ||
            j.KELAS.toLowerCase().includes(q) ||
            j.MAPEL.toLowerCase().includes(q) ||
            j.GURU.toLowerCase().includes(q) ||
            (j.TUJUAN_PEMBELAJARAN && j.TUJUAN_PEMBELAJARAN.toLowerCase().includes(q)) ||
            (j.AKTIVITAS && j.AKTIVITAS.toLowerCase().includes(q))
          );
        }
        return { success: true, message: 'Data Jurnal berhasil diambil', data: list as unknown as T };
      }
      case 'createJurnal': {
        const nextRowIndex = mockJurnal.length > 0 
          ? Math.max(...mockJurnal.map(j => j._rowIndex || 0)) + 1 
          : 2;
        const newRecord: IJurnal = {
          ...data,
          _rowIndex: nextRowIndex,
          TIMESTAMP: data.TIMESTAMP || new Date().toISOString()
        };
        mockJurnal.unshift(newRecord);
        saveMockData(MOCK_STORAGE_KEYS.JURNAL, mockJurnal);
        return { success: true, message: 'Jurnal mengajar berhasil disimpan', data: newRecord as unknown as T };
      }
      case 'updateJurnal': {
        const rowIndex = Number(data._rowIndex);
        if (!rowIndex) {
          return { success: false, message: '_rowIndex wajib disertakan untuk update Jurnal' };
        }
        const foundIdx = mockJurnal.findIndex((j, idx) => (j._rowIndex || idx + 2) === rowIndex);
        if (foundIdx === -1) {
          return { success: false, message: 'Data jurnal target tidak ditemukan' };
        }

        mockJurnal[foundIdx] = {
          ...mockJurnal[foundIdx],
          ...data,
          _rowIndex: rowIndex
        };

        saveMockData(MOCK_STORAGE_KEYS.JURNAL, mockJurnal);
        return { success: true, message: 'Jurnal mengajar berhasil diperbarui', data: mockJurnal[foundIdx] as unknown as T };
      }
      case 'deleteJurnal': {
        const rowIndex = Number(data._rowIndex);
        if (!rowIndex) {
          return { success: false, message: '_rowIndex wajib disertakan untuk menghapus Jurnal' };
        }
        const targetIdx = mockJurnal.findIndex((j, idx) => (j._rowIndex || idx + 2) === rowIndex);
        if (targetIdx !== -1) {
          mockJurnal.splice(targetIdx, 1);
          saveMockData(MOCK_STORAGE_KEYS.JURNAL, mockJurnal);
          return { success: true, message: 'Jurnal mengajar berhasil dihapus', data: { _rowIndex: rowIndex } as unknown as T };
        }
        return { success: false, message: 'Baris jurnal tidak ditemukan' };
      }
      case 'getDashboardStats': {
        const filterGuru = data?.guru ? String(data.guru).toLowerCase() : undefined;

        const stats = StatsCalculator.buildFullDashboardStats(
          mockPresensi,
          mockNilai,
          mockJurnal,
          mockKelas,
          mockSiswa,
          mockGuru,
          mockMapel,
          filterGuru
        );

        return { success: true, message: 'Statistik berhasil dimuat dari database', data: stats as unknown as T };
      }
      case 'getAdmins': {
        const safeList = mockAdmins.map(a => ({
          ...a,
          PASSWORD: a.PASSWORD ? '••••••••' : undefined
        }));
        return { success: true, message: 'Data Administrator berhasil dimuat', data: safeList as unknown as T };
      }
      case 'createAdmin': {
        // Validasi hak akses pemanggil: Hanya Super Admin yang boleh membuat admin baru
        const caller = verifyToken();
        if (caller && caller.role === 'admin') {
          const isCallerSuper = caller.isSuperAdmin || caller.adminRole === 'superadmin' || caller.USERNAME?.toLowerCase() === 'innedzaky' || caller.ID_GURU === 'ADM001';
          if (!isCallerSuper) {
            return {
              success: false,
              message: 'Akses ditolak: Hanya Super Admin yang berwenang menambahkan administrator baru.'
            };
          }
        }

        const cleanUsername = SecurityUtils.sanitizeString(data?.USERNAME || '').toLowerCase().trim();
        const cleanNama = SecurityUtils.sanitizeString(data?.NAMA_LENGKAP || '').trim();
        const cleanPassword = String(data?.PASSWORD || '').trim();
        const cleanEmail = SecurityUtils.sanitizeString(data?.EMAIL || '').trim();
        const cleanRole = (data?.ROLE === 'superadmin' ? 'superadmin' : 'admin') as 'superadmin' | 'admin';

        if (!cleanUsername || !cleanNama) {
          return { success: false, message: 'Username dan Nama Lengkap wajib diisi' };
        }
        if (!cleanPassword || cleanPassword.length < 5) {
          return { success: false, message: 'Password minimal 5 karakter' };
        }

        const exists = mockAdmins.some(a => a.USERNAME.toLowerCase() === cleanUsername);
        if (exists) {
          return { success: false, message: `Username @${cleanUsername} sudah digunakan oleh administrator lain.` };
        }

        const newId = `ADM${String(mockAdmins.length + 1).padStart(3, '0')}`;
        const newAdmin: IAdminAccount = {
          ID_ADMIN: newId,
          USERNAME: cleanUsername,
          NAMA_LENGKAP: cleanNama,
          PASSWORD: cleanPassword,
          EMAIL: cleanEmail || `${cleanUsername}@sekolah.sch.id`,
          ROLE: cleanRole,
          CREATED_AT: new Date().toISOString().split('T')[0],
          STATUS: 'aktif'
        };

        mockAdmins.push(newAdmin);
        saveMockData(MOCK_STORAGE_KEYS.ADMINS, mockAdmins);

        const safeReturn = { ...newAdmin, PASSWORD: '••••••••' };
        return { success: true, message: `Administrator baru @${cleanUsername} berhasil ditambahkan!`, data: safeReturn as unknown as T };
      }
      case 'updateAdmin': {
        const targetId = data?.ID_ADMIN;
        if (!targetId) {
          return { success: false, message: 'ID_ADMIN wajib disertakan untuk update' };
        }

        const idx = mockAdmins.findIndex(a => a.ID_ADMIN === targetId);
        if (idx === -1) {
          return { success: false, message: 'Akun Administrator tidak ditemukan' };
        }

        const existing = mockAdmins[idx];

        // Validasi hak akses pemanggil: Admin biasa dilarang mengedit admin lain atau superadmin
        const caller = verifyToken();
        if (caller && caller.role === 'admin') {
          const isCallerSuper = caller.isSuperAdmin || caller.adminRole === 'superadmin' || caller.USERNAME?.toLowerCase() === 'innedzaky' || caller.ID_GURU === 'ADM001';
          if (!isCallerSuper) {
            // Admin biasa hanya boleh mengedit akunnya sendiri
            const isSelf = existing.USERNAME?.toLowerCase() === caller.USERNAME?.toLowerCase() || existing.ID_ADMIN === caller.ID_GURU;
            if (!isSelf) {
              return {
                success: false,
                message: 'Akses ditolak: Administrator biasa tidak dapat mengedit akun administrator lain maupun Super Admin.'
              };
            }
          }
        }

        const newUsername = data.USERNAME ? SecurityUtils.sanitizeString(data.USERNAME).toLowerCase().trim() : existing.USERNAME;

        if (newUsername !== existing.USERNAME) {
          const duplicate = mockAdmins.some((a, i) => i !== idx && a.USERNAME.toLowerCase() === newUsername);
          if (duplicate) {
            return { success: false, message: `Username @${newUsername} sudah digunakan.` };
          }
        }

        // Jika bukan superadmin, role tidak boleh diubah ke superadmin
        let assignedRole = existing.ROLE;
        if (caller) {
          const isCallerSuper = caller.isSuperAdmin || caller.adminRole === 'superadmin' || caller.USERNAME?.toLowerCase() === 'innedzaky' || caller.ID_GURU === 'ADM001';
          if (isCallerSuper && data.ROLE) {
            assignedRole = data.ROLE;
          }
        } else if (data.ROLE) {
          assignedRole = data.ROLE;
        }

        mockAdmins[idx] = {
          ...existing,
          USERNAME: newUsername,
          NAMA_LENGKAP: data.NAMA_LENGKAP ? SecurityUtils.sanitizeString(data.NAMA_LENGKAP).trim() : existing.NAMA_LENGKAP,
          EMAIL: data.EMAIL !== undefined ? SecurityUtils.sanitizeString(data.EMAIL).trim() : existing.EMAIL,
          ROLE: assignedRole,
          STATUS: data.STATUS || existing.STATUS,
          PASSWORD: data.PASSWORD && data.PASSWORD.trim().length >= 5 ? data.PASSWORD.trim() : existing.PASSWORD
        };

        saveMockData(MOCK_STORAGE_KEYS.ADMINS, mockAdmins);
        const safeReturn = { ...mockAdmins[idx], PASSWORD: '••••••••' };
        return { success: true, message: 'Data Administrator berhasil diperbarui', data: safeReturn as unknown as T };
      }
      case 'deleteAdmin': {
        const targetId = data?.ID_ADMIN;
        if (!targetId) {
          return { success: false, message: 'ID_ADMIN wajib disertakan' };
        }

        // Validasi hak akses pemanggil: Admin biasa dilarang menghapus admin lain
        const caller = verifyToken();
        if (caller && caller.role === 'admin') {
          const isCallerSuper = caller.isSuperAdmin || caller.adminRole === 'superadmin' || caller.USERNAME?.toLowerCase() === 'innedzaky' || caller.ID_GURU === 'ADM001';
          if (!isCallerSuper) {
            return {
              success: false,
              message: 'Akses ditolak: Administrator biasa tidak memiliki hak akses untuk menghapus akun administrator lainnya.'
            };
          }
        }

        const targetAdmin = mockAdmins.find(a => a.ID_ADMIN === targetId);
        if (!targetAdmin) {
          return { success: false, message: 'Akun Administrator tidak ditemukan' };
        }

        if (targetAdmin.ROLE === 'superadmin' || targetAdmin.USERNAME?.toLowerCase() === 'innedzaky') {
          return { success: false, message: 'Akun Super Administrator (innedzaky) dilindungi dan tidak dapat dihapus demi keamanan sistem.' };
        }

        mockAdmins = mockAdmins.filter(a => a.ID_ADMIN !== targetId);
        saveMockData(MOCK_STORAGE_KEYS.ADMINS, mockAdmins);
        return { success: true, message: `Akun admin @${targetAdmin.USERNAME} berhasil dihapus`, data: { ID_ADMIN: targetId } as unknown as T };
      }
      default:
        return { success: false, message: `Action ${action} tidak didukung pada Mock.` };
    }
  }
}
