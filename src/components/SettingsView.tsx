import React, { useState } from 'react';
import {
  Download,
  Trash2,
  ShieldCheck,
  HardDrive,
  Info,
  Check,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { LinkRecord, HealthStatus } from '../types';
import { clearAllLocalData } from '../utils/tokenStorage';

interface SettingsViewProps {
  links: LinkRecord[];
  healthStatus: HealthStatus | null;
  onClearLocalData: () => void;
  onRefreshHealth?: () => Promise<void>;
  isRefreshingHealth?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  links,
  healthStatus,
  onClearLocalData,
  onRefreshHealth,
  isRefreshingHealth = false,
}) => {
  const [clearedNotice, setClearedNotice] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshHealth) return;
    setLocalRefreshing(true);
    try {
      await onRefreshHealth();
    } finally {
      setTimeout(() => setLocalRefreshing(false), 400);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shrtly-links-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (links.length === 0) return;
    const headers = ['code', 'destination', 'click_count', 'status', 'created_at', 'expires_at'];
    const rows = links.map((l) => [
      l.code,
      `"${l.destination.replace(/"/g, '""')}"`,
      l.click_count,
      l.status,
      l.created_at,
      l.expires_at || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `shrtly-links-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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

      {/* System Engine Health & Storage Diagnostics */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            <HardDrive className="w-4 h-4 text-neutral-500" />
            <span>Status Sistem & Backend</span>
          </div>
          {onRefreshHealth && (
            <button
              id="sync-backend-status-btn"
              onClick={handleRefresh}
              disabled={localRefreshing || isRefreshingHealth}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50"
              title="Sinkronkan status koneksi backend dan database"
            >
              <RefreshCw className={`w-3 h-3 ${localRefreshing || isRefreshingHealth ? 'animate-spin' : ''}`} />
              <span>{localRefreshing || isRefreshingHealth ? 'Memeriksa...' : 'Sinkronkan'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span>Mesin Penyimpanan:</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${
                healthStatus?.storage?.engine === 'upstash_redis' && healthStatus?.storage?.connected
                  ? 'bg-emerald-500'
                  : healthStatus?.storage?.connected
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`} />
              <span className="font-mono text-neutral-900 dark:text-neutral-100">
                {healthStatus?.storage?.engine === 'upstash_redis'
                  ? 'Upstash Redis Cloud'
                  : 'Local Persistent (JSON Storage)'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Status Koneksi:</span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              {healthStatus?.storage?.connected ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Tersinkronisasi & Aktif
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  Degraded / Fallback Lokal
                </span>
              )}
            </span>
          </div>

          {healthStatus?.storage?.latency_ms !== undefined && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Latensi Respon:</span>
              </span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100">
                {healthStatus.storage.latency_ms} ms
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Total Tautan Sistem:</span>
            <span className="font-mono text-neutral-900 dark:text-neutral-100">
              {healthStatus?.storage?.total_links ?? links.length} tautan aktif
            </span>
          </div>

          {healthStatus?.storage?.total_tombstones !== undefined && healthStatus.storage.total_tombstones > 0 && (
            <div className="flex items-center justify-between">
              <span>Tombstones (Anti-Reuse):</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100">
                {healthStatus.storage.total_tombstones} kode terkunci
              </span>
            </div>
          )}

          {healthStatus?.storage?.detail_message && (
            <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {healthStatus.storage.detail_message}
            </div>
          )}
        </div>
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
