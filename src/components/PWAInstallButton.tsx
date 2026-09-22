import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="p-5 rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 space-y-2.5 shadow-md">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="w-4 h-4" />
          <span>Pasang SHRTLY di Perangkat Anda</span>
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          Nikmati pengalaman pemendek tautan yang cepat dan senyap langsung dari layar utama perangkat Anda, mirip seperti aplikasi native.
        </p>
        <button
          onClick={install}
          className="inline-flex items-center gap-1.5 px-4 py-2 mt-1 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang Aplikasi</span>
        </button>
      </div>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <div className="p-5 rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 space-y-2.5 shadow-md">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="w-4 h-4" />
            <span>Tambahkan SHRTLY ke iPhone / iPad</span>
          </div>
          <p className="text-xs opacity-80 leading-relaxed">
            Akses pemendekan tautan langsung dari layar utama perangkat iOS Anda untuk kecepatan optimal tanpa kerumitan browser.
          </p>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-1 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pasang di iOS</span>
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-left space-y-4">
              <h3 className="text-base font-bold text-neutral-950 dark:text-white">Pasang di iPhone / iPad</h3>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2.5 leading-relaxed">
                <p>Ikuti langkah-langkah berikut di Safari:</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium">
                  <li>Ketuk tombol <strong className="text-neutral-900 dark:text-white font-bold">Bagikan (Share)</strong> di bar bawah Safari.</li>
                  <li>Gulir ke bawah dan ketuk opsi <strong className="text-neutral-900 dark:text-white font-bold">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                  <li>Ketuk <strong className="text-neutral-900 dark:text-white font-bold">Tambah (Add)</strong> di pojok kanan atas untuk konfirmasi.</li>
                </ol>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-2.5 text-xs font-bold hover:opacity-95 transition-opacity"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
