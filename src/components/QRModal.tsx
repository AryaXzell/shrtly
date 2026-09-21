import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface QRModalProps {
  shortUrl: string;
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ shortUrl, code, isOpen, onClose }) => {
  const [svgString, setSvgString] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && shortUrl) {
      // Generate clean vector SVG
      QRCode.toString(shortUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
      })
        .then((svg) => setSvgString(svg))
        .catch((err) => console.error('QR SVG error', err));

      // Generate PNG for direct download
      QRCode.toDataURL(shortUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('QR DataURL error', err));
    }
  }, [isOpen, shortUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `shrtly-qr-${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      id="qr-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        id="qr-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-center"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Kode QR Tautan
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm inline-block">
            {svgString ? (
              <div
                className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400">
                Memuat QR...
              </div>
            )}
          </div>
          <p className="mt-3 font-mono text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[220px]">
            {shortUrl}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PNG</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
