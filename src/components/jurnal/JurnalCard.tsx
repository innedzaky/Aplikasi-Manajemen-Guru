/**
 * =========================================================================
 * JurnalCard.tsx - Card Agenda View untuk Entri Jurnal Mengajar
 * =========================================================================
 */

import React from 'react';
import {
  Calendar,
  Clock,
  GraduationCap,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Monitor,
  MessageSquare,
  Target
} from 'lucide-react';
import { IJurnal } from '../../types.ts';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface JurnalCardProps {
  record: IJurnal;
  onViewDetail: (record: IJurnal) => void;
  onEdit: (record: IJurnal) => void;
  onDelete: (record: IJurnal) => void;
}

export const JurnalCard: React.FC<JurnalCardProps> = ({
  record,
  onViewDetail,
  onEdit,
  onDelete
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terlaksana':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Terlaksana
          </span>
        );
      case 'Sebagian':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Sebagian
          </span>
        );
      case 'Tidak terlaksana':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Tidak Terlaksana
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-3.5">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              {record.KELAS}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium truncate max-w-[140px]">
              {record.MAPEL}
            </span>
          </div>
          <div>{getStatusBadge(record.STATUS)}</div>
        </div>

        {/* Title / Materi */}
        <div>
          <h3
            onClick={() => onViewDetail(record)}
            className="text-base font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors line-clamp-2"
          >
            {record.MATERI}
          </h3>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {formatIndoDate(record.TANGGAL)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {record.JAM}
            </span>
            {record.GURU && (
              <span className="flex items-center gap-1 truncate max-w-[150px]">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                {record.GURU}
              </span>
            )}
          </div>
        </div>

        {/* Tujuan & Aktivitas snippet */}
        {record.TUJUAN_PEMBELAJARAN && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 line-clamp-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">TP: </span>
            {record.TUJUAN_PEMBELAJARAN}
          </div>
        )}

        {/* Tags (Metode & Media) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {record.METODE && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[130px]">{record.METODE}</span>
            </span>
          )}
          {record.MEDIA && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
              <Monitor className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[130px]">{record.MEDIA}</span>
            </span>
          )}
        </div>

        {/* Reflection Highlight */}
        {record.REFLEKSI && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>&ldquo;{record.REFLEKSI}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewDetail(record)}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Lihat Detail</span>
        </button>

        <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
};
