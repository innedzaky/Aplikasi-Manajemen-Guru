/**
 * =========================================================================
 * PresensiHistoryTable.tsx - Attendance History, Search, Multi-Filter & Actions
 * =========================================================================
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  XCircle,
  Edit3,
  Trash2,
  RotateCcw,
  BookOpen,
  User,
  GraduationCap,
  Layers,
  Users,
  Download,
  FileType,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { IPresensi, IKelas, IMapel } from '../../types.ts';
import {
  filterRecords,
  extractUniqueOptions,
  STANDARD_TAHUN_PELAJARAN,
  STANDARD_SEMESTER,
  STANDARD_STATUS_PRESENSI
} from '../../utils/filterUtils.ts';
import { StatsCalculator } from '../../utils/statsCalculator.ts';
import { ExportUtils, ExportFormat, IExportReportMetadata } from '../../utils/exportUtils.ts';
import { ExportModal } from '../common/ExportModal.tsx';
import { PresensiStatSummary } from '../dashboard/ModuleStatCards.tsx';
import { FilterBar, FilterFieldConfig } from '../common/FilterBar.tsx';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface PresensiHistoryTableProps {
  records: IPresensi[];
  kelasList: IKelas[];
  mapelList: IMapel[];
  onEditRecord: (record: IPresensi) => void;
  onDeleteRecord: (record: IPresensi) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PresensiHistoryTable: React.FC<PresensiHistoryTableProps> = ({
  records,
  kelasList,
  mapelList,
  onEditRecord,
  onDeleteRecord,
  isLoading,
  onRefresh
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({
    tanggal: '',
    guru: 'ALL',
    kelas: 'ALL',
    mapel: 'ALL',
    semester: 'ALL',
    tahunPelajaran: 'ALL',
    status: 'ALL',
    pertemuan: 'ALL'
  });

  // Extract unique teachers from presensi records
  const uniqueGurus = useMemo(() => {
    return extractUniqueOptions(records, 'GURU');
  }, [records]);

  // Handle single filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({
      tanggal: '',
      guru: 'ALL',
      kelas: 'ALL',
      mapel: 'ALL',
      semester: 'ALL',
      tahunPelajaran: 'ALL',
      status: 'ALL',
      pertemuan: 'ALL'
    });
  };

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExport = (format: ExportFormat, meta: Partial<IExportReportMetadata>) => {
    ExportUtils.exportPresensi(filteredRecords, format, {
      ...meta,
      kelas: filters.kelas !== 'ALL' ? filters.kelas : 'Semua Kelas',
      mapel: filters.mapel !== 'ALL' ? filters.mapel : 'Semua Mapel',
      namaGuru: filters.guru !== 'ALL' ? filters.guru : 'Guru Pengampu',
      semester: filters.semester !== 'ALL' ? filters.semester : 'Ganjil',
      tahunPelajaran: filters.tahunPelajaran !== 'ALL' ? filters.tahunPelajaran : '2025/2026'
    });
  };

  // Filtered dataset using reusable filter engine
  const filteredRecords = useMemo(() => {
    return filterRecords(
      records,
      {
        search: searchTerm,
        searchFields: ['NAMA_SISWA', 'CATATAN', 'GURU', 'KELAS', 'MAPEL'],
        tanggal: filters.tanggal,
        guru: filters.guru,
        kelas: filters.kelas,
        mapel: filters.mapel,
        semester: filters.semester,
        tahunPelajaran: filters.tahunPelajaran,
        status: filters.status,
        pertemuan: filters.pertemuan
      }
    );
  }, [records, searchTerm, filters]);

  // Status Summary of filtered items using StatsCalculator
  const stats = useMemo(() => {
    return StatsCalculator.calculatePresensiStats(filteredRecords);
  }, [filteredRecords]);

  // Define Filter Fields for Reusable FilterBar
  const filterFields: FilterFieldConfig[] = [
    {
      key: 'tanggal',
      label: 'Tanggal',
      type: 'date',
      icon: Calendar
    },
    {
      key: 'guru',
      label: 'Guru',
      icon: User,
      options: uniqueGurus.map((g) => ({ value: g, label: g }))
    },
    {
      key: 'kelas',
      label: 'Kelas',
      icon: GraduationCap,
      options: kelasList.map((k) => ({ value: k.NAMA_KELAS, label: k.NAMA_KELAS }))
    },
    {
      key: 'mapel',
      label: 'Mata Pelajaran',
      icon: BookOpen,
      options: mapelList.map((m) => ({ value: m.NAMA_MATA_PELAJARAN, label: m.NAMA_MATA_PELAJARAN }))
    },
    {
      key: 'semester',
      label: 'Semester',
      icon: Layers,
      options: [...STANDARD_SEMESTER]
    },
    {
      key: 'tahunPelajaran',
      label: 'Tahun Pelajaran',
      options: [...STANDARD_TAHUN_PELAJARAN]
    },
    {
      key: 'status',
      label: 'Status',
      options: [...STANDARD_STATUS_PRESENSI]
    },
    {
      key: 'pertemuan',
      label: 'Pertemuan',
      options: Array.from({ length: 36 }, (_, i) => ({
        value: String(i + 1),
        label: `Pertemuan #${i + 1}`
      }))
    }
  ];

  return (
    <div className="space-y-4">
      {/* Reusable FilterBar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari berdasarkan nama siswa, catatan, kelas, mapel..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        fields={filterFields}
        totalCount={records.length}
        filteredCount={filteredRecords.length}
        itemLabel="rekaman presensi"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={filteredRecords.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Ekspor data presensi sesuai filter aktif"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
            <button
              id="btn-sync-presensi-history"
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>
          </div>
        }
      />

      {/* Live Filter Metric Badges */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Rekap Hasil Filter:</span>
          <span className="px-3 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Total: {stats.total}
          </span>
          <span className="px-3 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            Hadir: {stats.hadir}
          </span>
          <span className="px-3 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            Izin: {stats.izin}
          </span>
          <span className="px-3 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            Sakit: {stats.sakit}
          </span>
          <span className="px-3 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            Alpa: {stats.alpa}
          </span>
        </div>

        <span className="text-xs text-slate-400">
          Menampilkan {filteredRecords.length} dari total {records.length} data tersimpan
        </span>
      </div>

      {/* History Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak Ditemukan Rekaman Presensi
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada data yang sesuai dengan kombinasi filter dan kata kunci pencarian Anda.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Waktu & Pertemuan</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Kelas & Mapel</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama Siswa</th>
                  <th className="py-3.5 px-4 min-w-[110px] text-center">Status</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Catatan / Keterangan</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Guru Pengajar</th>
                  <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRecords.map((item, index) => {
                  const isHadir = item.STATUS === 'Hadir';
                  const isIzin = item.STATUS === 'Izin';
                  const isSakit = item.STATUS === 'Sakit';
                  const isAlpa = item.STATUS === 'Alpa';

                  const badgeClass = isHadir
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : isIzin
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : isSakit
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';

                  const StatusIcon = isHadir
                    ? CheckCircle2
                    : isIzin
                    ? Clock
                    : isSakit
                    ? HeartPulse
                    : XCircle;

                  return (
                    <tr
                      key={item._rowIndex || `${item.TANGGAL}-${item.NAMA_SISWA}-${index}`}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Tanggal & Pertemuan */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white font-mono text-[13px]">
                          {formatIndoDate(item.TANGGAL)}
                        </div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                          Pertemuan #{item.PERTEMUAN}
                        </div>
                      </td>

                      {/* Kelas & Mapel */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-[13px]">
                          {item.KELAS}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                          {item.MAPEL}
                        </div>
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm">
                        {item.NAMA_SISWA}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold border ${badgeClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{item.STATUS}</span>
                        </span>
                      </td>

                      {/* Catatan */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[13px]">
                        {item.CATATAN ? (
                          <span className="italic">{item.CATATAN}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Guru */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {item.GURU || 'Guru Pengajar'}
                      </td>

                      {/* Aksi (Edit & Delete) */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditRecord(item)}
                            title="Edit presensi siswa ini"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(item)}
                            title="Hapus presensi siswa ini"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Ekspor Laporan Presensi Siswa"
        reportType="presensi"
        totalFilteredRecords={filteredRecords.length}
        defaultKelas={filters.kelas !== 'ALL' ? filters.kelas : undefined}
        defaultMapel={filters.mapel !== 'ALL' ? filters.mapel : undefined}
        onExport={handleExport}
      />
    </div>
  );
};

