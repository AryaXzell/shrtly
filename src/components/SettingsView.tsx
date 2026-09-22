import React, { useState } from 'react';
import {
  Download,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { LinkRecord } from '../types';
import { clearAllLocalData } from '../utils/tokenStorage';
import { exportLinks } from '../utils/api';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  links: LinkRecord[];
  onClearLocalData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  links,
  onClearLocalData,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = async () => {
    try {
      const blob = await exportLinks('json');
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `shrtly-links-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('JSON export error:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportLinks('csv');
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `shrtly-links-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
    }
  };

  const handleConfirmClear = () => {
    clearAllLocalData();
    onClearLocalData();
    setShowClearConfirm(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
  };

  return (
    <div id="settings-view" className="max-w-xl mx-auto space-y-6 text-left animate-in fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Pengaturan & Data Pribadi
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Kelola data lokal, ekspor tautan Anda, dan pelajari komitmen privasi SHRTLY.
        </p>
      </div>

      {/* PWA Install Promo Button */}
      <PWAInstallButton />

      {/* Export Section */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Download className="w-4 h-4 text-neutral-500" />
          <span>Ekspor Tautan ({links.length} tautan)</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Unduh salinan data seluruh tautan yang dikelola oleh peramban ini dalam format JSON atau CSV.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleExportJSON}
            disabled={links.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={links.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Local Storage & Credentials Reset */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
          <Trash2 className="w-4 h-4" />
          <span>Hapus Kredensial & Riwayat Lokal</span>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Menghapus token anonim dan riwayat tautan dari penyimpanan peramban ini. Tautan publik yang sudah dibuat tetap aktif, namun Anda tidak lagi dapat mengedit atau melihat statistiknya dari peramban ini.
        </p>

        {clearedNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Data peramban lokal berhasil dibersihkan.</span>
          </div>
        )}

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Data Lokal</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Yakin ingin menghapus kredensial lokal? Tindakan ini tidak dapat dibatalkan.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors"
              >
                Ya, Bersihkan Sekarang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Commitment */}
      <div className="p-5 rounded-3xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
          <ShieldCheck className="w-4 h-4 text-neutral-500" />
          <span>Prinsip Privasi SHRTLY</span>
        </div>
        <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1 leading-relaxed list-disc list-inside">
          <li>Tidak ada pelacakan cookie lintas situs atau penjualan data pengguna.</li>
          <li>Alamat IP pengunjung tidak pernah disimpan secara mentah (IP-anonymized).</li>
          <li>Kode tautan yang dihapus ter-tombstone permanen untuk mencegah phishing re-use.</li>
          <li>Analitik hanya mencatat metrik agregat yang diperlukan secara fungsional.</li>
        </ul>
      </div>
    </div>
  );
};
