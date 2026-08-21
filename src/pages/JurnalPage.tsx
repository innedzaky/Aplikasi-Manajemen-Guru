/**
 * =========================================================================
 * JurnalPage.tsx - Full Orchestrator for Phase 8 (Modul Jurnal Mengajar)
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { IKelas, IMapel, IJurnal } from '../types.ts';
import { StatsCalculator } from '../utils/statsCalculator.ts';
import { JurnalHeader, JurnalFilterState } from '../components/jurnal/JurnalHeader.tsx';
import { JurnalForm } from '../components/jurnal/JurnalForm.tsx';
import { JurnalList } from '../components/jurnal/JurnalList.tsx';
import { JurnalDetailModal } from '../components/jurnal/JurnalDetailModal.tsx';
import { JurnalEditModal } from '../components/jurnal/JurnalEditModal.tsx';
import { JurnalDeleteModal } from '../components/jurnal/JurnalDeleteModal.tsx';
import { ExportUtils, ExportFormat, IExportReportMetadata } from '../utils/exportUtils.ts';
import { ExportModal } from '../components/common/ExportModal.tsx';

interface ToastState {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const JurnalPage: React.FC = () => {
  const { user } = useAuth();
  const currentGuru = user?.NAMA_GURU || 'Budi Santoso, S.Pd.';

  // Master & Jurnal Data State
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [jurnalRecords, setJurnalRecords] = useState<IJurnal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Tab & View States
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter State
  const [filter, setFilter] = useState<JurnalFilterState>({
    search: '',
    kelas: '',
    mapel: '',
    guru: 'ALL',
    semester: 'ALL',
    tahunPelajaran: 'ALL',
    status: '',
    tanggal: ''
  });

  // Extract unique teachers from Jurnal
  const uniqueGurus = useMemo(() => {
    const fromRecords = jurnalRecords.map((j) => j.GURU).filter(Boolean);
    return Array.from(new Set(fromRecords)) as string[];
  }, [jurnalRecords]);

  // Modal States
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<IJurnal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState<IJurnal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingRecord, setDeletingRecord] = useState<IJurnal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExport = (format: ExportFormat, meta: Partial<IExportReportMetadata>) => {
    ExportUtils.exportJurnal(filteredRecords, format, {
      ...meta,
      kelas: filter.kelas || 'Semua Kelas',
      mapel: filter.mapel || 'Semua Mapel',
      namaGuru: (filter.guru && filter.guru !== 'ALL') ? filter.guru : currentGuru,
      semester: (filter.semester && filter.semester !== 'ALL') ? filter.semester : 'Ganjil',
      tahunPelajaran: (filter.tahunPelajaran && filter.tahunPelajaran !== 'ALL') ? filter.tahunPelajaran : '2025/2026'
    });
  };

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial Data Fetching
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [kelasRes, mapelRes, jurnalRes] = await Promise.all([
        ApiClient.getKelas(),
        ApiClient.getMapel(),
        ApiClient.getJurnal()
      ]);

      if (kelasRes.success && kelasRes.data) {
        setKelasList(kelasRes.data);
      }
      if (mapelRes.success && mapelRes.data) {
        setMapelList(mapelRes.data);
      }
      if (jurnalRes.success && jurnalRes.data) {
        setJurnalRecords(jurnalRes.data);
      }
    } catch (e: any) {
      showToast('error', 'Gagal memuat data awal: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Statistics Calculation using StatsCalculator
  const stats = useMemo(() => {
    const detail = StatsCalculator.calculateJurnalStats(jurnalRecords);
    return {
      total: detail.total,
      terlaksana: detail.terlaksana,
      sebagian: detail.sebagian,
      tidakTerlaksana: detail.tidakTerlaksana,
      rate: detail.persentaseTerlaksana
    };
  }, [jurnalRecords]);

  // Filtered & Searched Records
  const filteredRecords = useMemo(() => {
    return jurnalRecords.filter((record) => {
      // Filter Tanggal
      if (filter.tanggal && record.TANGGAL !== filter.tanggal) {
        return false;
      }
      // Filter Guru
      if (filter.guru && filter.guru !== 'ALL' && record.GURU !== filter.guru) {
        return false;
      }
      // Filter Kelas
      if (filter.kelas && (record.KELAS || '').toLowerCase() !== filter.kelas.toLowerCase()) {
        return false;
      }
      // Filter Mapel
      if (filter.mapel && (record.MAPEL || '').toLowerCase() !== filter.mapel.toLowerCase()) {
        return false;
      }
      // Filter Status
      if (filter.status && (record.STATUS || '').toLowerCase() !== filter.status.toLowerCase()) {
        return false;
      }
      // Search Query
      if (filter.search.trim()) {
        const query = filter.search.toLowerCase();
        const matchMateri = (record.MATERI || '').toLowerCase().includes(query);
        const matchKelas = (record.KELAS || '').toLowerCase().includes(query);
        const matchMapel = (record.MAPEL || '').toLowerCase().includes(query);
        const matchGuru = record.GURU ? record.GURU.toLowerCase().includes(query) : false;
        const matchTP = record.TUJUAN_PEMBELAJARAN
          ? record.TUJUAN_PEMBELAJARAN.toLowerCase().includes(query)
          : false;
        const matchAktivitas = record.AKTIVITAS
          ? record.AKTIVITAS.toLowerCase().includes(query)
          : false;
        const matchMetode = record.METODE ? record.METODE.toLowerCase().includes(query) : false;

        if (
          !matchMateri &&
          !matchKelas &&
          !matchMapel &&
          !matchGuru &&
          !matchTP &&
          !matchAktivitas &&
          !matchMetode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [jurnalRecords, filter]);

  // Handler: Create Jurnal
  const handleCreateJurnal = async (data: IJurnal): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await ApiClient.createJurnal(data);
      if (res.success && res.data) {
        showToast('success', 'Jurnal mengajar berhasil disimpan ke sheet Jurnal!');
        // Refresh local state
        setJurnalRecords((prev) => [res.data!, ...prev]);
        setActiveTab('list');
        return true;
      } else {
        showToast('error', res.message || res.error || 'Gagal menyimpan Jurnal');
        return false;
      }
    } catch (e: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (e.message || e));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Update Jurnal
  const handleUpdateJurnal = async (
    data: Partial<IJurnal> & { _rowIndex: number }
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await ApiClient.updateJurnal(data);
      if (res.success && res.data) {
        showToast('success', 'Jurnal mengajar berhasil diperbarui di sheet Jurnal!');
        setJurnalRecords((prev) =>
          prev.map((item) => (item._rowIndex === data._rowIndex ? res.data! : item))
        );
        setIsEditModalOpen(false);
        setEditingRecord(null);
        return true;
      } else {
        showToast('error', res.message || res.error || 'Gagal memperbarui Jurnal');
        return false;
      }
    } catch (e: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (e.message || e));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Delete Jurnal
  const handleDeleteJurnal = async (record: IJurnal): Promise<void> => {
    if (!record._rowIndex) {
      showToast('error', 'Nomor baris tidak valid untuk penghapusan.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await ApiClient.deleteJurnal({ _rowIndex: record._rowIndex });
      if (res.success) {
        showToast('success', 'Jurnal mengajar berhasil dihapus dari sheet Jurnal.');
        setJurnalRecords((prev) => prev.filter((item) => item._rowIndex !== record._rowIndex));
        setIsDeleteModalOpen(false);
        setDeletingRecord(null);
      } else {
        showToast('error', res.message || res.error || 'Gagal menghapus Jurnal');
      }
    } catch (e: any) {
      showToast('error', 'Terjadi kesalahan sistem: ' + (e.message || e));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
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

      {/* Module Header, Stats & Filters */}
      <JurnalHeader
        stats={stats}
        filter={filter}
        onFilterChange={(newF) => setFilter((prev) => ({ ...prev, ...newF }))}
        onResetFilter={() =>
          setFilter({
            search: '',
            kelas: '',
            mapel: '',
            guru: 'ALL',
            semester: 'ALL',
            tahunPelajaran: 'ALL',
            status: '',
            tanggal: ''
          })
        }
        kelasList={kelasList}
        mapelList={mapelList}
        guruList={uniqueGurus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isLoading={isLoading}
        onExport={() => setIsExportOpen(true)}
      />

      {/* Main View Area (Create Form or List) */}
      {activeTab === 'create' ? (
        <JurnalForm
          kelasList={kelasList}
          mapelList={mapelList}
          currentGuru={currentGuru}
          onSave={handleCreateJurnal}
          onCancel={() => setActiveTab('list')}
          isSaving={isSaving}
        />
      ) : (
        <JurnalList
          records={filteredRecords}
          viewMode={viewMode}
          isLoading={isLoading}
          onViewDetail={(rec) => {
            setSelectedDetailRecord(rec);
            setIsDetailModalOpen(true);
          }}
          onEdit={(rec) => {
            setEditingRecord(rec);
            setIsEditModalOpen(true);
          }}
          onDelete={(rec) => {
            setDeletingRecord(rec);
            setIsDeleteModalOpen(true);
          }}
          onResetFilter={() =>
            setFilter({
              search: '',
              kelas: '',
              mapel: '',
              guru: 'ALL',
              semester: 'ALL',
              tahunPelajaran: 'ALL',
              status: '',
              tanggal: ''
            })
          }
          onCreateNew={() => setActiveTab('create')}
          hasActiveFilters={Boolean(
            filter.search ||
            filter.kelas ||
            filter.mapel ||
            (filter.guru && filter.guru !== 'ALL') ||
            (filter.semester && filter.semester !== 'ALL') ||
            (filter.tahunPelajaran && filter.tahunPelajaran !== 'ALL') ||
            filter.status ||
            filter.tanggal
          )}
        />
      )}

      {/* Detail Modal */}
      <JurnalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailRecord(null);
        }}
        record={selectedDetailRecord}
        onEdit={(rec) => {
          setEditingRecord(rec);
          setIsEditModalOpen(true);
        }}
        onDelete={(rec) => {
          setDeletingRecord(rec);
          setIsDeleteModalOpen(true);
        }}
      />

      {/* Edit Modal */}
      <JurnalEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        kelasList={kelasList}
        mapelList={mapelList}
        onSave={handleUpdateJurnal}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <JurnalDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRecord(null);
        }}
        record={deletingRecord}
        onConfirm={handleDeleteJurnal}
        isDeleting={isDeleting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Ekspor Laporan Jurnal Mengajar Guru"
        reportType="jurnal"
        totalFilteredRecords={filteredRecords.length}
        defaultKelas={filter.kelas || undefined}
        defaultMapel={filter.mapel || undefined}
        onExport={handleExport}
      />
    </div>
  );
};
