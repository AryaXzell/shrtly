import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';
import { LinkRecord } from '../types';

interface DeleteModalProps {
  link: LinkRecord;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean) => Promise<void>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  link,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [deleteOnServer, setDeleteOnServer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm(deleteOnServer);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete deletion on server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      {/* Container: Bottom-sheet on mobile, centered glass modal on desktop */}
      <div
        id="delete-modal-container"
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl p-6 pb-9 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl transition-all sm:scale-100 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <h2 id="delete-dialog-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Hapus tautan ini?
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
            <div className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
              /{link.code}
            </div>
            <div className="truncate text-neutral-500 dark:text-neutral-400 text-[11px]">
              {link.destination}
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Tindakan ini akan menonaktifkan pengalihan tautan publik. Kode unik{' '}
            <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
              {link.code}
            </span>{' '}
            tetap direservasi permanen (tombstone) dan tidak akan pernah digunakan kembali.
          </p>

          {/* Toggle: Hapus juga di sisi server? */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <label
              htmlFor="server-delete-toggle"
              className="flex items-start justify-between gap-3 cursor-pointer select-none"
            >
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Hapus juga di sisi server?
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {deleteOnServer
                    ? 'Data tautan dan riwayat analitik akan dihapus permanen dari server. Tidak bisa di-undo.'
                    : 'Hanya sembunyikan dari daftar kelola Anda. Tautan tetap mati dan kode ter-tombstone.'}
                </p>
              </div>
              <input
                type="checkbox"
                id="server-delete-toggle"
                checked={deleteOnServer}
                onChange={(e) => setDeleteOnServer(e.target.checked)}
                disabled={isSubmitting}
                className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 dark:bg-neutral-800 dark:border-neutral-700"
              />
            </label>
          </div>

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
            className="px-4 py-2 rounded-full text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white transition-transform active:scale-95 shadow-sm ${
              deleteOnServer
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Menghapus...' : deleteOnServer ? 'Hapus Permanen' : 'Hapus'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
