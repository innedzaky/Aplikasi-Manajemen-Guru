/**
 * =========================================================================
 * GuruTable.tsx - Data Table for Master Data Guru
 * =========================================================================
 */

import React from 'react';
import { Edit2, Trash2, Shield, User, BookOpen, KeyRound } from 'lucide-react';
import { IGuru } from '../../types.ts';

interface GuruTableProps {
  records: IGuru[];
  onEdit: (guru: IGuru) => void;
  onDelete: (guru: IGuru) => void;
}

export const GuruTable: React.FC<GuruTableProps> = ({
  records,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">ID Guru</th>
              <th className="py-3.5 px-4 min-w-[220px]">Nama Lengkap & Gelar</th>
              <th className="py-3.5 px-4">Username Akun</th>
              <th className="py-3.5 px-4">Mata Pelajaran Diampu</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {records.map((guru) => (
              <tr
                key={guru.ID_GURU}
                className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* ID GURU */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                    {guru.ID_GURU}
                  </span>
                </td>

                {/* NAMA GURU */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0 text-xs">
                      {guru.NAMA_GURU.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {guru.NAMA_GURU}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Tenaga Pendidik
                      </div>
                    </div>
                  </div>
                </td>

                {/* USERNAME */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>@{guru.USERNAME}</span>
                  </div>
                </td>

                {/* MAPEL */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {guru.MAPEL ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                      <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {guru.MAPEL}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Belum ditentukan
                    </span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(guru)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Guru"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(guru)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                      title="Hapus Guru"
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
