import React, { useState } from 'react';
import {
  Copy,
  Check,
  QrCode,
  BarChart2,
  Edit2,
  Power,
  Trash2,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { LinkRecord } from '../types';

interface LinkCardProps {
  link: LinkRecord;
  origin: string;
  onOpenAnalytics: (link: LinkRecord) => void;
  onOpenQR: (link: LinkRecord) => void;
  onEditDestination: (link: LinkRecord) => void;
  onToggleStatus: (link: LinkRecord) => void;
  onDelete: (link: LinkRecord) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  origin,
  onOpenAnalytics,
  onOpenQR,
  onEditDestination,
  onToggleStatus,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const shortUrl = `${origin}/${link.code}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute Expiration Display
  const getExpirationText = () => {
    if (!link.expires_at) return null;
    const expTime = new Date(link.expires_at).getTime();
    const now = Date.now();
    const diffHours = Math.round((expTime - now) / (1000 * 60 * 60));

    if (diffHours <= 0) return 'Kedaluwarsa';
    if (diffHours < 24) return `Kedaluwarsa dlm ${diffHours} jam`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Kedaluwarsa besok';
    return `Kedaluwarsa dlm ${diffDays} hari`;
  };

  const expText = getExpirationText();

  // Status badge styling
  let statusBadge = (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
      Aktif
    </span>
  );
  if (link.status === 'disabled') {
    statusBadge = (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
        Nonaktif
      </span>
    );
  } else if (link.status === 'expired') {
    statusBadge = (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
        Kedaluwarsa
      </span>
    );
  }

  return (
    <div
      id={`link-card-${link.code}`}
      className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm transition-all text-left relative group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          {/* Top row: Code + Status Badge + Expiry info */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-sm sm:text-base text-neutral-950 dark:text-neutral-50">
              /{link.code}
            </span>
            {statusBadge}
            {expText && (
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                • {expText}
              </span>
            )}
          </div>

          {/* Original URL (truncated safely) */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-full font-sans" title={link.destination}>
            {link.destination}
          </p>
        </div>

        {/* Clicks count & overflow menu */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <BarChart2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>{link.click_count}</span>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Menu opsi tautan"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-1.5 text-xs text-neutral-700 dark:text-neutral-300 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAnalytics(link);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Lihat Statistik</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenQR(link);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Kode QR</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditDestination(link);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Tujuan</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleStatus(link);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{link.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>

                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tautan</span>
                  </a>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(link);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Tautan</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick copy bar */}
      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
        <span className="font-mono text-neutral-400 text-[11px] truncate max-w-[70%]">
          {shortUrl.replace(/^https?:\/\//, '')}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
    </div>
  );
};
