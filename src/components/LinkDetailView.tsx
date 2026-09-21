import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Globe,
  Smartphone,
  Compass,
  History,
  AlertCircle,
  Copy,
  Check,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { LinkRecord, LinkAnalytics } from '../types';
import { getLinkAnalytics } from '../utils/api';
import { haptic } from '../utils/haptics';
import { EmptyState } from './EmptyState';
import { NoAnalyticsIllustration } from './illustrations/Illustrations';

interface LinkDetailViewProps {
  link: LinkRecord;
  origin: string;
  onBack: () => void;
}

// Custom Tooltip Component for Recharts
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateFormatted = new Date(data.date).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return (
      <div className="px-3.5 py-2.5 rounded-xl bg-neutral-900/95 dark:bg-neutral-800/95 backdrop-blur-md text-white border border-neutral-700/60 shadow-xl text-xs space-y-1 z-50">
        <p className="text-[11px] text-neutral-400 font-medium">{dateFormatted}</p>
        <div className="flex items-center justify-between gap-4 pt-0.5">
          <span className="text-neutral-300 text-[11.5px]">Jumlah Klik:</span>
          <span className="font-mono text-emerald-400 text-sm font-bold">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const LinkDetailView: React.FC<LinkDetailViewProps> = ({ link, origin, onBack }) => {
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const shortUrl = `${origin}/${link.code}`;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLinkAnalytics(link.internal_id, link.code);
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
  }, [link.internal_id, link.code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    haptic.success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Prepare chart data based on selected time range (default 30 days)
  const chartData = useMemo(() => {
    if (!analytics?.clicks_by_date || analytics.clicks_by_date.length === 0) return [];

    const fullHistory = analytics.clicks_by_date;
    const sliceCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const sliced = fullHistory.slice(-sliceCount);

    return sliced.map((item) => {
      const d = new Date(item.date);
      return {
        date: item.date,
        dayLabel: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        shortDate: d.toLocaleDateString('id-ID', { day: 'numeric' }),
        clicks: item.clicks,
      };
    });
  }, [analytics, timeRange]);

  // Statistics for selected range
  const rangeStats = useMemo(() => {
    if (chartData.length === 0) return { total: 0, peak: 0, peakDate: '-' };
    const total = chartData.reduce((acc, curr) => acc + curr.clicks, 0);
    let peak = 0;
    let peakDate = '-';
    for (const item of chartData) {
      if (item.clicks > peak) {
        peak = item.clicks;
        peakDate = item.dayLabel;
      }
    }
    return { total, peak, peakDate };
  }, [chartData]);

  return (
    <div id="link-detail-view" className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Back header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar</span>
        </button>

        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
        </button>
      </div>

      {/* Hero Link Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              /{link.code}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Dibuat {new Date(link.created_at).toLocaleDateString('id-ID')}
          </span>
        </div>

        {/* Generated Short URL with Copy to Clipboard button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/50">
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-sm sm:text-base font-semibold text-neutral-950 dark:text-neutral-50 hover:underline truncate inline-flex items-center gap-1.5"
          >
            <span className="truncate">{shortUrl}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </a>

          <button
            id="detail-copy-short-url-btn"
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer select-none shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90'
            }`}
            aria-label="Salin tautan singkat ke papan klip"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5] animate-in zoom-in duration-150" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Tersalin!' : 'Salin'}</span>
          </button>
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

          {/* Recharts Bar Chart: Click Count History over the last 30 days */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Riwayat Klik (30 Hari Terakhir)</span>
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Visualisasi performa dan tren klik harian
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                {(
                  [
                    { key: '7d', label: '7 Hari' },
                    { key: '14d', label: '14 Hari' },
                    { key: '30d', label: '30 Hari' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setTimeRange(tab.key);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                      timeRange === tab.key
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="w-full h-56 sm:h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      setHoveredBarIndex(
                        typeof state.activeTooltipIndex === 'number'
                          ? state.activeTooltipIndex
                          : null
                      );
                    }
                  }}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-neutral-200/60 dark:text-neutral-800/60"
                  />
                  <XAxis
                    dataKey={timeRange === '30d' ? 'shortDate' : 'dayLabel'}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-neutral-400 dark:text-neutral-500 font-mono"
                    interval={timeRange === '30d' ? 2 : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-neutral-400 dark:text-neutral-500 font-mono"
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{
                      fill: 'currentColor',
                      className: 'text-neutral-100/50 dark:text-neutral-800/40',
                      radius: 6,
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    name="Klik"
                    radius={[5, 5, 0, 0]}
                    animationDuration={600}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className={`transition-colors duration-150 ${
                          hoveredBarIndex === index
                            ? 'fill-emerald-500 dark:fill-emerald-400'
                            : 'fill-neutral-900 dark:fill-neutral-100'
                        }`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chart Summary Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Total periode ini: <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{rangeStats.total} klik</strong>
                </span>
              </div>
              {rangeStats.peak > 0 && (
                <div>
                  Puncak:{' '}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {rangeStats.peak} klik
                  </span>{' '}
                  ({rangeStats.peakDate})
                </div>
              )}
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
                  <div key={r.source} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate min-w-0 flex-1" title={r.source}>
                      {r.source}
                    </span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium shrink-0">
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
                  <div key={d.device} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate min-w-0 flex-1">{d.device}</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium shrink-0">
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
                  <div key={b.browser} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate min-w-0 flex-1">{b.browser}</span>
                    <span className="font-mono text-neutral-900 dark:text-neutral-100 font-medium shrink-0">
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
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 capitalize">
                      {log.event.replace(/_/g, ' ')}
                    </span>
                    {log.details && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 break-words">{log.details}</p>
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
