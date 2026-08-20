/**
 * =========================================================================
 * DatabaseSyncPage.tsx - Pusat Automasi & Sinkronisasi Cloudflare D1 <-> Google Sheets
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Server,
  Zap,
  Sliders,
  FileText,
  Trash2,
  Download,
  Activity,
  Send
} from 'lucide-react';
import { SyncService } from '../services/syncService.ts';
import { IDatabaseConfig, ISyncLog, SyncDirection } from '../types/sync.ts';
import { D1_SQL_SCHEMA, CLOUDFLARE_WORKER_CODE, GOOGLE_APPS_SCRIPT_CODE } from '../utils/syncTemplates.ts';
import { formatIndoDate } from '../utils/dateUtils.ts';
import { ApiClient } from '../services/apiClient.ts';

export const DatabaseSyncPage: React.FC = () => {
  const [config, setConfig] = useState<IDatabaseConfig>(SyncService.getConfig());
  const [logs, setLogs] = useState<ISyncLog[]>(SyncService.getLogs());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ stage: string; percent: number }>({ stage: '', percent: 0 });
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'worker' | 'sql' | 'gas'>('worker');
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [pingStatus, setPingStatus] = useState<{
    d1: { online: boolean; latency: number | null; message: string; testing: boolean };
    gas: { online: boolean; latency: number | null; message: string; testing: boolean };
  }>({
    d1: { online: false, latency: null, message: '', testing: false },
    gas: { online: false, latency: null, message: '', testing: false }
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form State
  const [formWorkerUrl, setFormWorkerUrl] = useState(config.d1WorkerUrl);
  const [formApiToken, setFormApiToken] = useState(config.d1ApiToken);
  const [formGasUrl, setFormGasUrl] = useState(config.gasWebAppUrl);
  const [formAutoSync, setFormAutoSync] = useState(config.autoSyncEnabled);
  const [formSchedule, setFormSchedule] = useState(config.syncSchedule);
  const [formAutoMutation, setFormAutoMutation] = useState(config.autoBackupOnMutation);

  useEffect(() => {
    // Jalankan tes konektivitas awal jika URL terkonfigurasi
    if (config.d1WorkerUrl) {
      testPingD1();
    }
    if (config.gasWebAppUrl) {
      testPingGAS();
    }
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const testPingD1 = async () => {
    setPingStatus(prev => ({ ...prev, d1: { ...prev.d1, testing: true } }));
    const res = await SyncService.pingD1(formWorkerUrl, formApiToken);
    setPingStatus(prev => ({
      ...prev,
      d1: { online: res.online, latency: res.latencyMs, message: res.message, testing: false }
    }));
    if (res.online) {
      showToast('success', `Cloudflare D1 Terhubung (${res.latencyMs}ms)`);
    } else {
      showToast('error', `Cloudflare D1: ${res.message}`);
    }
  };

  const testPingGAS = async () => {
    setPingStatus(prev => ({ ...prev, gas: { ...prev.gas, testing: true } }));
    const res = await SyncService.pingGAS(formGasUrl);
    setPingStatus(prev => ({
      ...prev,
      gas: { online: res.online, latency: res.latencyMs, message: res.message, testing: false }
    }));
    if (res.online) {
      showToast('success', `Google Apps Script Terhubung (${res.latencyMs}ms)`);
    } else {
      showToast('error', `Google Apps Script: ${res.message}`);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = SyncService.saveConfig({
      d1WorkerUrl: formWorkerUrl.trim(),
      d1ApiToken: formApiToken.trim(),
      gasWebAppUrl: formGasUrl.trim(),
      autoSyncEnabled: formAutoSync,
      syncSchedule: formSchedule,
      autoBackupOnMutation: formAutoMutation
    });
    setConfig(updated);
    showToast('success', 'Konfigurasi automasi & sinkronisasi berhasil disimpan!');
  };

  const handleTriggerSync = async (direction: SyncDirection = 'd1_to_sheets') => {
    if (isSyncing) return;

    // Auto-save form configuration if changed
    if (formGasUrl !== config.gasWebAppUrl || formWorkerUrl !== config.d1WorkerUrl) {
      const updated = SyncService.saveConfig({
        d1WorkerUrl: formWorkerUrl.trim(),
        d1ApiToken: formApiToken.trim(),
        gasWebAppUrl: formGasUrl.trim(),
        autoSyncEnabled: formAutoSync,
        syncSchedule: formSchedule,
        autoBackupOnMutation: formAutoMutation
      });
      setConfig(updated);
    }

    setIsSyncing(true);
    setSyncProgress({ stage: 'Memulai proses sinkronisasi...', percent: 5 });

    try {
      const result = await SyncService.executeSync(direction, 'manual', (stage, percent) => {
        setSyncProgress({ stage, percent });
      });

      setLogs(SyncService.getLogs());
      setConfig(SyncService.getConfig());
      showToast('success', result.message);
    } catch (err: any) {
      setLogs(SyncService.getLogs());
      showToast('error', 'Sinkronisasi gagal: ' + (err.message || err));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress({ stage: '', percent: 0 }), 1500);
    }
  };

  const handleCopyCode = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    showToast('info', `Kode ${tabName} berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  const handleClearLogs = () => {
    if (logs.length === 0) {
      showToast('info', 'Riwayat log sudah kosong.');
      return;
    }
    SyncService.clearLogs();
    setLogs([]);
    showToast('success', 'Seluruh riwayat log sinkronisasi berhasil dibersihkan.');
  };

  const handleExportLogsCsv = () => {
    if (logs.length === 0) {
      showToast('error', 'Tidak ada data log untuk diekspor.');
      return;
    }
    const headers = ['ID', 'Waktu', 'Arah', 'Sumber', 'Tujuan', 'Status', 'Presensi', 'Nilai', 'Jurnal', 'Durasi (ms)', 'Pesan'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString('id-ID'),
      l.direction,
      l.source,
      l.target,
      l.status,
      l.recordsCount.presensi,
      l.recordsCount.nilai,
      l.recordsCount.jurnal,
      l.durationMs,
      `"${l.message.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sync_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.status === logFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : notification.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-100 text-[11px] font-semibold tracking-wide backdrop-blur-xs border border-white/15">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Arsitektur Cloud Hybrid: D1 Primary + Google Sheets Backup
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-['Outfit']">
              Pusat Automasi &amp; Sinkronisasi Database
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Jalankan sinkronisasi data presensi, nilai, dan jurnal dari database berkecepatan tinggi Cloudflare D1 ke Google Spreadsheet secara otomatis maupun manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleTriggerSync('d1_to_sheets')}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs ${
                isSyncing
                  ? 'bg-emerald-900/60 text-emerald-200 cursor-not-allowed opacity-80'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-700' : 'text-emerald-700'}`} />
              <span>{isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronkan Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                testPingD1();
                testPingGAS();
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Tes Koneksi</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar if Syncing */}
        {isSyncing && (
          <div className="mt-6 pt-4 border-t border-white/15 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-2 text-emerald-100">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {syncProgress.stage}
              </span>
              <span className="font-bold text-white">{syncProgress.percent}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${syncProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Visual Data Flow Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Card 1: Cloudflare D1 Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Database className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Database Utama (Primary)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cloudflare D1 SQL
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Penyimpanan transaksional latensi rendah (&lt;50ms) untuk presensi &amp; nilai.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status Latensi:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {pingStatus.d1.latency !== null ? `${pingStatus.d1.latency} ms (Aktif)` : 'Siap / Local Store'}
            </span>
          </div>
        </div>

        {/* Card 2: Sync Engine Intermediary */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3" /> Auto-Mirror
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Engine Automasi Sinkron
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Jadwal:{' '}
              <span className="font-semibold text-emerald-300">
                {config.syncSchedule === 'hourly'
                  ? 'Setiap 1 Jam'
                  : config.syncSchedule === 'realtime'
                  ? 'Realtime Setiap Mutasi'
                  : config.syncSchedule === 'daily_16'
                  ? 'Setiap 16:00 WIB'
                  : 'Tengah Malam'}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Terakhir Disinkronkan:</span>
            <span className="font-semibold text-white">
              {config.lastSyncTimestamp ? formatIndoDate(config.lastSyncTimestamp.slice(0, 10)) : 'Belum Ada'}
            </span>
          </div>
        </div>

        {/* Card 3: Google Sheets Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                Mirror Backup
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Google Spreadsheet & GAS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadangan data permanen yang dapat dibuka di Excel/Sheets kapan saja.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status Apps Script:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {pingStatus.gas.latency !== null ? `${pingStatus.gas.latency} ms (Terhubung)` : config.gasWebAppUrl ? 'Terkonfigurasi' : 'Belum Terhubung'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column: Settings Form & Code/Documentation Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Konfigurasi Endpoint &amp; Jadwal
                </h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                Otomatis
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Cloudflare Worker URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL Endpoint Cloudflare Worker (D1 API)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://api-sekolah.nama-akun.workers.dev"
                    value={formWorkerUrl}
                    onChange={(e) => setFormWorkerUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={testPingD1}
                    disabled={pingStatus.d1.testing || !formWorkerUrl}
                    className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all shrink-0"
                  >
                    {pingStatus.d1.testing ? 'Ping...' : 'Tes'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Worker yang terhubung dengan binding Cloudflare D1.
                </p>
              </div>

              {/* D1 API Secret Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  API Token / Secret (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token jika diatur di worker"
                  value={formApiToken}
                  onChange={(e) => setFormApiToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Google Apps Script Web App URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL Google Apps Script Web App (Backup Receiver)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={formGasUrl}
                    onChange={(e) => setFormGasUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={testPingGAS}
                    disabled={pingStatus.gas.testing || !formGasUrl}
                    className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all shrink-0"
                  >
                    {pingStatus.gas.testing ? 'Ping...' : 'Tes'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Deploy Web App dengan setelan "Who has access: Anyone".
                </p>
              </div>

              {/* Schedule Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Frekuensi Sinkronisasi Terjadwal (Cron)
                </label>
                <select
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white font-medium"
                >
                  <option value="hourly">Setiap 1 Jam (Rekomendasi Jam Belajar)</option>
                  <option value="realtime">Realtime (Langsung saat input data)</option>
                  <option value="daily_16">Setiap Hari Pukul 16:00 (Akhir Jam Sekolah)</option>
                  <option value="daily_night">Setiap Malam Pukul 00:00</option>
                </select>
              </div>

              {/* Checkbox Options */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={formAutoMutation}
                    onChange={(e) => setFormAutoMutation(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Otomatis kirim backup saat input presensi / nilai batch</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={formAutoSync}
                    onChange={(e) => setFormAutoSync(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Aktifkan daemon automasi sinkronisasi background</span>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Sinkronisasi</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Manual Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400 mb-2">
              Aksi Manual Backup
            </h3>

            <button
              type="button"
              onClick={() => handleTriggerSync('d1_to_sheets')}
              disabled={isSyncing}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 transition-all text-xs font-semibold shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cadangkan Data Sekarang (D1 → Google Sheets)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right Column: Code & Script Deployment Generator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Skrip &amp; Panduan Deployment Siap Pakai
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Salin skrip berikut untuk setup di Cloudflare &amp; Google Apps Script.
                  </p>
                </div>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('worker')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeCodeTab === 'worker'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Worker (D1)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('sql')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeCodeTab === 'sql'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Skema SQL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('gas')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeCodeTab === 'gas'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Apps Script (GAS)
                </button>
              </div>
            </div>

            {/* Code Content Box with Copy Button */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {activeCodeTab === 'worker' && 'src/worker.ts (Cloudflare Workers TypeScript)'}
                  {activeCodeTab === 'sql' && 'schema.sql (Cloudflare D1 SQLite DDL)'}
                  {activeCodeTab === 'gas' && 'Code.gs (Google Apps Script Web App Receiver)'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const code =
                      activeCodeTab === 'worker'
                        ? CLOUDFLARE_WORKER_CODE
                        : activeCodeTab === 'sql'
                        ? D1_SQL_SCHEMA
                        : GOOGLE_APPS_SCRIPT_CODE;
                    handleCopyCode(code, activeCodeTab);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                >
                  {copiedTab === activeCodeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 max-h-96 overflow-y-auto">
                <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed whitespace-pre">
                  {activeCodeTab === 'worker' && CLOUDFLARE_WORKER_CODE}
                  {activeCodeTab === 'sql' && D1_SQL_SCHEMA}
                  {activeCodeTab === 'gas' && GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

              {/* Quick 3-Step Setup Guide */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Petunjuk Penerapan Cepat (3 Langkah):
                </h4>
                <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Cloudflare D1:</strong> Buat database via CLI <code className="text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">wrangler d1 create db-sekolah</code> lalu jalankan tab <span className="font-semibold">Skema SQL</span>.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Cloudflare Worker:</strong> Deploy tab <span className="font-semibold">Worker (D1)</span> dengan binding database D1, lalu salin URL Worker ke formulir konfigurasi di sebelah kiri.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-slate-200">Google Apps Script:</strong> Buka Spreadsheet Anda → Extensions → Apps Script → tempel tab <span className="font-semibold">Apps Script (GAS)</span> → Deploy sebagai Web App (Anyone) → salin URL ke konfigurasi.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Logs Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              Riwayat Audit Log Sinkronisasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catatan riwayat transaksi mirror Cloudflare D1 ke Google Spreadsheet.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('success')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logFilter === 'success'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sukses
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('failed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logFilter === 'failed'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Gagal
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportLogsCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all"
              title="Bersihkan Semua Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Arah & Pemicu</th>
                <th className="py-3 px-4">Jumlah Data</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pesan & Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat log sinkronisasi.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })},{' '}
                      <span className="text-slate-400 text-[11px]">
                        {formatIndoDate(log.timestamp.slice(0, 10))}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.direction === 'd1_to_sheets' ? 'D1 → Sheets' : 'Sheets → D1'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {log.triggeredBy === 'manual'
                            ? 'Manual'
                            : log.triggeredBy === 'cron_hourly'
                            ? 'Cron Tiap Jam'
                            : log.triggeredBy === 'realtime'
                            ? 'Realtime'
                            : 'Terjadwal'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <span>P: <strong className="text-slate-800 dark:text-slate-200">{log.recordsCount.presensi}</strong></span>
                        <span>N: <strong className="text-slate-800 dark:text-slate-200">{log.recordsCount.nilai}</strong></span>
                        <span>J: <strong className="text-slate-800 dark:text-slate-200">{log.recordsCount.jurnal}</strong></span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {log.durationMs} ms
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" /> Sukses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                          <AlertCircle className="w-3 h-3" /> Gagal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
