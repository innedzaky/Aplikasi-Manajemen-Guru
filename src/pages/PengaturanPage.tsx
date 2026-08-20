/**
 * =========================================================================
 * PengaturanPage.tsx - Settings & Administrator Management Dashboard Page
 * =========================================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings,
  Shield,
  ShieldCheck,
  UserPlus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  Check,
  Link2,
  RefreshCw,
  HelpCircle,
  Lock,
  Mail,
  User,
  Activity,
  Layers,
  KeyRound,
  HardDriveDownload,
  FileSpreadsheet
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IAdminAccount } from '../types.ts';
import { AdminModal } from '../components/master/AdminModal.tsx';
import { DeleteConfirmModal } from '../components/master/DeleteConfirmModal.tsx';
import { SecurityUtils } from '../utils/securityUtils.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const GAS_URL_KEY = 'manajemen_guru_gas_url';
const GAS_MODE_KEY = 'manajemen_guru_gas_mode';

export const PengaturanPage: React.FC = () => {
  const { user: currentAuthUser, isSuperAdmin } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // Active Main Tab State
  const [activeTab, setActiveTab] = useState<'admin' | 'backend' | 'system'>('admin');

  // ---------------------------------------------------------------------------
  // ADMIN MANAGEMENT STATE
  // ---------------------------------------------------------------------------
  const [adminList, setAdminList] = useState<IAdminAccount[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(true);
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState<boolean>(false);

  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<string>('all');

  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<IAdminAccount | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingAdmin, setDeletingAdmin] = useState<IAdminAccount | null>(null);

  // ---------------------------------------------------------------------------
  // BACKEND & API CONFIG STATE
  // ---------------------------------------------------------------------------
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(GAS_URL_KEY) || '';
  });

  const [isLive, setIsLive] = useState<boolean>(() => {
    return localStorage.getItem(GAS_MODE_KEY) === 'live';
  });

  const [urlError, setUrlError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ---------------------------------------------------------------------------
  // LOCAL TOAST STATE
  // ---------------------------------------------------------------------------
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // ---------------------------------------------------------------------------
  // FETCH ADMIN DATA
  // ---------------------------------------------------------------------------
  const fetchAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      const res = await ApiClient.getAdmins();
      if (res.success && res.data) {
        setAdminList(res.data);
      } else {
        showToast('error', res.message || 'Gagal memuat daftar akun administrator.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal memuat data administrator: ' + (err.message || err));
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // ---------------------------------------------------------------------------
  // FILTERED ADMIN LIST
  // ---------------------------------------------------------------------------
  const filteredAdmins = useMemo(() => {
    return adminList.filter((adm) => {
      if (adminRoleFilter !== 'all' && adm.ROLE !== adminRoleFilter) {
        return false;
      }
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase().trim();
        const matchName = adm.NAMA_LENGKAP.toLowerCase().includes(q);
        const matchUser = adm.USERNAME.toLowerCase().includes(q);
        const matchEmail = (adm.EMAIL || '').toLowerCase().includes(q);
        return matchName || matchUser || matchEmail;
      }
      return true;
    });
  }, [adminList, adminRoleFilter, adminSearch]);

  // ---------------------------------------------------------------------------
  // ADMIN ACTIONS: CREATE / UPDATE
  // ---------------------------------------------------------------------------
  const handleOpenCreateAdmin = () => {
    if (!isSuperAdmin) {
      showToast('warning', 'Hanya Super Admin yang berwenang menambahkan administrator baru.');
      toastError('Akses Ditolak: Anda harus memiliki peran Super Admin untuk menambah akun administrator.', 'Hak Akses Terbatas');
      return;
    }
    setEditingAdmin(null);
    setIsAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (adm: IAdminAccount) => {
    if (!isSuperAdmin && currentAuthUser?.USERNAME !== adm.USERNAME) {
      showToast('warning', 'Akses Ditolak: Admin biasa tidak dapat mengedit akun administrator lain maupun Super Admin.');
      toastError('Hanya Super Admin yang berwenang mengedit akun administrator lain.', 'Hak Akses Terbatas');
      return;
    }
    setEditingAdmin(adm);
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async (data: any): Promise<boolean> => {
    if (!editingAdmin && !isSuperAdmin) {
      showToast('error', 'Akses ditolak: Hanya Super Admin yang dapat menambahkan akun admin baru.');
      toastError('Hanya Super Admin yang berwenang menambahkan administrator.', 'Penolakan Otorisasi');
      return false;
    }

    if (editingAdmin && !isSuperAdmin && currentAuthUser?.USERNAME !== editingAdmin.USERNAME) {
      showToast('error', 'Akses ditolak: Admin biasa tidak dapat mengedit akun administrator lain ataupun Super Admin.');
      toastError('Hanya Super Admin yang berwenang mengedit administrator lain.', 'Penolakan Otorisasi');
      return false;
    }

    setIsSavingAdmin(true);
    try {
      let res;
      if (editingAdmin) {
        res = await ApiClient.updateAdmin({
          ...data,
          ID_ADMIN: editingAdmin.ID_ADMIN
        });
      } else {
        res = await ApiClient.createAdmin(data);
      }

      if (res.success) {
        showToast('success', res.message);
        toastSuccess(res.message, editingAdmin ? 'Admin Diperbarui' : 'Admin Ditambahkan');
        fetchAdmins();
        return true;
      } else {
        showToast('error', res.message);
        toastError(res.message, 'Gagal Menyimpan');
        return false;
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (err.message || err));
      return false;
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ADMIN ACTIONS: DELETE
  // ---------------------------------------------------------------------------
  const handleOpenDeleteAdmin = (adm: IAdminAccount) => {
    if (!isSuperAdmin) {
      showToast('warning', 'Akses Ditolak: Admin biasa tidak memiliki izin untuk menghapus akun admin lainnya.');
      toastError('Hanya Super Administrator yang berwenang menghapus akun administrator.', 'Akses Ditolak');
      return;
    }

    if (adm.ROLE === 'superadmin' || adm.USERNAME?.toLowerCase() === 'innedzaky') {
      showToast('warning', 'Akun Super Administrator tidak dapat dihapus.');
      toastError('Akun Super Administrator (innedzaky) dilindungi dan tidak dapat dihapus.', 'Penolakan Sistem');
      return;
    }

    if (currentAuthUser?.USERNAME === adm.USERNAME) {
      showToast('warning', 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.');
      toastError('Tidak dapat menghapus akun yang sedang aktif digunakan.', 'Penolakan Sistem');
      return;
    }

    setDeletingAdmin(adm);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    if (!isSuperAdmin) {
      showToast('error', 'Akses ditolak: Admin biasa dilarang menghapus akun administrator lainnya.');
      toastError('Hanya Super Administrator yang berwenang melakukan tindakan ini.', 'Otorisasi Ditolak');
      setIsDeleteModalOpen(false);
      setDeletingAdmin(null);
      return;
    }

    setIsDeletingAdmin(true);
    try {
      const res = await ApiClient.deleteAdmin(deletingAdmin.ID_ADMIN);
      if (res.success) {
        showToast('success', res.message);
        toastSuccess(res.message, 'Admin Dihapus');
        fetchAdmins();
        setIsDeleteModalOpen(false);
        setDeletingAdmin(null);
      } else {
        showToast('error', res.message);
        toastError(res.message, 'Gagal Menghapus');
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan saat menghapus admin: ' + (err.message || err));
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  // ---------------------------------------------------------------------------
  // BACKEND CONNECTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleTestConnection = async () => {
    const trimmedUrl = gasUrl.trim();
    if (!trimmedUrl) {
      setUrlError('Masukkan URL backend API terlebih dahulu.');
      return;
    }

    const validation = SecurityUtils.isValidGasUrl(trimmedUrl);
    if (!validation.valid) {
      setUrlError(validation.reason || 'URL tidak valid');
      return;
    }

    setIsTesting(true);
    setUrlError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: trimmedUrl,
          action: 'getGuru'
        })
      });

      const json = await response.json();
      if (json.success) {
        setTestResult({
          success: true,
          message: 'Berhasil terhubung ke Cloudflare Workers / Google Apps Script API aktif!'
        });
      } else {
        setTestResult({
          success: false,
          message: json.message || 'Respon gagal dari endpoint backend API.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Gagal terhubung ke endpoint: ' + (err.message || err)
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveBackendConfig = () => {
    const trimmedUrl = gasUrl.trim();

    if (isLive) {
      const validation = SecurityUtils.isValidGasUrl(trimmedUrl);
      if (!validation.valid) {
        setUrlError(validation.reason || 'URL endpoint tidak valid');
        showToast('error', validation.reason || 'URL endpoint tidak valid');
        return;
      }
    }

    setUrlError(null);
    localStorage.setItem(GAS_URL_KEY, trimmedUrl);
    localStorage.setItem(GAS_MODE_KEY, isLive ? 'live' : 'demo');

    ApiClient.configure(trimmedUrl, isLive);

    const msg = isLive
      ? 'Mode Live API Cloud Database Aktif'
      : 'Mode Demo Offline (In-Memory Database) Aktif';
    showToast('success', msg);
    toastSuccess(msg, 'Pengaturan Disimpan');
  };

  const handleResetLocalCache = () => {
    if (window.confirm('Apakah Anda yakin ingin menyegarkan cache data lokal ke setelan awal pabrik? Data admin kustom akan dipertahankan.')) {
      localStorage.removeItem('manajemen_guru_mock_guru');
      localStorage.removeItem('manajemen_guru_mock_siswa');
      localStorage.removeItem('manajemen_guru_mock_kelas');
      localStorage.removeItem('manajemen_guru_mock_mapel');
      localStorage.removeItem('manajemen_guru_mock_presensi');
      localStorage.removeItem('manajemen_guru_mock_nilai');
      localStorage.removeItem('manajemen_guru_mock_jurnal');
      showToast('success', 'Cache data lokal berhasil direset. Halaman akan disegarkan.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toast.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold hover:opacity-75 px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              Koneksi &amp; Pengaturan Sistem
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pusat pengelolaan akun administrator, hak akses, dan konfigurasi API database sistem
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Manajemen Admin ({adminList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'backend'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            Koneksi Backend &amp; API
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'system'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Informasi Sistem
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: MANAJEMEN AKUN ADMINISTRATOR */}
      {/* ======================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Privilege Info Banner */}
          {isSuperAdmin ? (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <span>Otoritas Super Administrator Aktif</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                      Full Access
                    </span>
                  </div>
                  <p className="text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                    Anda memiliki wewenang penuh untuk memasukkan (menambah), mengubah, dan menghapus akun administrator yang terdaftar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <span>Akses Terbatas: Administrator Biasa</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                      Edit Profil Sendiri
                    </span>
                  </div>
                  <p className="text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    Admin biasa hanya dapat mengedit profil akun miliknya sendiri. Wewenang untuk menambah admin baru, mengedit admin lain, dan menghapus admin biasa hanya dimiliki oleh <strong className="text-amber-900 dark:text-amber-100">Super Admin</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Cari nama, username, atau email admin..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {adminSearch && (
                  <button
                    onClick={() => setAdminSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={adminRoleFilter}
                onChange={(e) => setAdminRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Tingkat Akses</option>
                <option value="superadmin">Super Administrator</option>
                <option value="admin">Administrator Biasa</option>
              </select>

              <button
                type="button"
                onClick={fetchAdmins}
                title="Segarkan data admin"
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Tambah Admin Baru Button (Super Admin Only) */}
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={handleOpenCreateAdmin}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Admin Baru
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateAdmin}
                title="Hanya Super Admin yang dapat menambahkan akun administrator baru"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl cursor-not-allowed transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Tambah Admin Baru (Khusus Super Admin)
              </button>
            )}
          </div>

          {/* Admin Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Daftar Administrator Sistem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Menampilkan {filteredAdmins.length} dari {adminList.length} akun pengelola dengan hak akses admin
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-6">ID &amp; Akun</th>
                    <th className="py-3.5 px-6">Nama Lengkap Administrator</th>
                    <th className="py-3.5 px-6">Kontak Email</th>
                    <th className="py-3.5 px-6">Tingkat Akses</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-200">
                  {isLoadingAdmins ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span className="text-xs font-medium">Memuat data administrator...</span>
                      </td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Tidak ada akun administrator ditemukan
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {adminSearch ? 'Coba ubah kata kunci pencarian Anda' : 'Klik tombol Tambah Admin Baru untuk menambahkan administrator'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((adm) => {
                      const isMasterAdmin = adm.ROLE === 'superadmin' || adm.USERNAME?.toLowerCase() === 'innedzaky';
                      const isCurrentSessionUser = currentAuthUser?.USERNAME === adm.USERNAME;

                      // Wewenang Edit: Super Admin boleh edit semua akun; Admin Biasa HANYA boleh edit akunnya sendiri
                      const canEdit = isSuperAdmin || isCurrentSessionUser;
                      let editTooltip = 'Edit profil administrator';
                      if (!isSuperAdmin && !isCurrentSessionUser) {
                        editTooltip = 'Admin biasa tidak memiliki wewenang mengedit akun admin lain ataupun Super Admin';
                      }

                      // Wewenang Hapus: Hanya Super Admin yang boleh hapus akun (kecuali master admin & akun sendiri)
                      let deleteTooltip = 'Hapus akun administrator';
                      let canDelete = isSuperAdmin && !isMasterAdmin && !isCurrentSessionUser;

                      if (isMasterAdmin) {
                        deleteTooltip = 'Akun Administrator Utama (Superadmin) dilindungi';
                      } else if (isCurrentSessionUser) {
                        deleteTooltip = 'Tidak dapat menghapus akun Anda sendiri saat sedang masuk';
                      } else if (!isSuperAdmin) {
                        deleteTooltip = 'Admin biasa tidak memiliki wewenang untuk menghapus akun administrator lainnya (Khusus Super Admin)';
                      }

                      return (
                        <tr
                          key={adm.ID_ADMIN}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-slate-200 dark:border-slate-700">
                                {adm.NAMA_LENGKAP.charAt(0) || 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>@{adm.USERNAME}</span>
                                {isCurrentSessionUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {adm.ID_ADMIN}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {adm.NAMA_LENGKAP}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {adm.EMAIL || `${adm.USERNAME}@sekolah.sch.id`}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {adm.ROLE === 'superadmin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Shield className="w-3.5 h-3.5" />
                              Administrator
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {adm.STATUS === 'aktif' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAdmin(adm)}
                              disabled={!canEdit}
                              title={editTooltip}
                              className={`p-2 rounded-lg transition-colors ${
                                canEdit
                                  ? 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer'
                                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDeleteAdmin(adm)}
                              disabled={!canDelete}
                              title={deleteTooltip}
                              className={`p-2 rounded-lg transition-colors ${
                                canDelete
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer'
                                  : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: KONFIGURASI BACKEND & API */}
      {/* ======================================================================= */}
      {activeTab === 'backend' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                Pilih Mode Operasional Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tentukan apakah aplikasi beroperasi secara offline mandiri (In-Memory Database) atau terhubung ke Cloud Database realtime.
              </p>
            </div>

            {/* Mode Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Demo Mode */}
              <div
                onClick={() => setIsLive(false)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  !isLive
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Cloud className="w-5 h-5" />
                  </div>
                  {!isLive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white shadow-xs">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mode Demo Standalone (Offline In-Memory)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Semua data tersimpan secara lokal dan persisten di browser. Sangat cepat, stabil, dan tidak memerlukan hosting Google Apps Script / Cloudflare API.
                </p>
              </div>

              {/* Option 2: Live Mode */}
              <div
                onClick={() => setIsLive(true)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isLive
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <Database className="w-5 h-5" />
                  </div>
                  {isLive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700 text-white shadow-xs">
                      <Check className="w-3 h-3" /> Terpilih
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mode Live (Cloudflare Workers / Google Spreadsheet API)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Menghubungkan aplikasi langsung dengan REST Web App / API backend secara realtime untuk sinkronisasi seluruh data ke cloud.
                </p>
              </div>
            </div>

            {/* URL Input Section (Active if Live) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                URL Endpoint API REST Backend
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => {
                    setGasUrl(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec atau https://api.guruapp.workers.dev"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border ${
                    urlError
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                  } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
                />
              </div>
              {urlError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {urlError}
                </p>
              )}
            </div>

            {/* Test Connection Button & Result */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !gasUrl.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Endpoint'}
              </button>

              <button
                type="button"
                onClick={handleSaveBackendConfig}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Konfigurasi Koneksi
              </button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: INFORMASI SISTEM & PEMELIHARAAN */}
      {/* ======================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Info Box */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Informasi Lingkungan Sistem
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Aplikasi</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Aplikasi Manajemen Guru</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Versi Build</span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">v2.4.0 (Enterprise)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Arsitektur Backend</span>
                  <span className="font-semibold text-slate-900 dark:text-white">High-Speed Serverless API Engine</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Sistem Database</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Distributed Cloud Database System</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 dark:text-slate-400">Status Administrator</span>
                  <span className="font-bold text-emerald-600">Terautentikasi (@{currentAuthUser?.USERNAME})</span>
                </div>
              </div>
            </div>

            {/* Maintenance & Reset Box */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <HardDriveDownload className="w-4 h-4 text-amber-600" />
                Pemeliharaan Penyimpanan Lokal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Jika terjadi ketidaksesuaian data cache lokal pada browser, Anda dapat mengatur ulang cache data ke keadaan default.
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetLocalCache}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 text-xs font-semibold rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Segarkan &amp; Reset Cache Lokal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create / Edit Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setEditingAdmin(null);
        }}
        onSave={handleSaveAdmin}
        admin={editingAdmin}
        isSaving={isSavingAdmin}
        isCurrentSuperAdmin={isSuperAdmin}
      />

      {/* Admin Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAdmin(null);
        }}
        onConfirm={handleConfirmDeleteAdmin}
        title="Hapus Akun Administrator"
        message={`Apakah Anda yakin ingin menghapus akun administrator @${deletingAdmin?.USERNAME} (${deletingAdmin?.NAMA_LENGKAP})? Tindakan ini akan mencabut seluruh hak akses pengelolaan sistem.`}
        isDeleting={isDeletingAdmin}
      />
    </div>
  );
};
