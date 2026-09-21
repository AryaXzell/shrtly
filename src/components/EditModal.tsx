import React, { useState } from 'react';
import { AlertCircle, X, Check, Globe } from 'lucide-react';
import { LinkRecord } from '../types';

interface EditModalProps {
  link: LinkRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newDestination: string) => Promise<void>;
}

export const EditModal: React.FC<EditModalProps> = ({ link, isOpen, onClose, onSave }) => {
  const [destination, setDestination] = useState(link.destination);
  const [hasConfirmedWarning, setHasConfirmedWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setErrorMessage('Destination URL cannot be empty');
      return;
    }
    if (!hasConfirmedWarning) {
      setErrorMessage('Please confirm that you understand the short link destination will change.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSave(destination.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update destination');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="edit-modal-container"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Tujuan Tautan /{link.code}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Sensitive Destination Change Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
              <div className="font-semibold">Peringatan: Perubahan Tujuan</div>
              <p>
                "This changes where your existing short link leads."
                Semua pengunjung yang membuka tautan publik yang sudah Anda bagikan akan langsung dialihkan ke alamat baru ini.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-destination-input"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              URL Tujuan Baru
            </label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                id="edit-destination-input"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://example.com/new-path"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConfirmedWarning}
              onChange={(e) => setHasConfirmedWarning(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 dark:focus:ring-white"
            />
            <span>
              Saya mengonfirmasi bahwa saya ingin mengubah tujuan tautan publik ini dan memahami dampaknya.
            </span>
          </label>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasConfirmedWarning}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
