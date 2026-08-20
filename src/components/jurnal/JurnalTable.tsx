/**
 * =========================================================================
 * JurnalTable.tsx - Table View untuk Entri Jurnal Mengajar (Phase 8)
 * =========================================================================
 */

import React from 'react';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import { IJurnal } from '../../types.ts';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface JurnalTableProps {
  records: IJurnal[];
  onViewDetail: (record: IJurnal) => void;
  onEdit: (record: IJurnal) => void;
  onDelete: (record: IJurnal) => void;
}

export const JurnalTable: React.FC<JurnalTableProps> = ({
  records,
  onViewDetail,
  onEdit,
  onDelete
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terlaksana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Terlaksana
          </span>
        );
      case 'Sebagian':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Sebagian
          </span>
        );
      case 'Tidak terlaksana':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Tidak Terlaksana
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-xs">
              <th className="py-3.5 px-4">Tanggal & Jam</th>
              <th className="py-3.5 px-4">Kelas & Mapel</th>
              <th className="py-3.5 px-4 min-w-[200px]">Materi & Aktivitas</th>
              <th className="py-3.5 px-4">Metode & Media</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {records.map((record, index) => (
              <tr
                key={`${record._rowIndex || index}-${record.TANGGAL}-${record.KELAS}`}
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* Tanggal & Jam */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 font-mono text-[13px]">{formatIndoDate(record.TANGGAL)}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{record.JAM}</div>
                </td>

                {/* Kelas & Mapel */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[13px]">{record.KELAS}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{record.MAPEL}</div>
                </td>

                {/* Materi & Aktivitas */}
                <td className="py-3.5 px-4">
                  <div
                    onClick={() => onViewDetail(record)}
                    className="font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer line-clamp-1 text-[13px] sm:text-sm"
                  >
                    {record.MATERI}
                  </div>
                  {record.TUJUAN_PEMBELAJARAN && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">TP: </span>
                      {record.TUJUAN_PEMBELAJARAN}
                    </div>
                  )}
                </td>

                {/* Metode & Media */}
                <td className="py-3.5 px-4">
                  <div className="text-[13px] text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                    {record.METODE || '-'}
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[150px]">
                    {record.MEDIA || '-'}
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getStatusBadge(record.STATUS)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onViewDetail(record)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Edit Jurnal"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(record)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
