import React, { useState, useEffect } from 'react';
import { Power, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { LinkRecord } from '../types';
import { haptic } from '../utils/haptics';

interface StatusToggleModalProps {
  link: LinkRecord;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const StatusToggleModal: React.FC<StatusToggleModalProps> = ({
  link,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDeactivating = link.status === 'active';

  useEffect(() => {
    if (isOpen) {
      haptic.warning();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    haptic.heavy();
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      haptic.error();
      setErrorMessage(err?.message || 'Gagal mengubah status tautan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      id="status-toggle-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-toggle-dialog-title"
    >
      <motion.div
        id="status-toggle-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 font-semibold">
            <div className={`p-1.5 rounded-xl ${isDeactivating ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Power className="w-4 h-4" />
            </div>
            <h2 id="status-toggle-dialog-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {isDeactivating ? 'Nonaktifkan tautan?' : 'Aktifkan tautan kembali?'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300 break-all space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                /{link.code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                link.status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20'
              }`}>
                {link.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="truncate text-neutral-500 dark:text-neutral-400 text-[11px] pt-1">
              {link.destination}
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {isDeactivating ? (
              <span>
                Menonaktifkan tautan akan menghentikan pengalihan pengunjung ke URL tujuan. Pengunjung yang mengakses{' '}
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">/{link.code}</span>{' '}
                akan melihat halaman informasi status nonaktif. Anda dapat mengaktifkannya kembali kapan saja.
              </span>
            ) : (
              <span>
                Mengaktifkan kembali tautan akan memulihkan fungsi pengalihan secara instan. Pengunjung yang mengakses{' '}
                <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">/{link.code}</span>{' '}
                akan langsung diarahkan ke tujuan aslinya.
              </span>
            )}
          </p>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95 shadow-sm cursor-pointer ${
              isDeactivating
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isDeactivating ? (
              <Power className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isSubmitting
                ? 'Menyimpan...'
                : isDeactivating
                ? 'Nonaktifkan'
                : 'Aktifkan'}
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
