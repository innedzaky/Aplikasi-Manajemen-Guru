/**
 * =========================================================================
 * GuruPage.tsx - Master Data Guru Management Page
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UserCheck,
  Shield
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IGuru, IMapel } from '../types.ts';
import { PageRoute } from '../components/layout/Sidebar.tsx';
import { MasterTabsNav } from '../components/master/MasterTabsNav.tsx';
import { GuruTable } from '../components/master/GuruTable.tsx';
import { GuruModal } from '../components/master/GuruModal.tsx';
import { DeleteConfirmModal } from '../components/master/DeleteConfirmModal.tsx';

interface GuruPageProps {
  onNavigateTab?: (tab: PageRoute) => void;
}

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const GuruPage: React.FC<GuruPageProps> = ({ onNavigateTab }) => {
  // Data States
  const [guruList, setGuruList] = useState<IGuru[]>([]);
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGuru, setEditingGuru] = useState<IGuru | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingGuru, setDeletingGuru] = useState<IGuru | null>(null);

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
      const [guruRes, mapelRes] = await Promise.all([
        ApiClient.getGuru(),
        ApiClient.getMapel()
      ]);

      if (guruRes.success && guruRes.data) {
        setGuruList(guruRes.data);
      } else {
        showToast('error', guruRes.message || 'Gagal memuat data Guru');
      }

      if (mapelRes.success && mapelRes.data) {
        setMapelList(mapelRes.data);
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

  // Filtered Guru List
  const filteredGuru = useMemo(() => {
    return (guruList || []).filter((g) => {
      if (!g) return false;
      if (selectedMapel && (g.MAPEL || '').toLowerCase() !== selectedMapel.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (g.NAMA_GURU || '').toLowerCase().includes(q);
        const matchUser = (g.USERNAME || '').toLowerCase().includes(q);
        const matchId = (g.ID_GURU || '').toLowerCase().includes(q);
        const matchMapel = g.MAPEL ? g.MAPEL.toLowerCase().includes(q) : false;
        if (!matchName && !matchUser && !matchId && !matchMapel) return false;
      }
      return true;
    });
  }, [guruList, selectedMapel, search]);

  // Unique Mapel options from Guru list + Mapel master
  const mapelOptions = useMemo(() => {
    const set = new Set<string>();
    mapelList.forEach((m) => m.NAMA_MATA_PELAJARAN && set.add(m.NAMA_MATA_PELAJARAN));
    guruList.forEach((g) => g.MAPEL && set.add(g.MAPEL));
    return Array.from(set).sort();
  }, [guruList, mapelList]);

  // Handle Save (Create or Update)
  const handleSaveGuru = async (data: IGuru): Promise<boolean> => {
    setIsSaving(true);
    try {
      if (editingGuru) {
        // Update
        const res = await ApiClient.updateGuru({
          ID_GURU: data.ID_GURU,
          NAMA_GURU: data.NAMA_GURU,
          USERNAME: data.USERNAME,
          MAPEL: data.MAPEL,
          PASSWORD: data.PASSWORD
        });

        if (res.success) {
          showToast('success', `Data guru ${data.NAMA_GURU} berhasil diperbarui.`);
          setGuruList((prev) =>
            prev.map((g) => (g.ID_GURU === data.ID_GURU ? { ...g, ...data } : g))
          );
          setIsModalOpen(false);
          setEditingGuru(null);
          return true;
        } else {
          showToast('error', res.message || 'Gagal memperbarui data guru');
          return false;
        }
      } else {
        // Create
        const res = await ApiClient.createGuru(data);
        if (res.success && res.data) {
          showToast('success', `Guru ${data.NAMA_GURU} berhasil ditambahkan ke database.`);
          setGuruList((prev) => [...prev, res.data!]);
          setIsModalOpen(false);
          return true;
        } else {
          showToast('error', res.message || 'Gagal menambahkan guru');
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
  const handleDeleteGuru = async () => {
    if (!deletingGuru) return;

    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteGuru(deletingGuru.ID_GURU);
      if (res.success) {
        showToast('success', `Guru ${deletingGuru.NAMA_GURU} berhasil dihapus.`);
        setGuruList((prev) => prev.filter((g) => g.ID_GURU !== deletingGuru.ID_GURU));
        setIsDeleteModalOpen(false);
        setDeletingGuru(null);
      } else {
        showToast('error', res.message || 'Gagal menghapus data guru');
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
          activeRoute="guru"
          onSelectTab={onNavigateTab}
          counts={{ guru: guruList.length }}
        />
      )}

      {/* Header & Metric Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Master Data Guru
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  {guruList.length} Pendidik
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Kelola daftar tenaga pengajar, akun otentikasi login, dan mata pelajaran diampu
              </p>
            </div>
          </div>

          {/* Action Button: Tambah Guru */}
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
                setEditingGuru(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru</span>
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
              placeholder="Cari nama guru, username, mapel, atau ID Guru..."
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

          {/* Filter Mapel */}
          <div className="sm:col-span-4 relative">
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Mata Pelajaran</option>
              {mapelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
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
            Memuat data Guru dari Google Sheet...
          </p>
        </div>
      ) : filteredGuru.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search || selectedMapel
                ? 'Tidak ada guru yang sesuai'
                : 'Belum Ada Data Guru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {search || selectedMapel
                ? 'Coba sesuaikan kata kunci pencarian atau reset filter mata pelajaran.'
                : 'Mulai daftarkan tenaga pendidik pertama Anda sekarang.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {search || selectedMapel ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedMapel('');
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
                  setEditingGuru(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Guru Pertama</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan <strong>{filteredGuru.length}</strong> dari{' '}
              <strong>{guruList.length}</strong> guru terdaftar
            </span>
          </div>
          <GuruTable
            records={filteredGuru}
            onEdit={(guru) => {
              setEditingGuru(guru);
              setIsModalOpen(true);
            }}
            onDelete={(guru) => {
              setDeletingGuru(guru);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <GuruModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGuru(null);
        }}
        onSave={handleSaveGuru}
        guru={editingGuru}
        mapelList={mapelList}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingGuru(null);
        }}
        onConfirm={handleDeleteGuru}
        title="Hapus Data Guru"
        itemName={deletingGuru?.NAMA_GURU || ''}
        itemType="Guru"
        isDeleting={isDeleting}
        extraWarning="Menghapus akun guru akan mencabut akses login pengguna ini ke sistem."
      />
    </div>
  );
};
