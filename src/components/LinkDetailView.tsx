import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Calendar,
  Globe,
  Smartphone,
  Compass,
  History,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { LinkRecord, LinkAnalytics } from '../types';
import { getLinkAnalytics } from '../utils/api';
import { EmptyState } from './EmptyState';
import { NoAnalyticsIllustration } from './illustrations/Illustrations';

interface LinkDetailViewProps {
  link: LinkRecord;
  origin: string;
  onBack: () => void;
}

export const LinkDetailView: React.FC<LinkDetailViewProps> = ({ link, origin, onBack }) => {
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shortUrl = `${origin}/${link.code}`;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLinkAnalytics(link.internal_id);
        if (isMounted) setAnalytics(data);
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Gagal memuat analitik.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [link.internal_id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find max clicks in clicks_by_date for relative chart heights
  const maxDayClicks = analytics?.clicks_by_date
    ? Math.max(1, ...analytics.clicks_by_date.map((d) => d.clicks))
    : 1;

  return (
    <div id="link-detail-view" className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Back header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar</span>
        </button>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
        </button>
      </div>

      {/* Hero Link Info */}
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100">
            /{link.code}
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Dibuat {new Date(link.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 break-all">
          Menuju:{' '}
          <a
            href={link.destination}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-800 dark:text-neutral-200 hover:underline"
          >
            {link.destination}
          </a>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-neutral-400">
          Memuat statistik...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : !analytics || analytics.total_clicks === 0 ? (
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
          <EmptyState
            illustration={<NoAnalyticsIllustration size={100} />}
            title="Belum ada statistik"
            description="Tautan ini belum menerima klik dari pengunjung. Bagikan tautan untuk mulai memantau pengalihan."
          />
        </div>
      ) : (
        <>
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">Total Klik</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {analytics.total_clicks}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">Hari Ini</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {analytics.today_clicks}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">7 Hari Terakhir</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {analytics.last_7_days_clicks}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-medium">30 Hari Terakhir</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {analytics.last_30_days_clicks}
              </div>
            </div>
          </div>

          {/* Activity Over Time Chart */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Klik 7 Hari Terakhir</span>
              </h3>
              <span className="text-[10px] text-neutral-400">Diperbarui real-time</span>
            </div>

            {/* Subtle Minimalist Bar Chart */}
            <div className="pt-4 pb-2 flex items-end justify-between gap-2 h-36 px-2">
              {analytics.clicks_by_date.map((item) => {
                const heightPct = Math.max(8, Math.round((item.clicks / maxDayClicks) * 100));
                const dayLabel = item.date.slice(5); // MM-DD
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.clicks}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-neutral-900 dark:bg-white transition-all group-hover:bg-neutral-700 dark:group-hover:bg-neutral-200"
                    />
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy-Preserved Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Referrers */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                <Compass className="w-3.5 h-3.5 text-neutral-400" />
                <span>Sumber Rujukan</span>
              </div>
              <div className="space-y-1.5">
                {analytics.referrers.slice(0, 4).map((r) => (
                  <div key={r.source} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[120px]">
                      {r.source}
                    </span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">
                      {r.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                <span>Perangkat</span>
              </div>
              <div className="space-y-1.5">
                {analytics.devices.slice(0, 4).map((d) => (
                  <div key={d.device} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">{d.device}</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browsers */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                <span>Browser</span>
              </div>
              <div className="space-y-1.5">
                {analytics.browsers.slice(0, 4).map((b) => (
                  <div key={b.browser} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">{b.browser}</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-neutral-400" />
              <span>Riwayat Aktivitas Tautan (Audit Log)</span>
            </h3>
            <div className="space-y-2">
              {analytics.audit_logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 capitalize">
                      {log.event.replace(/_/g, ' ')}
                    </span>
                    {log.details && (
                      <p className="text-[11px] text-neutral-500 mt-0.5">{log.details}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
