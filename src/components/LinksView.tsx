import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpDown,
  CheckSquare,
  Check,
  Power,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkRecord } from '../types';
import { LinkCard } from './LinkCard';
import { EmptyState } from './EmptyState';
import { BulkDeleteModal } from './BulkDeleteModal';
import { IOSDropdown } from './IOSDropdown';
import { NoLinksIllustration, NoSearchResultsIllustration } from './illustrations/Illustrations';
import { haptic } from '../utils/haptics';

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
  onBulkToggleStatus?: (selectedLinks: LinkRecord[], targetStatus: 'active' | 'disabled') => Promise<void>;
  onBulkDelete?: (selectedLinks: LinkRecord[], permanent: boolean) => Promise<void>;
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
  onBulkToggleStatus,
  onBulkDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_clicks'>('newest');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Status counts for quick filter pill badges
  const statusCounts = useMemo(() => {
    let active = 0;
    let disabled = 0;
    let expired = 0;
    for (const l of links) {
      if (l.status === 'active') active++;
      else if (l.status === 'disabled') disabled++;
      else if (l.status === 'expired') expired++;
    }
    return { all: links.length, active, disabled, expired };
  }, [links]);

  const filteredLinks = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const cleanCodeQuery = rawQuery.replace(/^\/+/, '');

    return links
      .filter((link) => {
        // Status filter
        if (statusFilter !== 'all' && link.status !== statusFilter) {
          return false;
        }
        // Search query: match destination URL or custom short code
        if (rawQuery) {
          const matchCode =
            link.code.toLowerCase().includes(rawQuery) ||
            link.code.toLowerCase().includes(cleanCodeQuery);
          const matchDest = link.destination.toLowerCase().includes(rawQuery);
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
        return 0;
      });
  }, [links, searchQuery, statusFilter, sortBy]);

  // Handle single item selection toggle
  const handleToggleSelect = (internalId: string) => {
    haptic.selection();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(internalId)) {
        next.delete(internalId);
      } else {
        next.add(internalId);
      }
      return next;
    });
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    haptic.selection();
    if (selectedIds.size === filteredLinks.length && filteredLinks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLinks.map((l) => l.internal_id)));
    }
  };

  // Exit selection mode / deselect all
  const handleClearSelection = () => {
    haptic.selection();
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setActiveMenuId(null);
  };

  // Selected Link Objects
  const selectedLinksList = useMemo(() => {
    return links.filter((l) => selectedIds.has(l.internal_id));
  }, [links, selectedIds]);

  // Bulk Status Toggle
  const handleBulkStatusChange = async (targetStatus: 'active' | 'disabled') => {
    if (selectedLinksList.length === 0 || isBulkOperating) return;
    setIsBulkOperating(true);
    haptic.heavy();
    try {
      if (onBulkToggleStatus) {
        await onBulkToggleStatus(selectedLinksList, targetStatus);
      } else {
        // Fallback to sequential calls if no bulk handler passed
        for (const link of selectedLinksList) {
          if (link.status !== targetStatus) {
            await onToggleStatus(link);
          }
        }
      }
      setSelectedIds(new Set());
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Bulk Delete Confirm
  const handleConfirmBulkDelete = async (permanent: boolean) => {
    if (selectedLinksList.length === 0) return;
    setIsBulkOperating(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(selectedLinksList, permanent);
      } else {
        for (const link of selectedLinksList) {
          await onDelete(link);
        }
      }
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const isAllSelected = filteredLinks.length > 0 && selectedIds.size === filteredLinks.length;
  const isPartiallySelected = selectedIds.size > 0 && !isAllSelected;
  const isFiltering = Boolean(searchQuery.trim() || statusFilter !== 'all');
  const hasSelection = selectedIds.size > 0;

  return (
    <div id="links-view" className="space-y-4 text-left">
      {/* Search & Filter Controls Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5">
          {/* Search Input with Clear Button */}
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="links-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari URL tujuan atau kode tautan..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Hapus pencarian"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort selector iOS Dropdown */}
            <div className="flex-1 sm:flex-initial min-w-0">
              <IOSDropdown
                id="links-sort-select"
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                icon={<ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />}
                ariaLabel="Urutkan tautan"
                fullWidth={true}
                options={[
                  { value: 'newest', label: 'Terbaru' },
                  { value: 'most_clicks', label: 'Klik Terbanyak' },
                  { value: 'oldest', label: 'Terlama' },
                ]}
              />
            </div>

            {/* Quick Select All Toggle Button */}
            {filteredLinks.length > 0 && (
              <button
                id="toggle-select-all-btn"
                type="button"
                onClick={handleToggleSelectAll}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium transition-all shadow-sm shrink-0 border cursor-pointer active:scale-95 ${
                  isAllSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                    : 'bg-white/80 dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }`}
                title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua tautan'}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{isAllSelected ? 'Lepas' : 'Pilih Semua'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Filter Pills with Live Counters */}
        {links.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 max-w-full">
              {[
                { key: 'all', label: 'Semua', count: statusCounts.all },
                { key: 'active', label: 'Aktif', count: statusCounts.active },
                { key: 'disabled', label: 'Nonaktif', count: statusCounts.disabled },
                { key: 'expired', label: 'Kedaluwarsa', count: statusCounts.expired },
              ].map((tab) => {
                const isSelected = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setStatusFilter(tab.key as any);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 select-none cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'bg-neutral-100/90 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                        isSelected
                          ? 'bg-white/20 dark:bg-neutral-900/20 text-white dark:text-neutral-900 font-semibold'
                          : 'bg-neutral-200/90 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reset Filter Button if active */}
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-[11.5px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white shrink-0 font-medium hover:underline transition-colors pl-1 cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Search Results Summary Header when query or non-default filter is active */}
        {isFiltering && links.length > 0 && (
          <div className="flex items-center justify-between text-[11.5px] text-neutral-500 dark:text-neutral-400 px-1 pt-0.5">
            <span className="truncate">
              Menampilkan <strong className="text-neutral-900 dark:text-neutral-100">{filteredLinks.length}</strong> dari {links.length} tautan
              {searchQuery.trim() && (
                <span> untuk &ldquo;<span className="text-neutral-900 dark:text-neutral-100 font-mono">{searchQuery.trim()}</span>&rdquo;</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Bulk Action Sticky Bar (Floats cleanly below the top header on scroll) */}
      {hasSelection && (
        <div
          id="bulk-selection-bar"
          className="sticky top-16 sm:top-18 z-30 p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-300 dark:border-neutral-700 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Select All Checkbox & Count */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                  isAllSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-xs'
                    : isPartiallySelected
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                    : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                }`}
                title={isAllSelected ? 'Batalkan Semua' : 'Pilih Semua'}
              >
                {isAllSelected ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isPartiallySelected ? (
                  <div className="w-2.5 h-0.5 bg-white dark:bg-neutral-900 rounded-full" />
                ) : null}
              </button>

              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {selectedIds.size} dipilih{' '}
                <span className="text-neutral-400 font-normal">
                  (dari {filteredLinks.length})
                </span>
              </span>
            </div>

            {/* Mobile close/cancel button in header row */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="sm:hidden p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Batalkan semua pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons: Bulk Enable, Bulk Disable, Bulk Delete */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-end">
            {/* Activate Button */}
            <button
              type="button"
              id="bulk-enable-btn"
              onClick={() => handleBulkStatusChange('active')}
              disabled={isBulkOperating}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              {isBulkOperating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
              <span>Aktifkan</span>
            </button>

            {/* Disable Button */}
            <button
              type="button"
              id="bulk-disable-btn"
              onClick={() => handleBulkStatusChange('disabled')}
              disabled={isBulkOperating}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              {isBulkOperating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
              <span>Nonaktifkan</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              id="bulk-delete-btn"
              onClick={() => {
                haptic.warning();
                setShowBulkDeleteModal(true);
              }}
              disabled={isBulkOperating}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>

            {/* Desktop Cancel Button */}
            <button
              type="button"
              id="bulk-clear-selection-btn"
              onClick={handleClearSelection}
              className="hidden sm:inline-flex p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Batalkan semua pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
          <EmptyState
            illustration={<NoLinksIllustration size={100} />}
            title="Belum ada tautan singkat"
            description="Tautan yang Anda persingkat dari peramban ini akan muncul di sini tanpa perlu login akun."
            action={{
              label: 'Perpendek Tautan Sekarang',
              icon: <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
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
        <motion.div layout className="space-y-3 pb-12 sm:pb-4">
          <AnimatePresence mode="popLayout">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.internal_id}
                link={link}
                origin={origin}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(link.internal_id)}
                onToggleSelect={handleToggleSelect}
                isMenuOpen={activeMenuId === link.internal_id}
                onToggleMenu={() =>
                  setActiveMenuId((prev) => (prev === link.internal_id ? null : link.internal_id))
                }
                onCloseMenu={() => {
                  setActiveMenuId((prev) => (prev === link.internal_id ? null : prev));
                }}
                onOpenAnalytics={onOpenAnalytics}
                onOpenQR={onOpenQR}
                onEditDestination={onEditDestination}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          selectedLinks={selectedLinksList}
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      )}
    </div>
  );
};

