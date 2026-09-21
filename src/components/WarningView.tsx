import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, ExternalLink, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { SuspiciousLinkIllustration } from './illustrations/Illustrations';

interface WarningViewProps {
  code: string;
  destination: string;
  onNavigateHome: () => void;
  onOpenReport: (code: string) => void;
}

export const WarningView: React.FC<WarningViewProps> = ({
  code,
  destination,
  onNavigateHome,
  onOpenReport,
}) => {
  const [showFullUrl, setShowFullUrl] = useState(false);

  let hostname = '';
  try {
    hostname = new URL(destination).hostname;
  } catch {
    hostname = destination;
  }

  const handleProceed = () => {
    // Open in new tab safely
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="warning-view" className="py-8 px-4 max-w-lg mx-auto text-center space-y-6">
      <div>
        <SuspiciousLinkIllustration size={110} />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Peringatan Keamanan</span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Tujuan Tautan Terindikasi Mencurigakan
        </h2>

        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Tautan ini mengarah ke situs eksternal yang terindikasi berisiko tinggi. Kami tidak melakukan pengalihan otomatis demi keamanan perangkat dan data Anda.
        </p>
      </div>

      {/* Destination Hostname Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left space-y-2">
        <div className="text-xs text-neutral-400 font-medium">Domain Tujuan:</div>
        <div className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
          {hostname}
        </div>

        <button
          type="button"
          onClick={() => setShowFullUrl(!showFullUrl)}
          className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 pt-1"
        >
          <span>{showFullUrl ? 'Sembunyikan URL lengkap' : 'Inspeksi URL lengkap'}</span>
          {showFullUrl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showFullUrl && (
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 break-all select-all">
            {destination}
          </div>
        )}
      </div>

      {/* Safety Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          onClick={onNavigateHome}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Tempat Aman</span>
        </button>

        <button
          onClick={handleProceed}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <span>Tetap Lanjutkan (Berisiko)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onOpenReport(code)}
          className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Laporkan tautan ini sebagai penipuan atau malware</span>
        </button>
      </div>
    </div>
  );
};
