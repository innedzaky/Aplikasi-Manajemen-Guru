/**
 * =========================================================================
 * KelasPage.tsx - Master Data Kelas Management Page
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  School,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  Users,
  UserCheck
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IKelas, IGuru, ISiswa } from '../types.ts';
import { PageRoute } from '../components/layout/Sidebar.tsx';
import { MasterTabsNav } from '../components/master/MasterTabsNav.tsx';
import { KelasTable } from '../components/master/KelasTable.tsx';
import { KelasModal } from '../components/master/KelasModal.tsx';
import { DeleteConfirmModal } from '../components/master/DeleteConfirmModal.tsx';

interface KelasPageProps {
  onNavigateTab?: (tab: PageRoute) => void;
}

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const KelasPage: React.FC<KelasPageProps> = ({ onNavigateTab }) => {
  // Data States
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [guruList, setGuruList] = useState<IGuru[]>([]);
  const [siswaList, setSiswaList] = useState<ISiswa[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingKelas, setEditingKelas] = useState<IKelas | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingKelas, setDeletingKelas] = useState<IKelas | null>(null);

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
      const [kelasRes, guruRes, siswaRes] = await Promise.all([
        ApiClient.getKelas(),
        ApiClient.getGuru(),
        ApiClient.getSiswa()
      ]);

      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
      } else {
        showToast('error', kelasRes.message || 'Gagal memuat data Kelas');
      }

      if (guruRes.success && guruRes.data) {
        setGuruList(guruRes.data);
      }

      if (siswaRes.success && siswaRes.data) {
        setSiswaList(siswaRes.data);
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

  // Student count map per class
  const studentCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    siswaList.forEach((s) => {
      const k = s.KELAS;
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [siswaList]);

  // Filtered Kelas List
  const filteredKelas = useMemo(() => {
    return kelasList.filter((k) => {
      if (selectedTingkat) {
        if (!k.NAMA_KELAS.startsWith(selectedTingkat)) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = k.NAMA_KELAS.toLowerCase().includes(q);
        const matchId = k.ID_KELAS.toLowerCase().includes(q);
        const matchWali = k.WALI_KELAS ? k.WALI_KELAS.toLowerCase().includes(q) : false;
        if (!matchName && !matchId && !matchWali) return false;
      }
      return true;
    });
  }, [kelasList, selectedTingkat, search]);

  // Handle Save (Create or Update)
  const handleSaveKelas = async (data: IKelas): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (editingKelas) {
        // Update
        const res = await ApiClient.updateKelas({
          ID_KELAS: data.ID_KELAS,
          NAMA_KELAS: data.NAMA_KELAS,
          WALI_KELAS: data.WALI_KELAS
        });

        if (res.success) {
          showToast('success', `Data kelas ${data.NAMA_KELAS} berhasil diperbarui.`);
          setKelasList((prev) =>
            prev.map((k) => (k.ID_KELAS === data.ID_KELAS ? { ...k, ...data } : k))
          );
          setIsModalOpen(false);
          setEditingKelas(null);
          return true;
        } else {
          showToast('error', res.message || 'Gagal memperbarui data kelas');
          return false;
        }
      } else {
        // Create
        const res = await ApiClient.createKelas(data);
        if (res.success && res.data) {
          showToast('success', `Kelas ${data.NAMA_KELAS} berhasil ditambahkan ke database.`);
          setKelasList((prev) => [...prev, res.data!]);
          setIsModalOpen(false);
          return true;
        } else {
          showToast('error', res.message || 'Gagal menambahkan kelas');
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
  const handleDeleteKelas = async () => {
    if (!deletingKelas) return;

    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteKelas(deletingKelas.ID_KELAS);
      if (res.success) {
        showToast('success', `Kelas ${deletingKelas.NAMA_KELAS} berhasil dihapus.`);
        setKelasList((prev) => prev.filter((k) => k.ID_KELAS !== deletingKelas.ID_KELAS));
        setIsDeleteModalOpen(false);
        setDeletingKelas(null);
      } else {
        showToast('error', res.message || 'Gagal menghapus data kelas');
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
          activeRoute="kelas"
          onSelectTab={onNavigateTab}
          counts={{ kelas: kelasList.length }}
        />
      )}

      {/* Header & Metric Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Master Data Kelas
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {kelasList.length} Rombel
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kelola data rombongan belajar, penetapan wali kelas, dan pembagian siswa
              </p>
            </div>
          </div>

          {/* Action Button: Tambah Kelas */}
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
                setEditingKelas(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Live Search */}
          <div className="sm:col-span-8 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kelas, wali kelas, atau ID Kelas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
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

          {/* Filter Tingkat */}
          <div className="sm:col-span-4 relative">
            <select
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Tingkat</option>
              <option value="X">Kelas X (Sepuluh)</option>
              <option value="XI">Kelas XI (Sebelas)</option>
              <option value="XII">Kelas XII (Dua Belas)</option>
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
            Memuat data Kelas dari Google Sheet...
          </p>
        </div>
      ) : filteredKelas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <School className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search || selectedTingkat
                ? 'Tidak ada kelas yang sesuai'
                : 'Belum Ada Data Kelas'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {search || selectedTingkat
                ? 'Coba sesuaikan kata kunci pencarian atau reset filter tingkat kelas.'
                : 'Mulai daftarkan rombongan belajar pertama Anda ke dalam sistem.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {search || selectedTingkat ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedTingkat('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingKelas(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kelas Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan <strong>{filteredKelas.length}</strong> dari{' '}
              <strong>{kelasList.length}</strong> rombel kelas terdaftar
            </span>
          </div>
          <KelasTable
            records={filteredKelas}
            studentCountMap={studentCountMap}
            onEdit={(kelas) => {
              setEditingKelas(kelas);
              setIsModalOpen(true);
            }}
            onDelete={(kelas) => {
              setDeletingKelas(kelas);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <KelasModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingKelas(null);
        }}
        onSave={handleSaveKelas}
        kelas={editingKelas}
        guruList={guruList}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingKelas(null);
        }}
        onConfirm={handleDeleteKelas}
        title="Hapus Data Kelas"
        itemName={deletingKelas?.NAMA_KELAS || ''}
        itemType="Kelas"
        isDeleting={isDeleting}
        extraWarning="Pastikan tidak ada siswa aktif yang masih terdaftar di rombel kelas ini sebelum menghapus."
      />
    </div>
  );
};
