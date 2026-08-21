import React, { useState, useEffect } from 'react';
import { Download, Monitor, CheckCircle, X, HelpCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext.tsx';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showModalInfo, setShowModalInfo] = useState<boolean>(false);
  const { info, success } = useToast();

  useEffect(() => {
    // Cek apakah sudah running dalam mode standalone / PWA terinstall
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(isDisplayStandalone || isNavStandalone));
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowModalInfo(false);
      success('Aplikasi BukuGuru berhasil dipasang ke perangkat Anda!', 'PWA Terpasang');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [success]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Error saat prompt install PWA:', err);
        setShowModalInfo(true);
      }
    } else {
      // Browser belum memicu native prompt atau di iOS/Safari/Desktop Browser
      setShowModalInfo(true);
    }
  };

  // Jika sudah terinstall dan berjalan di mode standalone, tidak perlu tampilkan tombol install
  if (isStandalone) return null;

  return (
    <>
      {/* Tombol Install Selalu Muncul di Navbar */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer border border-emerald-500/30"
        title="Pasang aplikasi BukuGuru ke Desktop / Layar Utama"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Modal Petunjuk Instalasi jika browser belum auto-prompt */}
      {showModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pasang Aplikasi BukuGuru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aplikasi Desktop & Mobile Tanpa Koneksi Internet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModalInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cara Memasang di Komputer / Laptop:</span>
              </div>
              <p className="leading-relaxed pl-5">
                1. Di <strong>Google Chrome / Microsoft Edge</strong>: Klik ikon <strong>Install (komputer/panah bawah)</strong> yang berada di sebelah kanan address bar browser.
              </p>
              <p className="leading-relaxed pl-5">
                2. Atau klik menu titik tiga <span className="font-mono font-bold">(⋮)</span> di pojok kanan atas browser &gt; pilih <strong>"Install BukuGuru"</strong> / <strong>"Aplikasi &gt; Pasang situs ini sebagai aplikasi"</strong>.
              </p>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 pt-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Di HP Android / iPhone:</span>
              </div>
              <p className="leading-relaxed pl-5">
                Tekan tombol Menu Browser &gt; pilih <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowModalInfo(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
