/**
 * =========================================================================
 * JurnalDetailModal.tsx - Modal Tampilan Detail Lengkap Entri Jurnal Mengajar
 * =========================================================================
 */

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Monitor,
  Target,
  FileText,
  MessageSquare,
  ClipboardList,
  Edit,
  Trash2
} from 'lucide-react';
import { IJurnal } from '../../types.ts';
import { formatIndoDate } from '../../utils/dateUtils.ts';

interface JurnalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: IJurnal | null;
  onEdit: (record: IJurnal) => void;
  onDelete: (record: IJurnal) => void;
}

export const JurnalDetailModal: React.FC<JurnalDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !record) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terlaksana':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="w-4 h-4" />
            Terlaksana
          </span>
        );
      case 'Sebagian':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-amber-50/90 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
            <Clock className="w-4 h-4" />
            Sebagian
          </span>
        );
      case 'Tidak terlaksana':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-rose-50/90 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
            <AlertCircle className="w-4 h-4" />
            Tidak Terlaksana
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-850/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700 text-[13px] font-bold font-mono tracking-wide">
                {record.KELAS}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[13px] font-medium">
                {record.MAPEL}
              </span>
              {getStatusBadge(record.STATUS)}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 pt-1">
              {record.MATERI}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tanggal</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatIndoDate(record.TANGGAL)}</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Jam Pelajaran</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{record.JAM}</div>
            </div>

            <div>
              <div className="text-slate-400 font-medium flex items-center gap-1 mb-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Guru Pengampu</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{record.GURU}</div>
            </div>
          </div>

          {/* Tujuan Pembelajaran */}
          {record.TUJUAN_PEMBELAJARAN && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tujuan Pembelajaran (TP)</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {record.TUJUAN_PEMBELAJARAN}
              </p>
            </div>
          )}

          {/* Aktivitas Pembelajaran */}
          {record.AKTIVITAS && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                <span>Aktivitas Pembelajaran</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-line">
                {record.AKTIVITAS}
              </p>
            </div>
          )}

          {/* Metode & Media */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <span>Metode Pembelajaran</span>
              </div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {record.METODE || '-'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                <span>Media & Sumber Belajar</span>
              </div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {record.MEDIA || '-'}
              </div>
            </div>
          </div>

          {/* Refleksi & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Refleksi Guru</span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 italic">
                {record.REFLEKSI || 'Belum ada refleksi.'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Catatan Tambahan</span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {record.CATATAN || 'Tidak ada catatan.'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {record._rowIndex && <span>Baris Sheet: #{record._rowIndex}</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(record);
              }}
              className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Jurnal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
