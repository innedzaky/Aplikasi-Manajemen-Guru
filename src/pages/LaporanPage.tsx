/**
 * =========================================================================
 * LaporanPage.tsx - Comprehensive Reporting & Export Center
 * Filters & Exports Presensi, Nilai, and Jurnal to CSV, Excel, and PDF
 * =========================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileType,
  FileText,
  Download,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  RefreshCw,
  Printer,
  Sparkles,
  Layers
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { IPresensi, INilai, IJurnal, IKelas, IMapel, IGuru } from '../types.ts';
import { StatsCalculator } from '../utils/statsCalculator.ts';
import { ExportUtils, ExportFormat, IExportReportMetadata } from '../utils/exportUtils.ts';
import { FilterBar, FilterFieldConfig } from '../components/common/FilterBar.tsx';
import { filterRecords, STANDARD_SEMESTER, STANDARD_TAHUN_PELAJARAN, STANDARD_STATUS_PRESENSI, STANDARD_JENIS_PENILAIAN } from '../utils/filterUtils.ts';
import { ExportModal } from '../components/common/ExportModal.tsx';
import { PresensiStatSummary, NilaiStatSummary } from '../components/dashboard/ModuleStatCards.tsx';
import { formatIndoDate } from '../utils/dateUtils.ts';

type ReportCategory = 'presensi' | 'nilai' | 'jurnal';

export const LaporanPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ReportCategory>('presensi');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Master Data
  const [kelasList, setKelasList] = useState<IKelas[]>([]);
  const [mapelList, setMapelList] = useState<IMapel[]>([]);
  const [guruList, setGuruList] = useState<IGuru[]>([]);

  // Raw Datasets
  const [presensiRecords, setPresensiRecords] = useState<IPresensi[]>([]);
  const [nilaiRecords, setNilaiRecords] = useState<INilai[]>([]);
  const [jurnalRecords, setJurnalRecords] = useState<IJurnal[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string>>({
    guru: !isAdmin && user?.NAMA_GURU ? user.NAMA_GURU : '',
    kelas: '',
    mapel: !isAdmin && user?.MAPEL ? user.MAPEL : '',
    tanggal: '',
    semester: 'Ganjil',
    tahunPelajaran: '2025/2026',
    status: '',
    jenisPenilaian: ''
  });

  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch All Reporting Data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resK, resM, resG, resP, resN, resJ] = await Promise.all([
        ApiClient.getKelas(),
        ApiClient.getMapel(),
        ApiClient.getGuru(),
        ApiClient.getPresensi(),
        ApiClient.getNilai(),
        ApiClient.getJurnal()
      ]);

      if (resK.success && resK.data) setKelasList(resK.data);
      if (resM.success && resM.data) setMapelList(resM.data);
      if (resG.success && resG.data) setGuruList(resG.data);
      if (resP.success && resP.data) setPresensiRecords(resP.data);
      if (resN.success && resN.data) setNilaiRecords(resN.data);
      if (resJ.success && resJ.data) setJurnalRecords(resJ.data);
    } catch {
      showToast('Gagal memuat data laporan dari server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Tab Switch
  const handleTabChange = (tab: ReportCategory) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  // Filtered Datasets based on active Tab
  const filteredPresensi = useMemo(() => {
    return filterRecords(
      presensiRecords,
      {
        search: searchTerm,
        searchFields: ['NAMA_SISWA', 'NISN', 'CATATAN', 'KELAS', 'MAPEL', 'GURU'],
        kelas: filters.kelas,
        mapel: filters.mapel,
        guru: filters.guru,
        status: filters.status,
        tanggal: filters.tanggal,
        semester: filters.semester,
        tahunPelajaran: filters.tahunPelajaran
      }
    );
  }, [presensiRecords, searchTerm, filters]);

  const filteredNilai = useMemo(() => {
    return filterRecords(
      nilaiRecords,
      {
        search: searchTerm,
        searchFields: ['NAMA_SISWA', 'NISN', 'NAMA_PENILAIAN', 'CATATAN', 'KELAS', 'MAPEL', 'GURU'],
        kelas: filters.kelas,
        mapel: filters.mapel,
        guru: filters.guru,
        jenisPenilaian: filters.jenisPenilaian,
        tanggal: filters.tanggal,
        semester: filters.semester,
        tahunPelajaran: filters.tahunPelajaran
      }
    );
  }, [nilaiRecords, searchTerm, filters]);

  const filteredJurnal = useMemo(() => {
    return filterRecords(
      jurnalRecords,
      {
        search: searchTerm,
        searchFields: ['MATERI', 'AKTIVITAS', 'TUJUAN_PEMBELAJARAN', 'CATATAN', 'KELAS', 'MAPEL', 'GURU'],
        kelas: filters.kelas,
        mapel: filters.mapel,
        guru: filters.guru,
        status: filters.status,
        tanggal: filters.tanggal,
        semester: filters.semester,
        tahunPelajaran: filters.tahunPelajaran
      }
    );
  }, [jurnalRecords, searchTerm, filters]);

  // Active Filtered Records according to current Tab
  const currentFilteredCount = useMemo(() => {
    if (activeTab === 'presensi') return filteredPresensi.length;
    if (activeTab === 'nilai') return filteredNilai.length;
    return filteredJurnal.length;
  }, [activeTab, filteredPresensi.length, filteredNilai.length, filteredJurnal.length]);

  // Filter Configurations for Reusable FilterBar
  const filterConfig = useMemo((): FilterFieldConfig[] => {
    const fields: FilterFieldConfig[] = [
      {
        key: 'tanggal',
        label: 'Tanggal Spesifik',
        type: 'date'
      },
      {
        key: 'kelas',
        label: 'Kelas',
        type: 'select',
        options: kelasList.map((k) => ({ value: k.NAMA_KELAS, label: k.NAMA_KELAS }))
      },
      {
        key: 'mapel',
        label: 'Mata Pelajaran',
        type: 'select',
        options: mapelList.map((m) => ({
          value: m.NAMA_MATA_PELAJARAN,
          label: m.NAMA_MATA_PELAJARAN
        }))
      }
    ];

    if (isAdmin) {
      fields.push({
        key: 'guru',
        label: 'Guru Pengampu',
        type: 'select',
        options: guruList.map((g) => ({ value: g.NAMA_GURU, label: g.NAMA_GURU }))
      });
    }

    if (activeTab === 'presensi') {
      fields.push({
        key: 'status',
        label: 'Status Kehadiran',
        type: 'select',
        options: STANDARD_STATUS_PRESENSI.map((s) => ({ value: s, label: s }))
      });
    } else if (activeTab === 'nilai') {
      fields.push({
        key: 'jenisPenilaian',
        label: 'Jenis Penilaian',
        type: 'select',
        options: STANDARD_JENIS_PENILAIAN.map((j) => ({ value: j, label: j }))
      });
    } else if (activeTab === 'jurnal') {
      fields.push({
        key: 'status',
        label: 'Status KBM',
        type: 'select',
        options: [
          { value: 'Terlaksana', label: 'Terlaksana' },
          { value: 'Sebagian', label: 'Sebagian' },
          { value: 'Tidak terlaksana', label: 'Tidak Terlaksana' }
        ]
      });
    }

    fields.push(
      {
        key: 'semester',
        label: 'Semester',
        type: 'select',
        options: STANDARD_SEMESTER.map((s) => ({ value: s, label: `Semester ${s}` }))
      },
      {
        key: 'tahunPelajaran',
        label: 'Tahun Pelajaran',
        type: 'select',
        options: STANDARD_TAHUN_PELAJARAN.map((t) => ({ value: t, label: `TP ${t}` }))
      }
    );

    return fields;
  }, [kelasList, mapelList, guruList, isAdmin, activeTab]);

  // Statistics Calculations
  const presensiStats = useMemo(() => StatsCalculator.calculatePresensiStats(filteredPresensi), [filteredPresensi]);
  const nilaiStats = useMemo(() => StatsCalculator.calculateNilaiStats(filteredNilai), [filteredNilai]);
  const jurnalStats = useMemo(() => StatsCalculator.calculateJurnalStats(filteredJurnal), [filteredJurnal]);

  // Filter Summary String for export metadata
  const filterSummaryString = useMemo(() => {
    const parts: string[] = [];
    if (filters.kelas) parts.push(`Kelas: ${filters.kelas}`);
    if (filters.mapel) parts.push(`Mapel: ${filters.mapel}`);
    if (filters.guru) parts.push(`Guru: ${filters.guru}`);
    if (filters.tanggal) parts.push(`Tanggal: ${filters.tanggal}`);
    if (filters.status) parts.push(`Status: ${filters.status}`);
    if (filters.jenisPenilaian) parts.push(`Jenis: ${filters.jenisPenilaian}`);
    if (filters.semester) parts.push(`Sem: ${filters.semester}`);
    if (filters.tahunPelajaran) parts.push(`TP: ${filters.tahunPelajaran}`);
    if (searchTerm) parts.push(`Cari: "${searchTerm}"`);
    return parts.length > 0 ? parts.join(' | ') : 'Semua Data Rekaman';
  }, [filters, searchTerm]);

  // Execute Export
  const handleExecuteExport = (format: ExportFormat, meta: Partial<IExportReportMetadata>) => {
    const fullMeta: Partial<IExportReportMetadata> = {
      ...meta,
      kelas: filters.kelas || 'Semua Kelas',
      mapel: filters.mapel || 'Semua Mapel',
      namaGuru: filters.guru || user?.NAMA_GURU || 'Guru Pengampu',
      semester: filters.semester || 'Ganjil',
      tahunPelajaran: filters.tahunPelajaran || '2025/2026',
      filterInfo: filterSummaryString
    };

    if (activeTab === 'presensi') {
      ExportUtils.exportPresensi(filteredPresensi, format, fullMeta);
    } else if (activeTab === 'nilai') {
      ExportUtils.exportNilai(filteredNilai, format, fullMeta);
    } else if (activeTab === 'jurnal') {
      ExportUtils.exportJurnal(filteredJurnal, format, fullMeta);
    }

    showToast(`Berhasil mengekspor laporan ${activeTab.toUpperCase()} format ${format.toUpperCase()}`, 'success');
  };

  // Quick Export Handlers
  const handleQuickExport = (format: ExportFormat) => {
    handleExecuteExport(format, {
      namaSekolah: localStorage.getItem('manajemen_guru_nama_sekolah') || 'SMK / SMA NEGERI',
      namaGuru: user?.NAMA_GURU || 'Guru Pengampu'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white font-['Outfit']">
                  Pusat Laporan & Ekspor Data
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Siap Cetak
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cetak dan unduh laporan resmi Presensi, Penilaian, dan Jurnal Mengajar dalam format CSV, Excel (.xlsx), dan PDF
              </p>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickExport('pdf')}
              disabled={currentFilteredCount === 0 || isLoading}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileType className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleQuickExport('excel')}
              disabled={currentFilteredCount === 0 || isLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleQuickExport('csv')}
              disabled={currentFilteredCount === 0 || isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={currentFilteredCount === 0 || isLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Kustomisasi Kop & TTD</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800 pb-0">
          <button
            onClick={() => handleTabChange('presensi')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'presensi'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>1. Laporan Presensi Siswa</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredPresensi.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('nilai')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'nilai'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>2. Laporan Penilaian & Rapor</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredNilai.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('jurnal')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'jurnal'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. Laporan Jurnal Mengajar</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredJurnal.length}
            </span>
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Cards for Current Filter */}
      {activeTab === 'presensi' ? (
        <PresensiStatSummary stats={presensiStats} />
      ) : activeTab === 'nilai' ? (
        <NilaiStatSummary stats={nilaiStats} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pertemuan KBM</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-['Outfit'] mt-1">
              {jurnalStats.total}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Terlaksana Penuh</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-['Outfit'] mt-1">
              {jurnalStats.terlaksana} ({jurnalStats.persentaseTerlaksana}%)
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 shadow-xs">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Sebagian</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-['Outfit'] mt-1">
              {jurnalStats.sebagian}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-xs">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Tidak Terlaksana</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-['Outfit'] mt-1">
              {jurnalStats.tidakTerlaksana}
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        fields={filterConfig}
        filters={filters}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onResetFilters={() =>
          setFilters({
            guru: !isAdmin && user?.NAMA_GURU ? user.NAMA_GURU : '',
            kelas: '',
            mapel: !isAdmin && user?.MAPEL ? user.MAPEL : '',
            tanggal: '',
            semester: 'Ganjil',
            tahunPelajaran: '2025/2026',
            status: '',
            jenisPenilaian: ''
          })
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={`Cari data ${activeTab}...`}
        totalResults={currentFilteredCount}
      />

      {/* Live Data Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Pratinjau Data Laporan ({currentFilteredCount} baris)
            </h2>
          </div>
          <button
            onClick={fetchAllData}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Tab 1: Presensi Table Preview */}
        {activeTab === 'presensi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4 text-center">Pertemuan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPresensi.slice(0, 50).map((r, idx) => (
                  <tr key={`p-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">{formatIndoDate(r.TANGGAL)}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.NISN}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{r.NAMA_SISWA}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{r.KELAS}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{r.MAPEL}</td>
                    <td className="py-2.5 px-4 text-center font-bold">#{r.PERTEMUAN}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.STATUS === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.STATUS === 'Izin'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : r.STATUS === 'Sakit'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {r.STATUS}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{r.CATATAN || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Nilai Table Preview */}
        {activeTab === 'nilai' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Jenis & Penilaian</th>
                  <th className="py-3 px-4 text-center">Nilai</th>
                  <th className="py-3 px-4 text-center">KKM (75)</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredNilai.slice(0, 50).map((r, idx) => {
                  const score = Number(r.NILAI) || 0;
                  const isTuntas = score >= 75;
                  return (
                    <tr key={`n-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">{formatIndoDate(r.TANGGAL)}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{r.NISN}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{r.NAMA_SISWA}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">{r.KELAS}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">{r.MAPEL}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block">{r.NAMA_PENILAIAN}</span>
                        <span className="text-[10px] text-slate-400">{r.JENIS_PENILAIAN}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900 dark:text-white">{score}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isTuntas
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isTuntas ? 'Tuntas' : 'Remedial'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{r.CATATAN || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Jurnal Table Preview */}
        {activeTab === 'jurnal' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-center">Jam</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4">Materi Pembelajaran</th>
                  <th className="py-3 px-4">Kegiatan / Aktivitas</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Refleksi / Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJurnal.slice(0, 50).map((r, idx) => (
                  <tr key={`j-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">{formatIndoDate(r.TANGGAL)}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">{r.JAM_KE}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-medium">{r.KELAS}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">{r.MAPEL}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{r.MATERI}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 max-w-[220px] truncate">{r.KEGIATAN}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.STATUS === 'Terlaksana'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : r.STATUS === 'Sebagian'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {r.STATUS}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-[150px] truncate">{r.CATATAN || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {currentFilteredCount === 0 && (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-medium">Tidak ada data yang sesuai dengan kriteria filter saat ini.</p>
          </div>
        )}
      </div>

      {/* Interactive Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Ekspor ${
          activeTab === 'presensi'
            ? 'Laporan Presensi Siswa'
            : activeTab === 'nilai'
            ? 'Laporan Penilaian & Rapor'
            : 'Laporan Jurnal Mengajar'
        }`}
        reportType={activeTab}
        totalFilteredRecords={currentFilteredCount}
        filterSummary={filterSummaryString}
        defaultKelas={filters.kelas}
        defaultMapel={filters.mapel}
        onExport={handleExecuteExport}
      />
    </div>
  );
};
