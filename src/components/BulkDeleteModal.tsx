import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { LinkRecord } from '../types';
import { haptic } from '../utils/haptics';

interface BulkDeleteModalProps {
  selectedLinks: LinkRecord[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean) => Promise<void>;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  selectedLinks,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [deleteOnServer, setDeleteOnServer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      haptic.warning();
    }
  }, [isOpen]);

  if (!isOpen || selectedLinks.length === 0) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    haptic.heavy();
    try {
      await onConfirm(deleteOnServer);
      onClose();
    } catch (err: any) {
      haptic.error();
      setErrorMessage(err?.message || 'Gagal menghapus tautan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      id="bulk-delete-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-dialog-title"
    >
      <motion.div
        id="bulk-delete-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <h2 id="bulk-delete-dialog-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Hapus {selectedLinks.length} tautan?
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
          <div className="p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300 max-h-32 overflow-y-auto space-y-1 font-mono">
            {selectedLinks.slice(0, 5).map((l) => (
              <div key={l.internal_id} className="truncate">
                • /{l.code} ({l.destination})
              </div>
            ))}
            {selectedLinks.length > 5 && (
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 pt-1 font-sans">
                + {selectedLinks.length - 5} tautan lainnya
              </div>
            )}
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Tindakan ini akan menghapus {selectedLinks.length} tautan terpilih. Kode unik yang telah dihapus tetap direservasi permanen agar tidak disalahgunakan.
          </p>

          {/* Toggle: Hapus permanen dari server */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <label
              htmlFor="bulk-server-delete-toggle"
              className="flex items-start justify-between gap-3 cursor-pointer select-none"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Hapus permanen dari server?
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {deleteOnServer
                    ? 'Data dan riwayat statistik akan dihapus permanen dari server.'
                    : 'Hanya sembunyikan dari daftar kelola Anda. Tautan tetap dinonaktifkan.'}
                </p>
              </div>
              <input
                id="bulk-server-delete-toggle"
                type="checkbox"
                checked={deleteOnServer}
                onChange={(e) => setDeleteOnServer(e.target.checked)}
                className="mt-1 w-4 h-4 text-rose-600 border-neutral-300 rounded focus:ring-rose-500"
              />
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-full bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Menghapus...' : `Hapus ${selectedLinks.length} Tautan`}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
