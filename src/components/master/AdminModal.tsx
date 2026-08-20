/**
 * =========================================================================
 * AdminModal.tsx - Modal Form for Create & Edit Administrator Accounts
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  KeyRound,
  Shield,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { IAdminAccount } from '../../types.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<IAdminAccount> & { USERNAME: string; NAMA_LENGKAP: string; PASSWORD?: string; EMAIL?: string; ROLE?: 'superadmin' | 'admin'; STATUS?: 'aktif' | 'nonaktif' }) => Promise<boolean>;
  admin?: IAdminAccount | null;
  isSaving: boolean;
  isCurrentSuperAdmin?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSave,
  admin,
  isSaving,
  isCurrentSuperAdmin = true
}) => {
  const isEdit = Boolean(admin);

  const [formData, setFormData] = useState<{
    ID_ADMIN: string;
    USERNAME: string;
    NAMA_LENGKAP: string;
    EMAIL: string;
    PASSWORD: string;
    ROLE: 'superadmin' | 'admin';
    STATUS: 'aktif' | 'nonaktif';
  }>({
    ID_ADMIN: '',
    USERNAME: '',
    NAMA_LENGKAP: '',
    EMAIL: '',
    PASSWORD: '',
    ROLE: 'admin',
    STATUS: 'aktif'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (admin) {
      setFormData({
        ID_ADMIN: admin.ID_ADMIN || '',
        USERNAME: admin.USERNAME || '',
        NAMA_LENGKAP: admin.NAMA_LENGKAP || '',
        EMAIL: admin.EMAIL || '',
        PASSWORD: '',
        ROLE: admin.ROLE || 'admin',
        STATUS: admin.STATUS || 'aktif'
      });
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        ID_ADMIN: `ADM${randomSuffix}`,
        USERNAME: '',
        NAMA_LENGKAP: '',
        EMAIL: '',
        PASSWORD: '',
        ROLE: 'admin',
        STATUS: 'aktif'
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [admin, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.USERNAME.trim()) {
      newErrors.USERNAME = 'Username wajib diisi';
    } else if (formData.USERNAME.includes(' ')) {
      newErrors.USERNAME = 'Username tidak boleh mengandung spasi';
    } else if (formData.USERNAME.length < 3) {
      newErrors.USERNAME = 'Username minimal 3 karakter';
    }

    if (!formData.NAMA_LENGKAP.trim()) {
      newErrors.NAMA_LENGKAP = 'Nama lengkap administrator wajib diisi';
    }

    if (formData.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EMAIL)) {
      newErrors.EMAIL = 'Format alamat email tidak valid';
    }

    if (!isEdit && !formData.PASSWORD.trim()) {
      newErrors.PASSWORD = 'Password wajib diisi untuk akun admin baru';
    } else if (formData.PASSWORD && formData.PASSWORD.length < 5) {
      newErrors.PASSWORD = 'Password minimal 5 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: any = {
      ID_ADMIN: formData.ID_ADMIN,
      USERNAME: formData.USERNAME.toLowerCase().trim(),
      NAMA_LENGKAP: formData.NAMA_LENGKAP.trim(),
      EMAIL: formData.EMAIL.trim() || `${formData.USERNAME.toLowerCase().trim()}@sekolah.sch.id`,
      ROLE: formData.ROLE,
      STATUS: formData.STATUS
    };

    if (formData.PASSWORD.trim()) {
      payload.PASSWORD = formData.PASSWORD.trim();
    }

    const success = await onSave(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isEdit ? <ShieldCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                {isEdit ? 'Edit Akun Administrator' : 'Tambah Administrator Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEdit
                  ? 'Perbarui data akun hak akses dan keamanan administrator'
                  : 'Berikan hak akses administrator sistem kepada pengelola baru'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username & Full Name */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username Login <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.USERNAME}
                  onChange={(e) => {
                    setFormData({ ...formData, USERNAME: e.target.value.toLowerCase().replace(/\s+/g, '') });
                    if (errors.USERNAME) setErrors({ ...errors, USERNAME: '' });
                  }}
                  placeholder="Contoh: admin_kurikulum"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border ${
                    errors.USERNAME
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
                />
              </div>
              {errors.USERNAME && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.USERNAME}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap &amp; Gelar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.NAMA_LENGKAP}
                onChange={(e) => {
                  setFormData({ ...formData, NAMA_LENGKAP: e.target.value });
                  if (errors.NAMA_LENGKAP) setErrors({ ...errors, NAMA_LENGKAP: '' });
                }}
                placeholder="Contoh: Drs. H. Bambang Suryono, M.Pd."
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border ${
                  errors.NAMA_LENGKAP
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
              />
              {errors.NAMA_LENGKAP && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.NAMA_LENGKAP}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Kontak Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.EMAIL}
                  onChange={(e) => {
                    setFormData({ ...formData, EMAIL: e.target.value });
                    if (errors.EMAIL) setErrors({ ...errors, EMAIL: '' });
                  }}
                  placeholder="admin@sekolah.sch.id"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border ${
                    errors.EMAIL
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
                />
              </div>
              {errors.EMAIL && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.EMAIL}
                </p>
              )}
            </div>

            {/* Role & Status Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tingkat Hak Akses
                  </label>
                  {!isCurrentSuperAdmin && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Khusus Super Admin
                    </span>
                  )}
                </div>
                <select
                  value={formData.ROLE}
                  disabled={!isCurrentSuperAdmin}
                  onChange={(e) => setFormData({ ...formData, ROLE: e.target.value as 'superadmin' | 'admin' })}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    !isCurrentSuperAdmin ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/90' : ''
                  }`}
                >
                  <option value="admin">Administrator Biasa</option>
                  <option value="superadmin">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Akun
                </label>
                <select
                  value={formData.STATUS}
                  onChange={(e) => setFormData({ ...formData, STATUS: e.target.value as 'aktif' | 'nonaktif' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="aktif">Aktif (Dapat Login)</option>
                  <option value="nonaktif">Nonaktif (Dibekukan)</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEdit ? 'Ubah Password (Kosongkan jika tidak ingin diubah)' : 'Kata Sandi (Password)'}{' '}
                  {!isEdit && <span className="text-red-500">*</span>}
                </label>
                {!isEdit && (
                  <span className="text-[11px] text-slate-400">Min. 5 karakter</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.PASSWORD}
                  onChange={(e) => {
                    setFormData({ ...formData, PASSWORD: e.target.value });
                    if (errors.PASSWORD) setErrors({ ...errors, PASSWORD: '' });
                  }}
                  placeholder={isEdit ? 'Masukkan password baru...' : 'Masukkan password akun admin'}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border ${
                    errors.PASSWORD
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.PASSWORD && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.PASSWORD}
                </p>
              )}
            </div>
          </div>

          {/* Security Note Box */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              Akun administrator memiliki wewenang penuh untuk mengelola data guru, siswa, kelas, mata pelajaran, serta konfigurasi backend aplikasi.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Simpan Perubahan' : 'Tambah Admin'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
