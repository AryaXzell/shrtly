import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { LinkRecord } from '../types';
import { LinkCard } from './LinkCard';
import { EmptyState } from './EmptyState';
import { NoLinksIllustration, NoSearchResultsIllustration } from './illustrations/Illustrations';

interface LinksViewProps {
  links: LinkRecord[];
  loading: boolean;
  origin: string;
  onNavigateToHome: () => void;
  onOpenAnalytics: (link: LinkRecord) => void;
  onOpenQR: (link: LinkRecord) => void;
  onEditDestination: (link: LinkRecord) => void;
  onToggleStatus: (link: LinkRecord) => void;
  onDelete: (link: LinkRecord) => void;
}

export const LinksView: React.FC<LinksViewProps> = ({
  links,
  loading,
  origin,
  onNavigateToHome,
  onOpenAnalytics,
  onOpenQR,
  onEditDestination,
  onToggleStatus,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_clicks' | 'least_clicks'>('newest');

  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        // Status filter
        if (statusFilter !== 'all' && link.status !== statusFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = link.code.toLowerCase().includes(q);
          const matchDest = link.destination.toLowerCase().includes(q);
          return matchCode || matchDest;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'most_clicks') {
          return b.click_count - a.click_count;
        }
        if (sortBy === 'least_clicks') {
          return a.click_count - b.click_count;
        }
        return 0;
      });
  }, [links, searchQuery, statusFilter, sortBy]);

  return (
    <div id="links-view" className="space-y-5 text-left">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="links-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau tujuan..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-8 pr-7 py-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none cursor-pointer shadow-sm"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="disabled">Nonaktif</option>
              <option value="expired">Kedaluwarsa</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-8 pr-7 py-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white appearance-none cursor-pointer shadow-sm"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="most_clicks">Klik Terbanyak</option>
              <option value="least_clicks">Klik Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        // Skeleton Cards
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/50 animate-pulse space-y-3"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800/60 rounded w-3/4" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800/40 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
          <EmptyState
            illustration={<NoLinksIllustration size={110} />}
            title="Belum ada tautan singkat"
            description="Tautan yang Anda persingkat dari peramban ini akan muncul di sini tanpa perlu login akun."
            action={{
              label: 'Perpendek Tautan Sekarang',
              icon: <Plus className="w-4 h-4" />,
              onClick: onNavigateToHome,
            }}
          />
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
          <EmptyState
            illustration={<NoSearchResultsIllustration size={110} />}
            title="Tidak ditemukan tautan"
            description="Tidak ada tautan yang cocok dengan pencarian atau filter yang dipilih."
            action={{
              label: 'Reset Filter',
              onClick: () => {
                setSearchQuery('');
                setStatusFilter('all');
              },
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.internal_id}
              link={link}
              origin={origin}
              onOpenAnalytics={onOpenAnalytics}
              onOpenQR={onOpenQR}
              onEditDestination={onEditDestination}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
