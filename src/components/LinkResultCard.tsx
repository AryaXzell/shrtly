import React, { useState } from 'react';
import { Copy, Check, Share2, QrCode, ArrowUpRight, BarChart2 } from 'lucide-react';
import { LinkRecord } from '../types';

interface LinkResultCardProps {
  link: LinkRecord;
  shortUrl: string;
  onOpenQR: () => void;
  onOpenAnalytics: () => void;
}

export const LinkResultCard: React.FC<LinkResultCardProps> = ({
  link,
  shortUrl,
  onOpenQR,
  onOpenAnalytics,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareFeedback('Gagal menyalin');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SHRTLY',
          text: 'Tautan singkat:',
          url: shortUrl,
        });
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <div
      id="link-result-card"
      className="w-full p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg shadow-neutral-200/20 dark:shadow-none animate-in fade-in zoom-in-95 text-left"
    >
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Tautan Siap Digunakan
        </span>
        <span className="font-mono text-neutral-400 text-[11px]">/{link.code}</span>
      </div>

      {/* Short Link Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/40">
        <a
          href={shortUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-sm sm:text-base font-semibold text-neutral-950 dark:text-neutral-50 hover:underline truncate inline-flex items-center gap-1.5"
        >
          <span>{shortUrl.replace(/^https?:\/\//, '')}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </a>

        {/* Primary Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 active:scale-95 transition-all"
            aria-label="Salin tautan singkat"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
            title="Bagikan"
            aria-label="Bagikan tautan"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenQR}
            className="p-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
            title="Kode QR"
            aria-label="Tampilkan Kode QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {shareFeedback && (
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {shareFeedback}
        </div>
      )}

      {/* Destination preview & detail button */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="truncate max-w-[70%] text-[11px]">
          Tujuan:{' '}
          <span className="text-neutral-700 dark:text-neutral-300 truncate" title={link.destination}>
            {link.destination}
          </span>
        </div>
        <button
          onClick={onOpenAnalytics}
          className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white font-medium transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Statistik</span>
        </button>
      </div>
    </div>
  );
};
