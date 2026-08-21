/**
 * =========================================================================
 * NilaiPage.tsx - Full Orchestrator for Phase 7 (Modul Nilai Siswa)
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { IKelas, IMapel, ISiswa, INilai } from '../types.ts';
import { NilaiHeader, NilaiConfig, JenisPenilaianType } from '../components/nilai/NilaiHeader.tsx';
import { NilaiInputTable } from '../components/nilai/NilaiInputTable.tsx';
import { NilaiHistoryTable } from '../components/nilai/NilaiHistoryTable.tsx';
import { NilaiEditModal } from '../components/nilai/NilaiEditModal.tsx';
import { NilaiDeleteModal } from '../components/nilai/NilaiDeleteModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const NilaiPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // Master Data State
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [allSiswa, setAllSiswa] = useState<ISiswa[]>([]);
  const [nilaiRecords, setNilaiRecords] = useState<INilai[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');

  // Academic Configuration
  const [config, setConfig] = useState<NilaiConfig>({
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kelas: '',
    mapel: '',
    jenisPenilaian: 'Tugas',
    namaPenilaian: 'Tugas 1 - SPLDV',
    tanggal: new Date().toISOString().split('T')[0]
  });

  // Modal States
  const [editingRecord, setEditingRecord] = useState<INilai | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<INilai | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial Master Data Fetching
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [kelasRes, mapelRes, siswaRes, nilaiRes] = await Promise.all([
        ApiClient.getKelas(),
        ApiClient.getMapel(),
        ApiClient.getSiswa(),
        ApiClient.getNilai()
      ]);

      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
        if (!config.kelas && kelasRes.data.length > 0) {
          setConfig((prev) => ({ ...prev, kelas: kelasRes.data[0].NAMA_KELAS }));
        }
      }

      if (mapelRes.success && mapelRes.data) {
        setMapelList(mapelRes.data);
        if (!config.mapel && mapelRes.data.length > 0) {
          setConfig((prev) => ({ ...prev, mapel: mapelRes.data[0].NAMA_MATA_PELAJARAN }));
        }
      }

      if (siswaRes.success && siswaRes.data) {
        setAllSiswa(siswaRes.data);
      }

      if (nilaiRes.success && nilaiRes.data) {
        setNilaiRecords(nilaiRes.data);
      }
    } catch (err: any) {
      showToast('error', `Gagal memuat data master: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsLoading(false);
    }
  }, [config.kelas, config.mapel]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filter students for the current selected class
  const classStudents = useMemo(() => {
    if (!config.kelas) return [];
    return (allSiswa || []).filter((s) => (s.KELAS || '').toLowerCase() === config.kelas.toLowerCase());
  }, [allSiswa, config.kelas]);

  // Handle configuration changes
  const handleConfigChange = (newValues: Partial<NilaiConfig>) => {
    setConfig((prev) => ({ ...prev, ...newValues }));
  };

  // Save Batch Grades (0-100 Validation already handled in NilaiInputTable)
  const handleSaveBatch = async (items: INilai[]): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await ApiClient.createNilaiBatch(items);
      if (res.success) {
        showToast(
          'success',
          `Berhasil menyimpan ${items.length} nilai siswa untuk "${config.namaPenilaian}" ke sheet Nilai!`
        );
        // Refresh grade records
        const fresh = await ApiClient.getNilai();
        if (fresh.success && fresh.data) {
          setNilaiRecords(fresh.data);
        }
        return true;
      } else {
        showToast('error', res.message || 'Gagal menyimpan nilai.');
        return false;
      }
    } catch (err: any) {
      showToast('error', `Gagal menyimpan batch nilai: ${err.message || 'Terjadi kesalahan'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit Record
  const handleOpenEditModal = (record: INilai) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedRecord: INilai): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await ApiClient.updateNilai(updatedRecord);
      if (res.success) {
        showToast('success', `Nilai ${updatedRecord.NAMA_SISWA} berhasil diperbarui!`);
        // Refresh local state
        const fresh = await ApiClient.getNilai();
        if (fresh.success && fresh.data) {
          setNilaiRecords(fresh.data);
        }
        return true;
      } else {
        showToast('error', res.message || 'Gagal memperbarui nilai.');
        return false;
      }
    } catch (err: any) {
      showToast('error', `Gagal update: ${err.message || 'Terjadi kesalahan'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Record
  const handleOpenDeleteModal = (record: INilai) => {
    setDeletingRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (record: INilai): Promise<boolean> => {
    if (!record._rowIndex) {
      showToast('error', 'Indeks baris rekaman tidak ditemukan.');
      return false;
    }
    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteNilai({ _rowIndex: record._rowIndex });
      if (res.success) {
        showToast('success', `Data nilai ${record.NAMA_SISWA} berhasil dihapus.`);
        const fresh = await ApiClient.getNilai();
        if (fresh.success && fresh.data) {
          setNilaiRecords(fresh.data);
        }
        return true;
      } else {
        showToast('error', res.message || 'Gagal menghapus rekaman nilai.');
        return false;
      }
    } catch (err: any) {
      showToast('error', `Gagal menghapus: ${err.message || 'Terjadi kesalahan'}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in slide-in-from-top-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Parameter Controls */}
      <NilaiHeader
        config={config}
        onChangeConfig={handleConfigChange}
        kelasList={kelasList}
        mapelList={mapelList}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        totalNilaiTersimpan={nilaiRecords.length}
      />

      {/* Main Content Body */}
      {isLoading ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Memuat Data Pembelajaran & Penilaian...
          </p>
        </div>
      ) : activeTab === 'input' ? (
        <NilaiInputTable
          students={classStudents}
          config={config}
          guruName={currentUser?.NAMA_GURU || 'Guru Pengajar'}
          onSaveBatch={handleSaveBatch}
          isSaving={isSaving}
          onShowValidationToast={(msg) => showToast('warning', msg)}
        />
      ) : (
        <NilaiHistoryTable
          records={nilaiRecords}
          kelasList={kelasList}
          mapelList={mapelList}
          onEditRecord={handleOpenEditModal}
          onDeleteRecord={handleOpenDeleteModal}
          isLoading={isLoading}
          onRefresh={fetchAllData}
        />
      )}

      {/* Edit Modal Dialog */}
      <NilaiEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={editingRecord}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal Dialog */}
      <NilaiDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        record={deletingRecord}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
