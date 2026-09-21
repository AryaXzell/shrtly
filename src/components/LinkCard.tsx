import React, { useState, useEffect, useRef, memo } from 'react';
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
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkRecord } from '../types';
import { haptic } from '../utils/haptics';

interface LinkCardProps {
  link: LinkRecord;
  origin: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (internalId: string) => void;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  onOpenAnalytics: (link: LinkRecord) => void;
  onOpenQR: (link: LinkRecord) => void;
  onEditDestination: (link: LinkRecord) => void;
  onToggleStatus: (link: LinkRecord) => void;
  onDelete: (link: LinkRecord) => void;
}

export const LinkCard: React.FC<LinkCardProps> = memo(({
  link,
  origin,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenAnalytics,
  onOpenQR,
  onEditDestination,
  onToggleStatus,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  const isControlled = typeof isMenuOpen === 'boolean';
  const isOpen = isControlled ? isMenuOpen : internalMenuOpen;

  const closeMenu = () => {
    if (onCloseMenu) {
      onCloseMenu();
    } else {
      setInternalMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    haptic.selection();
    if (onToggleMenu) {
      onToggleMenu();
    } else {
      setInternalMenuOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 240) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isInsideDesktopMenu = menuRef.current?.contains(target);
      const isInsideMobileSheet = mobileSheetRef.current?.contains(target);

      if (!isInsideDesktopMenu && !isInsideMobileSheet) {
        closeMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleScroll = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 280 && rect.top > 240) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const shortUrl = `${origin}/${link.code}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shortUrl);
    haptic.success();
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
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        id={`link-card-${link.code}`}
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelect?.(link.internal_id);
          }
        }}
        className={`p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm transition-all text-left relative group ${
          isSelectionMode ? 'cursor-pointer select-none' : ''
        } ${
          isSelected
            ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/20 dark:ring-white/20 bg-neutral-50/90 dark:bg-neutral-850'
            : 'border-neutral-200/80 dark:border-neutral-800'
        } ${isOpen ? 'z-30' : 'z-0'}`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Integrated Interactive Checkbox */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.selection();
              onToggleSelect?.(link.internal_id);
            }}
            className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
              isSelected
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-xs'
                : 'bg-neutral-100/80 dark:bg-neutral-800/80 border-neutral-300/90 dark:border-neutral-700 hover:border-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700'
            }`}
            aria-label={isSelected ? 'Batalkan pilihan tautan' : 'Pilih tautan'}
            title={isSelected ? 'Batalkan pilihan' : 'Pilih tautan'}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </motion.button>

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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <BarChart2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>{link.click_count}</span>
            </div>

            {/* Menu button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu();
                }}
                className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95"
                aria-label="Menu opsi tautan"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Desktop Dropdown (hidden on mobile, visible on sm and up) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: openUpward ? 6 : -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`hidden sm:block absolute right-0 z-50 w-48 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1.5 text-xs text-neutral-700 dark:text-neutral-300 ${
                      openUpward ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
                    }`}
                  >
                    <button
                      onClick={() => {
                        closeMenu();
                        onOpenAnalytics(link);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Lihat Statistik</span>
                    </button>

                    <button
                      onClick={() => {
                        closeMenu();
                        onOpenQR(link);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Kode QR</span>
                    </button>

                    <button
                      onClick={() => {
                        closeMenu();
                        onEditDestination(link);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah Tujuan</span>
                    </button>

                    <button
                      onClick={() => {
                        closeMenu();
                        onToggleStatus(link);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{link.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>

                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => closeMenu()}
                      className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Tautan</span>
                    </a>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                    <button
                      onClick={() => {
                        closeMenu();
                        onDelete(link);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Tautan</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Quick copy bar */}
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-neutral-400 text-[11px] truncate min-w-0 flex-1">
            {shortUrl.replace(/^https?:\/\//, '')}
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium transition-colors shrink-0 p-1 rounded-md cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Bottom Action Sheet (100% visible, safe area padding on phones) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs"
            onClick={closeMenu}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              ref={mobileSheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-full bg-white dark:bg-neutral-900 rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 font-mono">
                      /{link.code}
                    </h4>
                    {statusBadge}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[260px] mt-0.5">
                    {link.destination}
                  </p>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenAnalytics(link);
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors text-left cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4 text-neutral-500" />
                  <span>Lihat Statistik</span>
                </button>

                <button
                  onClick={() => {
                    closeMenu();
                    onOpenQR(link);
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors text-left cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-neutral-500" />
                  <span>Kode QR</span>
                </button>

                <button
                  onClick={() => {
                    closeMenu();
                    onEditDestination(link);
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors text-left cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-neutral-500" />
                  <span>Ubah Tujuan</span>
                </button>

                <button
                  onClick={() => {
                    closeMenu();
                    onToggleStatus(link);
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors text-left cursor-pointer"
                >
                  <Power className="w-4 h-4 text-neutral-500" />
                  <span>{link.status === 'active' ? 'Nonaktifkan Tautan' : 'Aktifkan Tautan'}</span>
                </button>

                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMenu}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors text-left cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-500" />
                  <span>Buka Tautan</span>
                </a>

                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                <button
                  onClick={() => {
                    closeMenu();
                    onDelete(link);
                  }}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium active:bg-rose-100 dark:active:bg-rose-900/50 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Tautan</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
