/**
 * =========================================================================
 * PresensiPage.tsx - Modul Presensi Siswa Full Orchestrator & API Integration
 * =========================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IPresensi, IKelas, IMapel, ISiswa, IAuthUser } from '../types.ts';
import { PresensiHeader, PresensiConfig } from '../components/presensi/PresensiHeader.tsx';
import { PresensiInputTable } from '../components/presensi/PresensiInputTable.tsx';
import { PresensiHistoryTable } from '../components/presensi/PresensiHistoryTable.tsx';
import { PresensiEditModal } from '../components/presensi/PresensiEditModal.tsx';
import { PresensiDeleteModal } from '../components/presensi/PresensiDeleteModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const PresensiPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Master & Transaction States
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [allSiswa, setAllSiswa] = useState<ISiswa[]>([]);
  const [presensiRecords, setPresensiRecords] = useState<IPresensi[]>([]);

  // UI Flow States
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modals State
  const [editingRecord, setEditingRecord] = useState<IPresensi | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<IPresensi | null>(null);

  // Presensi Form Header Config
  const [config, setConfig] = useState<PresensiConfig>({
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kelas: '',
    mapel: '',
    pertemuan: 1,
    tanggal: new Date().toISOString().split('T')[0]
  });

  // Show auto-clearing toast
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch initial master data & presensi history
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Master Kelas, Mapel, Siswa, dan Presensi secara paralel
      const [resKelas, resMapel, resSiswa, resPresensi] = await Promise.all([
        ApiClient.getKelas(),
        ApiClient.getMapel(),
        ApiClient.getSiswa(),
        ApiClient.getPresensi()
      ]);

      const kelasData = resKelas.data || [];
      const mapelData = resMapel.data || [];
      const siswaData = resSiswa.data || [];
      const presensiData = resPresensi.data || [];

      setKelasList(kelasData);
      setMapelList(mapelData);
      setAllSiswa(siswaData);
      setPresensiRecords(presensiData);

      // Inisialisasi default kelas & mapel pada konfigurasi jika belum ada
      setConfig((prev) => ({
        ...prev,
        kelas: prev.kelas || (kelasData[0] ? kelasData[0].NAMA_KELAS : 'X TKJ 1'),
        mapel: prev.mapel || (currentUser?.MAPEL && currentUser.MAPEL !== 'Semua' ? currentUser.MAPEL : mapelData[0]?.NAMA_MATA_PELAJARAN || 'Matematika')
      }));
    } catch (err: any) {
      console.error('Gagal mengambil data Presensi:', err);
      setError(err.message || 'Gagal memuat data presensi dan master kelas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Siswa yang difilter untuk kelas yang sedang dipilih
  const currentClassStudents = allSiswa.filter(
    (s) => s.KELAS.toLowerCase() === config.kelas.toLowerCase()
  );

  // Update Config Handler
  const handleConfigChange = (newConfig: Partial<PresensiConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // ---------------------------------------------------------------------------
  // Action: Simpan Batch Presensi
  // ---------------------------------------------------------------------------
  const handleSaveBatch = async (items: IPresensi[]): Promise<boolean> => {
    if (!config.kelas || !config.mapel || !config.tanggal) {
      showToast('error', 'Silakan lengkapi pilihan Kelas, Mata Pelajaran, dan Tanggal terlebih dahulu.');
      return false;
    }

    setIsSaving(true);
    try {
      const res = await ApiClient.createPresensiBatch(items);
      if (res.success) {
        showToast('success', `Berhasil! ${items.length} data presensi kelas ${config.kelas} telah tersimpan ke sheet.`);
        // Refresh presensi history
        const refreshed = await ApiClient.getPresensi();
        if (refreshed.data) {
          setPresensiRecords(refreshed.data);
        }
        return true;
      } else {
        showToast('error', res.message || 'Gagal menyimpan presensi ke spreadsheet.');
        return false;
      }
    } catch (err: any) {
      console.error('Error createPresensiBatch:', err);
      showToast('error', err.message || 'Terjadi kesalahan saat menyimpan presensi.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action: Update Presensi Row
  // ---------------------------------------------------------------------------
  const handleUpdateRecord = async (updated: IPresensi): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await ApiClient.updatePresensi(updated);
      if (res.success) {
        showToast('success', `Presensi siswa ${updated.NAMA_SISWA} berhasil diperbarui.`);
        // Update local state
        setPresensiRecords((prev) =>
          prev.map((p) =>
            (p._rowIndex && p._rowIndex === updated._rowIndex) ||
            (p.TANGGAL === updated.TANGGAL && p.NAMA_SISWA === updated.NAMA_SISWA && String(p.PERTEMUAN) === String(updated.PERTEMUAN))
              ? { ...p, ...updated }
              : p
          )
        );
        return true;
      } else {
        showToast('error', res.message || 'Gagal memperbarui presensi.');
        return false;
      }
    } catch (err: any) {
      console.error('Error updatePresensi:', err);
      showToast('error', err.message || 'Terjadi kesalahan sistem saat memperbarui.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action: Delete Presensi Row
  // ---------------------------------------------------------------------------
  const handleDeleteRecord = async (record: IPresensi): Promise<boolean> => {
    if (!record._rowIndex) {
      showToast('error', 'Gagal menghapus: ID baris data tidak terdefinisi.');
      return false;
    }

    setIsDeleting(true);
    try {
      const res = await ApiClient.deletePresensi({ _rowIndex: record._rowIndex });
      if (res.success) {
        showToast('success', `Presensi ${record.NAMA_SISWA} berhasil dihapus dari sheet.`);
        // Remove from local state
        setPresensiRecords((prev) => prev.filter((p) => p._rowIndex !== record._rowIndex));
        return true;
      } else {
        showToast('error', res.message || 'Gagal menghapus presensi.');
        return false;
      }
    } catch (err: any) {
      console.error('Error deletePresensi:', err);
      showToast('error', err.message || 'Terjadi kesalahan saat menghapus data.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner text="Memuat modul presensi, daftar kelas, dan riwayat kehadiran..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorState
          title="Gagal Memuat Modul Presensi"
          message={error}
          onRetry={fetchAllData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800'
              : 'bg-slate-900 dark:bg-slate-900 text-slate-100 dark:text-slate-100 border-slate-700 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-300 dark:text-slate-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Presensi Header & Parameter Controls */}
      <PresensiHeader
        config={config}
        onChangeConfig={handleConfigChange}
        kelasList={kelasList}
        mapelList={mapelList}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        totalPresensiTersimpan={presensiRecords.length}
      />

      {/* Main Tab Content */}
      {activeTab === 'input' ? (
        <PresensiInputTable
          students={currentClassStudents}
          config={config}
          guruName={currentUser?.NAMA_GURU || 'Guru Pengajar'}
          onSaveBatch={handleSaveBatch}
          isSaving={isSaving}
        />
      ) : (
        <PresensiHistoryTable
          records={presensiRecords}
          kelasList={kelasList}
          mapelList={mapelList}
          onEditRecord={(record) => setEditingRecord(record)}
          onDeleteRecord={(record) => setDeletingRecord(record)}
          isLoading={isLoading}
          onRefresh={fetchAllData}
        />
      )}

      {/* Edit Modal Dialog */}
      <PresensiEditModal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSave={handleUpdateRecord}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal Dialog */}
      <PresensiDeleteModal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        record={deletingRecord}
        onConfirmDelete={handleDeleteRecord}
        isDeleting={isDeleting}
      />
    </div>
  );
};
