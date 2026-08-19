/**
 * =========================================================================
 * SiswaPage.tsx - Master Data Siswa Management Page
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserSquare2,
  Plus,
  Search,
  RotateCcw,
  School,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Users,
  UserCheck
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { ISiswa, IKelas } from '../types.ts';
import { PageRoute } from '../components/layout/Sidebar.tsx';
import { MasterTabsNav } from '../components/master/MasterTabsNav.tsx';
import { SiswaTable } from '../components/master/SiswaTable.tsx';
import { SiswaModal } from '../components/master/SiswaModal.tsx';
import { DeleteConfirmModal } from '../components/master/DeleteConfirmModal.tsx';

interface SiswaPageProps {
  onNavigateTab?: (tab: PageRoute) => void;
}

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const SiswaPage: React.FC<SiswaPageProps> = ({ onNavigateTab }) => {
  // Data States
  const [siswaList, setSiswaList] = useState<ISiswa[]>([]);
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedJk, setSelectedJk] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSiswa, setEditingSiswa] = useState<ISiswa | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingSiswa, setDeletingSiswa] = useState<ISiswa | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial Fetch
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [siswaRes, kelasRes] = await Promise.all([
        ApiClient.getSiswa(),
        ApiClient.getKelas()
      ]);

      if (siswaRes.success && siswaRes.data) {
        setSiswaList(siswaRes.data);
      } else {
        showToast('error', siswaRes.message || 'Gagal memuat data Siswa');
      }

      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Siswa List
  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      if (selectedKelas && s.KELAS.toLowerCase() !== selectedKelas.toLowerCase()) {
        return false;
      }
      if (selectedJk && s.JENIS_KELAMIN !== selectedJk) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.NAMA.toLowerCase().includes(q);
        const matchNisn = s.NISN.includes(q);
        const matchKelas = s.KELAS.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchKelas) return false;
      }
      return true;
    });
  }, [siswaList, selectedKelas, selectedJk, search]);

  // Unique Kelas options from Kelas master + Siswa list
  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    kelasList.forEach((k) => k.NAMA_KELAS && set.add(k.NAMA_KELAS));
    siswaList.forEach((s) => s.KELAS && set.add(s.KELAS));
    return Array.from(set).sort();
  }, [siswaList, kelasList]);

  // Handle Save (Create or Update)
  const handleSaveSiswa = async (data: ISiswa): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (editingSiswa) {
        // Update
        const res = await ApiClient.updateSiswa({
          NISN: data.NISN,
          NAMA: data.NAMA,
          KELAS: data.KELAS,
          JENIS_KELAMIN: data.JENIS_KELAMIN
        });

        if (res.success) {
          showToast('success', `Data siswa ${data.NAMA} berhasil diperbarui.`);
          setSiswaList((prev) =>
            prev.map((s) => (s.NISN === data.NISN ? { ...s, ...data } : s))
          );
          setIsModalOpen(false);
          setEditingSiswa(null);
          return true;
        } else {
          showToast('error', res.message || 'Gagal memperbarui data siswa');
          return false;
        }
      } else {
        // Create
        const res = await ApiClient.createSiswa(data);
        if (res.success && res.data) {
          showToast('success', `Siswa ${data.NAMA} berhasil didaftarkan ke sheet Siswa.`);
          setSiswaList((prev) => [...prev, res.data!]);
          setIsModalOpen(false);
          return true;
        } else {
          showToast('error', res.message || 'Gagal menambahkan siswa');
          return false;
        }
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (err.message || err));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteSiswa = async () => {
    if (!deletingSiswa) return;

    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteSiswa(deletingSiswa.NISN);
      if (res.success) {
        showToast('success', `Siswa ${deletingSiswa.NAMA} berhasil dihapus.`);
        setSiswaList((prev) => prev.filter((s) => s.NISN !== deletingSiswa.NISN));
        setIsDeleteModalOpen(false);
        setDeletingSiswa(null);
      } else {
        showToast('error', res.message || 'Gagal menghapus data siswa');
      }
    } catch (err: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all animate-in slide-in-from-top-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : toast.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
              : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unified Master Data Tab Navigation */}
      {onNavigateTab && (
        <MasterTabsNav
          activeRoute="siswa"
          onSelectTab={onNavigateTab}
          counts={{ siswa: siswaList.length }}
        />
      )}

      {/* Header & Metric Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserSquare2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Master Data Siswa
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {siswaList.length} Siswa
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Daftar lengkap peserta didik terdaftar, pembagian kelas, dan NISN
              </p>
            </div>
          </div>

          {/* Action Button: Tambah Siswa */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSiswa(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Live Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa, NISN, atau kelas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Kelas */}
          <div className="sm:col-span-3 relative">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Jenis Kelamin */}
          <div className="sm:col-span-3 relative">
            <select
              value={selectedJk}
              onChange={(e) => setSelectedJk(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Gender (L/P)</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Memuat data Siswa dari Google Sheet...
          </p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <UserSquare2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search || selectedKelas || selectedJk
                ? 'Tidak ada siswa yang sesuai'
                : 'Belum Ada Data Siswa'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {search || selectedKelas || selectedJk
                ? 'Coba sesuaikan kata kunci pencarian atau reset filter kelas / gender.'
                : 'Mulai daftarkan peserta didik pertama Anda ke dalam sistem.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {search || selectedKelas || selectedJk ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedKelas('');
                  setSelectedJk('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingSiswa(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan <strong>{filteredSiswa.length}</strong> dari{' '}
              <strong>{siswaList.length}</strong> siswa terdaftar
            </span>
          </div>
          <SiswaTable
            records={filteredSiswa}
            onEdit={(siswa) => {
              setEditingSiswa(siswa);
              setIsModalOpen(true);
            }}
            onDelete={(siswa) => {
              setDeletingSiswa(siswa);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <SiswaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSiswa(null);
        }}
        onSave={handleSaveSiswa}
        siswa={editingSiswa}
        kelasList={kelasList}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSiswa(null);
        }}
        onConfirm={handleDeleteSiswa}
        title="Hapus Data Siswa"
        itemName={deletingSiswa?.NAMA || ''}
        itemType="Siswa"
        isDeleting={isDeleting}
        extraWarning="Menghapus data siswa tidak akan menghapus nilai atau presensi historis terdahulu, namun siswa ini tidak akan muncul lagi di daftar presensi baru."
      />
    </div>
  );
};
