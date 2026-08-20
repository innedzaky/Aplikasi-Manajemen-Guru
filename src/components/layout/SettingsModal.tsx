/**
 * =========================================================================
 * SettingsModal.tsx - Configuration for GAS Web App URL and Live/Demo Mode
 * =========================================================================
 */

import React, { useState } from 'react';
import { Settings, Globe, Check, Link2, HelpCircle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { SecurityUtils } from '../../utils/securityUtils.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAS_URL_KEY = 'manajemen_guru_gas_url';
const GAS_MODE_KEY = 'manajemen_guru_gas_mode';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { success, error, info } = useToast();

  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(GAS_URL_KEY) || '';
  });

  const [isLive, setIsLive] = useState<boolean>(() => {
    return localStorage.getItem(GAS_MODE_KEY) === 'live';
  });

  const [urlError, setUrlError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    const trimmedUrl = gasUrl.trim();
    if (!trimmedUrl) {
      setUrlError('Masukkan URL Google Apps Script terlebih dahulu.');
      return;
    }

    const validation = SecurityUtils.isValidGasUrl(trimmedUrl);
    if (!validation.valid) {
      setUrlError(validation.reason || 'URL tidak valid');
      return;
    }

    setIsTesting(true);
    setUrlError(null);
    setTestResult(null);

    try {
      // Test proxy route to avoid CORS block
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: trimmedUrl,
          action: 'getGuru'
        })
      });

      const json = await response.json();
      if (json.success) {
        setTestResult({
          success: true,
          message: 'Berhasil terhubung ke Google Apps Script & Spreadsheet aktif!'
        });
      } else {
        setTestResult({
          success: false,
          message: json.message || 'Respon gagal dari backend Google Apps Script.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Gagal terhubung: ' + (err.message || err)
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const trimmedUrl = gasUrl.trim();

    if (isLive) {
      const validation = SecurityUtils.isValidGasUrl(trimmedUrl);
      if (!validation.valid) {
        setUrlError(validation.reason || 'URL tidak valid');
        error(validation.reason || 'URL Google Apps Script tidak valid.', 'Validasi Gagal');
        return;
      }
    }

    setUrlError(null);
    localStorage.setItem(GAS_URL_KEY, trimmedUrl);
    localStorage.setItem(GAS_MODE_KEY, isLive ? 'live' : 'demo');
    ApiClient.configure(trimmedUrl, isLive);

    success(
      isLive
        ? 'Mode Backend Live aktif terhubung ke Google Apps Script.'
        : 'Mode Demo aktif (In-Memory Mock State).',
      'Pengaturan Tersimpan'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengaturan Koneksi Backend"
      description="Konfigurasi URL Google Apps Script Web App untuk mode live database spreadsheet."
      maxWidth="lg"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Toggle Mode */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Mode Koneksi Backend
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isLive
                ? 'Terhubung langsung ke Google Spreadsheet via GAS Web App.'
                : 'Menggunakan Mock Data lokal (In-Memory Simulator).'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isLive}
              onChange={(e) => {
                setIsLive(e.target.checked);
                setTestResult(null);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* GAS Web App URL Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Google Apps Script Web App URL
            </label>
            {isLive && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !gasUrl.trim()}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Menguji...' : 'Uji Koneksi'}
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={gasUrl}
              onChange={(e) => {
                setGasUrl(e.target.value);
                if (urlError) setUrlError(null);
                if (testResult) setTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/.../exec"
              disabled={!isLive}
              className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
                urlError
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-800 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Test Connection Result Alert */}
          {testResult && (
            <div
              className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</p>
                <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {urlError ? (
            <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {urlError}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              Deploy backend Google Apps Script sebagai Web App dengan akses "Anyone" (HTTPS script.google.com).
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </Modal>
  );
};
