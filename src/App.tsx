import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppShell } from './components/AppShell';
import { HomeView } from './components/HomeView';
import { LinksView } from './components/LinksView';
import { LinkDetailView } from './components/LinkDetailView';
import { SettingsView } from './components/SettingsView';
import { SystemStatusView } from './components/SystemStatusView';
import { StatusView } from './components/StatusView';
import { WarningView } from './components/WarningView';
import { DeleteModal } from './components/DeleteModal';
import { EditModal } from './components/EditModal';
import { QRModal } from './components/QRModal';
import { ReportModal } from './components/ReportModal';
import { StatusToggleModal } from './components/StatusToggleModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LinkRecord, HealthStatus } from './types';
import {
  listOwnerLinks,
  checkHealth,
  toggleLinkStatus,
  updateLinkDestination,
  deleteLink,
} from './utils/api';
import { Check, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'links' | 'system' | 'settings'>('home');
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [refreshingHealth, setRefreshingHealth] = useState(false);

  // Selected link for Detail View
  const [selectedLinkForDetail, setSelectedLinkForDetail] = useState<LinkRecord | null>(null);

  // Modals state
  const [linkToDelete, setLinkToDelete] = useState<LinkRecord | null>(null);
  const [linkToEdit, setLinkToEdit] = useState<LinkRecord | null>(null);
  const [linkForQR, setLinkForQR] = useState<LinkRecord | null>(null);
  const [linkToToggleStatus, setLinkToToggleStatus] = useState<LinkRecord | null>(null);
  const [codeForReport, setCodeForReport] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Status/Warning page inspection from URL parameters
  const [pageRoute, setPageRoute] = useState<{
    type: 'app' | 'status' | 'warning';
    statusType?: 'expired' | 'disabled' | 'deleted' | 'unknown' | 'error';
    code?: string;
    destination?: string;
  }>({ type: 'app' });

  // Origin for short URLs
  const [origin, setOrigin] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Check health and sync with backend
  const handleRefreshHealth = useCallback(async () => {
    setRefreshingHealth(true);
    try {
      const h = await checkHealth();
      setHealthStatus(h);
      if (h.storage?.engine === 'upstash_redis' && h.storage?.connected) {
        showToast(`Tersinkron: Upstash Redis terhubung (${h.storage.latency_ms ?? 0}ms)`);
      } else if (h.storage?.engine === 'upstash_redis' && !h.storage?.connected) {
        showToast('Koneksi Upstash bermasalah, dialihkan ke penyimpanan lokal aman.', 'error');
      } else {
        showToast('Tersinkron: Backend aktif dengan penyimpanan lokal.');
      }
    } catch (err: any) {
      showToast('Gagal menyinkronkan status backend.', 'error');
    } finally {
      setRefreshingHealth(false);
    }
  }, [showToast]);

  // Check URL query on mount (for redirects, status and warnings)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);

      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      if (path === '/system') {
        setActiveTab('system');
      } else if (path === '/status' || params.has('status')) {
        const typeParam = params.get('type') || params.get('status');
        const code = params.get('code') || '';
        if (typeParam && typeParam !== 'true' && typeParam !== 'system') {
          setPageRoute({
            type: 'status',
            statusType: typeParam as any,
            code,
          });
        } else {
          setActiveTab('system');
        }
      } else if (path === '/warning' || params.has('warning')) {
        const code = params.get('code') || '';
        const dest = params.get('dest') || params.get('target') || '';
        setPageRoute({
          type: 'warning',
          code,
          destination: dest,
        });
      }
    }
  }, []);

  // Global keyboard shortcut (Ctrl+K / Cmd+K) for fast link creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSelectedLinkForDetail(null);
        setLinkToDelete(null);
        setLinkToEdit(null);
        setLinkForQR(null);
        setLinkToToggleStatus(null);
        setCodeForReport(null);
        setActiveTab('home');

        // Focus input field smoothly
        setTimeout(() => {
          const input = document.getElementById('main-url-input') as HTMLInputElement | null;
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic document title update for enhanced UX & SEO (B3)
  useEffect(() => {
    let title = 'SHRTLY — Fast, Minimalist & Privacy-First URL Shortener';
    if (pageRoute.type === 'status') {
      if (pageRoute.statusType === 'expired') {
        title = 'Tautan Kedaluwarsa — SHRTLY';
      } else if (pageRoute.statusType === 'disabled') {
        title = 'Tautan Dinonaktifkan — SHRTLY';
      } else if (pageRoute.statusType === 'deleted') {
        title = 'Tautan Dihapus — SHRTLY';
      }
    } else if (pageRoute.type === 'warning') {
      title = 'Peringatan Keamanan — SHRTLY';
    } else if (selectedLinkForDetail) {
      title = `Analitik /${selectedLinkForDetail.code} — SHRTLY`;
    } else if (activeTab === 'links') {
      title = 'Daftar Tautan Anda — SHRTLY';
    } else if (activeTab === 'system') {
      title = 'Status Sistem & Backend — SHRTLY';
    } else if (activeTab === 'settings') {
      title = 'Pengaturan & Ekspor — SHRTLY';
    }
    document.title = title;
  }, [pageRoute, selectedLinkForDetail, activeTab]);

  // Fetch links & health check
  const refreshLinks = useCallback(async () => {
    try {
      const data = await listOwnerLinks();
      setLinks(data);
    } catch (err) {
      console.error('Failed to load owner links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  useEffect(() => {
    refreshLinks();

    checkHealth()
      .then((h) => setHealthStatus(h))
      .catch((e) => console.warn('Health check issue:', e));
  }, [refreshLinks]);

  // Handler for link creation
  const handleLinkCreated = (newLink: LinkRecord) => {
    setLinks((prev) => [newLink, ...prev]);
    showToast(`Tautan /${newLink.code} berhasil dibuat!`);
  };

  // Handler for Status Toggle (Active <-> Disabled)
  const handleToggleStatus = (link: LinkRecord) => {
    setLinkToToggleStatus(link);
  };

  const handleConfirmToggleStatus = async () => {
    if (!linkToToggleStatus) return;
    const link = linkToToggleStatus;
    const nextStatus = link.status === 'active' ? 'disabled' : 'active';
    try {
      const updated = await toggleLinkStatus(link.internal_id, nextStatus, link.code);
      setLinks((prev) =>
        prev.map((l) => (l.internal_id === updated.internal_id ? updated : l))
      );
      if (selectedLinkForDetail?.internal_id === updated.internal_id) {
        setSelectedLinkForDetail(updated);
      }
      showToast(
        nextStatus === 'active'
          ? `Tautan /${link.code} diaktifkan kembali.`
          : `Tautan /${link.code} dinonaktifkan.`
      );
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengubah status tautan.', 'error');
      throw err;
    }
  };

  // Handler for Destination Edit
  const handleSaveDestination = async (newDestination: string) => {
    if (!linkToEdit) return;
    const updated = await updateLinkDestination(linkToEdit.internal_id, newDestination, linkToEdit.code);
    setLinks((prev) =>
      prev.map((l) => (l.internal_id === updated.internal_id ? updated : l))
    );
    if (selectedLinkForDetail?.internal_id === updated.internal_id) {
      setSelectedLinkForDetail(updated);
    }
    showToast(`Tujuan tautan /${updated.code} berhasil diperbarui.`);
  };

  // Handler for Deletion (Soft vs Server permanent)
  const handleConfirmDelete = async (permanent: boolean) => {
    if (!linkToDelete) return;
    const res = await deleteLink(linkToDelete.internal_id, permanent, linkToDelete.code);
    // Remove from UI links list
    setLinks((prev) => prev.filter((l) => l.internal_id !== linkToDelete.internal_id));

    if (selectedLinkForDetail?.internal_id === linkToDelete.internal_id) {
      setSelectedLinkForDetail(null);
    }

    showToast(
      res.wasPermanent
        ? `Tautan /${res.code} dan analitiknya telah dihapus permanen dari server.`
        : `Tautan /${res.code} telah dihapus dari kelola Anda.`
    );
  };

  // Handler for Bulk Status Toggle
  const handleBulkToggleStatus = async (
    selectedLinks: LinkRecord[],
    nextStatus: 'active' | 'disabled'
  ) => {
    try {
      const promises = selectedLinks.map((l) =>
        toggleLinkStatus(l.internal_id, nextStatus, l.code).catch(() => null)
      );
      const results = await Promise.all(promises);
      const updatedLinks = results.filter((r): r is LinkRecord => r !== null);

      setLinks((prev) =>
        prev.map((l) => {
          const found = updatedLinks.find((u) => u.internal_id === l.internal_id);
          return found || l;
        })
      );

      showToast(
        nextStatus === 'active'
          ? `${updatedLinks.length} tautan berhasil diaktifkan.`
          : `${updatedLinks.length} tautan berhasil dinonaktifkan.`
      );
    } catch {
      showToast('Gagal mengubah status beberapa tautan.', 'error');
    }
  };

  // Handler for Bulk Delete
  const handleBulkDelete = async (selectedLinks: LinkRecord[], permanent: boolean) => {
    try {
      const promises = selectedLinks.map(async (l) => {
        try {
          await deleteLink(l.internal_id, permanent, l.code);
          return { internal_id: l.internal_id, success: true };
        } catch {
          return { internal_id: l.internal_id, success: false };
        }
      });
      const results = await Promise.all(promises);
      const successfulDeletes = results.filter((r) => r.success);
      const deletedIds = new Set(successfulDeletes.map((r) => r.internal_id));

      setLinks((prev) => prev.filter((l) => !deletedIds.has(l.internal_id)));

      if (selectedLinkForDetail && deletedIds.has(selectedLinkForDetail.internal_id)) {
        setSelectedLinkForDetail(null);
      }

      if (successfulDeletes.length === selectedLinks.length) {
        showToast(
          permanent
            ? `${successfulDeletes.length} tautan telah dihapus permanen dari server.`
            : `${successfulDeletes.length} tautan telah dihapus dari kelola Anda.`
        );
      } else if (successfulDeletes.length > 0) {
        showToast(
          permanent
            ? `${successfulDeletes.length} dari ${selectedLinks.length} tautan berhasil dihapus permanen.`
            : `${successfulDeletes.length} dari ${selectedLinks.length} tautan berhasil dihapus dari kelola Anda.`,
          'error'
        );
      } else {
        showToast('Gagal menghapus tautan yang dipilih.', 'error');
      }
    } catch {
      showToast('Gagal menghapus beberapa tautan.', 'error');
    }
  };

  // Stable memoized callbacks to prevent LinkCard and View re-renders (Temuan #5)
  const handleOpenQR = useCallback((link: LinkRecord) => {
    setLinkForQR(link);
  }, []);

  const handleOpenAnalytics = useCallback((link: LinkRecord) => {
    setSelectedLinkForDetail(link);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedLinkForDetail(null);
  }, []);

  const handleNavigateToHome = useCallback(() => {
    setActiveTab('home');
  }, []);

  const handleEditDestination = useCallback((link: LinkRecord) => {
    setLinkToEdit(link);
  }, []);

  const handleDeleteLink = useCallback((link: LinkRecord) => {
    setLinkToDelete(link);
  }, []);

  // Render Status View if navigated to /status
  if (pageRoute.type === 'status' && pageRoute.statusType) {
    return (
      <AppShell
        activeTab="home"
        onSelectTab={() => {
          setPageRoute({ type: 'app' });
          window.history.replaceState({}, '', '/');
        }}
        linksCount={links.length}
        healthStatus={healthStatus}
      >
        <StatusView
          status={pageRoute.statusType}
          code={pageRoute.code || ''}
          onNavigateHome={() => {
            setPageRoute({ type: 'app' });
            window.history.replaceState({}, '', '/');
          }}
          onOpenReport={(c) => setCodeForReport(c)}
        />
        {codeForReport && (
          <ReportModal
            code={codeForReport}
            isOpen={true}
            onClose={() => setCodeForReport(null)}
          />
        )}
      </AppShell>
    );
  }

  // Render Warning View if navigated to /warning
  if (pageRoute.type === 'warning' && pageRoute.destination) {
    return (
      <AppShell
        activeTab="home"
        onSelectTab={() => {
          setPageRoute({ type: 'app' });
          window.history.replaceState({}, '', '/');
        }}
        linksCount={links.length}
        healthStatus={healthStatus}
      >
        <WarningView
          code={pageRoute.code || ''}
          destination={pageRoute.destination}
          onNavigateHome={() => {
            setPageRoute({ type: 'app' });
            window.history.replaceState({}, '', '/');
          }}
          onOpenReport={(c) => setCodeForReport(c)}
        />
        {codeForReport && (
          <ReportModal
            code={codeForReport}
            isOpen={true}
            onClose={() => setCodeForReport(null)}
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tab) => {
        setSelectedLinkForDetail(null);
        setActiveTab(tab);
        if (tab === 'settings' || tab === 'system') {
          handleRefreshHealth();
        }
      }}
      linksCount={links.length}
      healthStatus={healthStatus}
    >
      {/* Dynamic iOS Capsule Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="shrtly-toast-capsule"
            initial={{ opacity: 0, y: -24, scale: 0.8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -28, scale: 0.85, filter: 'blur(4px)' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 26,
              mass: 0.8,
            }}
            id="shrtly-toast"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center h-11 pl-3.5 pr-5 rounded-full shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-3xl border select-none pointer-events-none gap-3"
            style={{
              backgroundColor: 'rgba(15, 15, 20, 0.98)',
              borderColor:
                toast.type === 'success'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </div>
            <span className="tracking-tight text-[13px] font-semibold text-neutral-100 whitespace-nowrap antialiased">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Router with iOS Spring Transitions */}
      <div className="w-full relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {selectedLinkForDetail ? (
            <motion.div
              key={`detail-${selectedLinkForDetail.internal_id}`}
              initial={{ opacity: 0, x: 28, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.985 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.75,
              }}
              className="w-full"
            >
              <LinkDetailView
                link={selectedLinkForDetail}
                origin={origin}
                onBack={handleBackFromDetail}
              />
            </motion.div>
          ) : activeTab === 'home' ? (
            <motion.div
              key="view-home"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.75,
              }}
              className="w-full"
            >
              <HomeView
                origin={origin}
                userLinks={links}
                onLinkCreated={handleLinkCreated}
                onOpenQR={handleOpenQR}
                onOpenAnalytics={handleOpenAnalytics}
              />
            </motion.div>
          ) : activeTab === 'links' ? (
            <motion.div
              key="view-links"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.75,
              }}
              className="w-full"
            >
              <LinksView
                links={links}
                loading={loadingLinks}
                origin={origin}
                onNavigateToHome={handleNavigateToHome}
                onOpenAnalytics={handleOpenAnalytics}
                onOpenQR={handleOpenQR}
                onEditDestination={handleEditDestination}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteLink}
                onBulkToggleStatus={handleBulkToggleStatus}
                onBulkDelete={handleBulkDelete}
              />
            </motion.div>
          ) : activeTab === 'system' ? (
            <motion.div
              key="view-system"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.75,
              }}
              className="w-full"
            >
              <SystemStatusView
                healthStatus={healthStatus}
                links={links}
                onRefreshHealth={handleRefreshHealth}
                isRefreshingHealth={refreshingHealth}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-settings"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.75,
              }}
              className="w-full"
            >
              <SettingsView
                links={links}
                onClearLocalData={() => {
                  setLinks([]);
                  setSelectedLinkForDetail(null);
                  showToast('Riwayat peramban lokal telah dibersihkan.');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {linkToDelete && (
          <DeleteModal
            key="delete-modal"
            link={linkToDelete}
            isOpen={true}
            onClose={() => setLinkToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}

        {linkToEdit && (
          <EditModal
            key="edit-modal"
            link={linkToEdit}
            isOpen={true}
            onClose={() => setLinkToEdit(null)}
            onSave={handleSaveDestination}
          />
        )}

        {linkForQR && (
          <QRModal
            key="qr-modal"
            shortUrl={`${origin}/${linkForQR.code}`}
            code={linkForQR.code}
            isOpen={true}
            onClose={() => setLinkForQR(null)}
          />
        )}

        {linkToToggleStatus && (
          <StatusToggleModal
            key="status-toggle-modal"
            link={linkToToggleStatus}
            isOpen={true}
            onClose={() => setLinkToToggleStatus(null)}
            onConfirm={handleConfirmToggleStatus}
          />
        )}

        {codeForReport && (
          <ReportModal
            key="report-modal"
            code={codeForReport}
            isOpen={true}
            onClose={() => setCodeForReport(null)}
          />
        )}
      </AnimatePresence>

      {/* Offline Status Warning Indicator */}
      <OfflineIndicator />
    </AppShell>
  );
}
