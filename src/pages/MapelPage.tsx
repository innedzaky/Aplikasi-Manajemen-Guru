/**
 * =========================================================================
 * MapelPage.tsx - Master Data Mata Pelajaran Management Page
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Users
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IMapel, IGuru } from '../types.ts';
import { PageRoute } from '../components/layout/Sidebar.tsx';
import { MasterTabsNav } from '../components/master/MasterTabsNav.tsx';
import { MapelTable } from '../components/master/MapelTable.tsx';
import { MapelModal } from '../components/master/MapelModal.tsx';
import { DeleteConfirmModal } from '../components/master/DeleteConfirmModal.tsx';

interface MapelPageProps {
  onNavigateTab?: (tab: PageRoute) => void;
}

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const MapelPage: React.FC<MapelPageProps> = ({ onNavigateTab }) => {
  // Data States
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [guruList, setGuruList] = useState<IGuru[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filter States
  const [search, setSearch] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMapel, setEditingMapel] = useState<IMapel | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingMapel, setDeletingMapel] = useState<IMapel | null>(null);

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
      const [mapelRes, guruRes] = await Promise.all([
        ApiClient.getMapel(),
        ApiClient.getGuru()
      ]);

      if (mapelRes.success && mapelRes.data) {
        setMapelList(mapelRes.data);
      } else {
        showToast('error', mapelRes.message || 'Gagal memuat data Mata Pelajaran');
      }

      if (guruRes.success && guruRes.data) {
        setGuruList(guruRes.data);
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

  // Teacher count map per Mapel
  const teacherCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    guruList.forEach((g) => {
      if (g.MAPEL) {
        map[g.MAPEL] = (map[g.MAPEL] || 0) + 1;
      }
    });
    return map;
  }, [guruList]);

  // Filtered Mapel List
  const filteredMapel = useMemo(() => {
    return mapelList.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = m.NAMA_MATA_PELAJARAN.toLowerCase().includes(q);
        const matchId = m.ID_MAPEL.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [mapelList, search]);

  // Handle Save (Create or Update)
  const handleSaveMapel = async (data: IMapel): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (editingMapel) {
        // Update
        const res = await ApiClient.updateMapel({
          ID_MAPEL: data.ID_MAPEL,
          NAMA_MATA_PELAJARAN: data.NAMA_MATA_PELAJARAN
        });

        if (res.success) {
          showToast('success', `Mata pelajaran ${data.NAMA_MATA_PELAJARAN} berhasil diperbarui.`);
          setMapelList((prev) =>
            prev.map((m) => (m.ID_MAPEL === data.ID_MAPEL ? { ...m, ...data } : m))
          );
          setIsModalOpen(false);
          setEditingMapel(null);
          return true;
        } else {
          showToast('error', res.message || 'Gagal memperbarui data mata pelajaran');
          return false;
        }
      } else {
        // Create
        const res = await ApiClient.createMapel(data);
        if (res.success && res.data) {
          showToast('success', `Mata pelajaran ${data.NAMA_MATA_PELAJARAN} berhasil ditambahkan.`);
          setMapelList((prev) => [...prev, res.data!]);
          setIsModalOpen(false);
          return true;
        } else {
          showToast('error', res.message || 'Gagal menambahkan mata pelajaran');
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
  const handleDeleteMapel = async () => {
    if (!deletingMapel) return;

    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteMapel(deletingMapel.ID_MAPEL);
      if (res.success) {
        showToast('success', `Mata pelajaran ${deletingMapel.NAMA_MATA_PELAJARAN} berhasil dihapus.`);
        setMapelList((prev) => prev.filter((m) => m.ID_MAPEL !== deletingMapel.ID_MAPEL));
        setIsDeleteModalOpen(false);
        setDeletingMapel(null);
      } else {
        showToast('error', res.message || 'Gagal menghapus mata pelajaran');
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
          activeRoute="mapel"
          onSelectTab={onNavigateTab}
          counts={{ mapel: mapelList.length }}
        />
      )}

      {/* Header & Metric Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Master Mata Pelajaran
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  {mapelList.length} Mata Pelajaran
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kelola daftar kurikulum mata pelajaran terdata dan kode mapel resmi
              </p>
            </div>
          </div>

          {/* Action Button: Tambah Mapel */}
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
                setEditingMapel(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>
        </div>

        {/* Search Control */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama mata pelajaran atau kode mapel..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
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
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Memuat data Mata Pelajaran dari Google Sheet...
          </p>
        </div>
      ) : filteredMapel.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-100 dark:border-amber-900">
            <BookMarked className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search
                ? 'Tidak ada mata pelajaran yang sesuai'
                : 'Belum Ada Data Mata Pelajaran'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {search
                ? 'Coba sesuaikan kata kunci pencarian.'
                : 'Mulai daftarkan mata pelajaran kurikulum pertama Anda ke dalam sistem.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pencarian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingMapel(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mapel Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan <strong>{filteredMapel.length}</strong> dari{' '}
              <strong>{mapelList.length}</strong> mata pelajaran terdaftar
            </span>
          </div>
          <MapelTable
            records={filteredMapel}
            teacherCountMap={teacherCountMap}
            onEdit={(mapel) => {
              setEditingMapel(mapel);
              setIsModalOpen(true);
            }}
            onDelete={(mapel) => {
              setDeletingMapel(mapel);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <MapelModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMapel(null);
        }}
        onSave={handleSaveMapel}
        mapel={editingMapel}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingMapel(null);
        }}
        onConfirm={handleDeleteMapel}
        title="Hapus Mata Pelajaran"
        itemName={deletingMapel?.NAMA_MATA_PELAJARAN || ''}
        itemType="Mata Pelajaran"
        isDeleting={isDeleting}
        extraWarning="Menghapus mata pelajaran tidak menghapus riwayat nilai atau jurnal terdahulu yang telah dicatat."
      />
    </div>
  );
};
