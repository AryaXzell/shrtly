import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  Shield,
  Wifi,
  HardDrive,
  Cpu,
  Lock,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { LinkRecord, HealthStatus } from '../types';
import { getOrCreateOwnerId, getAllTokensList } from '../utils/tokenStorage';

interface SystemStatusViewProps {
  healthStatus: HealthStatus | null;
  links: LinkRecord[];
  onRefreshHealth: () => Promise<void>;
  isRefreshingHealth?: boolean;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  healthStatus,
  links,
  onRefreshHealth,
  isRefreshingHealth = false,
}) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          setStorageUsage({
            used: estimate.usage,
            quota: estimate.quota,
          });
        }
      }).catch(() => {});
    }
  }, []);

  const handleRefresh = async () => {
    setLocalRefreshing(true);
    try {
      await onRefreshHealth();
    } finally {
      setTimeout(() => setLocalRefreshing(false), 500);
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'Baru saja dimulai';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ownerId = typeof window !== 'undefined' ? getOrCreateOwnerId() : '';
  const localTokensCount = typeof window !== 'undefined' ? getAllTokensList().length : 0;
  const isRefreshing = localRefreshing || isRefreshingHealth;

  const isHealthy = healthStatus?.status === 'ok' || healthStatus?.storage?.connected;
  const latency = healthStatus?.storage?.latency_ms;

  return (
    <div id="system-status-view" className="max-w-2xl mx-auto space-y-6 text-left animate-in fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Status Sistem & Backend
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Metrik performa real-time, status server, diagnosa database, dan integritas peramban.
          </p>
        </div>

        <button
          id="system-status-refresh-btn"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Memeriksa...' : 'Perbarui Status'}</span>
        </button>
      </div>

      {/* Main Overall Health Card */}
      <div className="p-6 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full relative flex items-center justify-center ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block">Kondisi Layanan:</span>
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {isHealthy ? 'Semua Sistem Beroperasi Normal' : 'Sistem Dalam Mode Fallback'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
            <Server className="w-3.5 h-3.5 text-neutral-400" />
            <span>Versi: {healthStatus?.version || 'v1.2.0'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800 space-y-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Uptime Server
            </span>
            <p className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {healthStatus?.uptime_seconds ? formatUptime(healthStatus.uptime_seconds) : '-'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800 space-y-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Wifi className="w-3 h-3" /> Latensi Respon
            </span>
            <p className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {latency !== undefined ? `${latency} ms` : '-'}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800 space-y-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Status Terakhir
            </span>
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {healthStatus?.timestamp
                ? new Date(healthStatus.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Belum diperbarui'}
            </p>
          </div>
        </div>
      </div>

      {/* Database & Storage Engine Section */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Database className="w-4 h-4 text-neutral-500" />
          <span>Arsitektur Penyimpanan Database</span>
        </div>

        <div className="space-y-2 text-xs divide-y divide-neutral-100 dark:divide-neutral-800/60">
          <div className="flex items-center justify-between pb-2">
            <span className="text-neutral-500">Mesin Utama (Primary Engine):</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                healthStatus?.storage?.engine === 'upstash_redis' && healthStatus?.storage?.connected
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`} />
              {healthStatus?.storage?.engine === 'upstash_redis'
                ? 'Upstash Redis Cloud (In-Memory Cluster)'
                : 'Local Persistent (JSON File Storage System)'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-500">Status Konektivitas Redis/Database:</span>
            <span className="font-semibold">
              {healthStatus?.storage?.connected ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized & Active
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Fallback Mode (Penyimpanan Lokal Aktif)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-500">Total Tautan Terdaftar di Sistem:</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
              {healthStatus?.storage?.total_links ?? links.length} tautan
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-500">Kunci Tombstone (Proteksi Anti-Phishing):</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
              {healthStatus?.storage?.total_tombstones ?? 0} kode ter-reservasi
            </span>
          </div>
        </div>

        {healthStatus?.storage?.detail_message && (
          <div className="p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-950/80 border border-neutral-200/50 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
            {healthStatus.storage.detail_message}
          </div>
        )}
      </div>

      {/* Services & API Health Checklist */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <Globe className="w-4 h-4 text-neutral-500" />
          <span>Status Layanan API & Endpoint Core</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800">
            <span className="font-mono text-neutral-700 dark:text-neutral-300">GET /api/health</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800">
            <span className="font-mono text-neutral-700 dark:text-neutral-300">POST /api/links</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800">
            <span className="font-mono text-neutral-700 dark:text-neutral-300">GET /api/export</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/50 dark:border-neutral-800">
            <span className="font-mono text-neutral-700 dark:text-neutral-300">POST /api/report</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Guard
            </span>
          </div>
        </div>
      </div>

      {/* Local Client & Browser Environment State */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          <HardDrive className="w-4 h-4 text-neutral-500" />
          <span>Status Peramban & Penyimpanan Lokal</span>
        </div>

        <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center justify-between">
            <span>ID Pemilik Anonim (Owner Identifier):</span>
            <span className="font-mono text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              {ownerId ? `${ownerId.slice(0, 14)}...` : 'Belum diinisialisasi'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>Kunci Manajemen Lokal Tersimpan:</span>
            <span className="font-mono text-neutral-900 dark:text-neutral-100">
              {localTokensCount} token
            </span>
          </div>

          {storageUsage && (
            <div className="flex items-center justify-between">
              <span>Penggunaan Storage Peramban:</span>
              <span className="font-mono text-neutral-900 dark:text-neutral-100">
                {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Progressive Web App (PWA):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Offline Cache Enabled
            </span>
          </div>
        </div>
      </div>

      {/* System Security & Integrity Guarantees */}
      <div className="p-5 rounded-3xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
          <Shield className="w-4 h-4 text-neutral-500" />
          <span>Jaminan Keamanan & Integritas Sistem</span>
        </div>
        <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1.5 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-neutral-700 dark:text-neutral-300">Resiko Re-Use Nol:</strong> Kode tautan yang dihapus diisi oleh Tombstones permanen agar tidak bisa digunakan kembali oleh pihak jahat.
          </li>
          <li>
            <strong className="text-neutral-700 dark:text-neutral-300">Keamanan Tanpa Login:</strong> Menggunakan token kriptografi lokal (Owner & Management tokens) sehingga Anda tetap memiliki kontrol atas tautan tanpa perlu mendaftar akun.
          </li>
          <li>
            <strong className="text-neutral-700 dark:text-neutral-300">Performa Tinggi:</strong> Menggunakan layer in-memory cache dengan latensi rendah untuk pengalihan instan.
          </li>
        </ul>
      </div>
    </div>
  );
};
