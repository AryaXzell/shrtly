import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppShell } from './components/AppShell';
import { HomeView } from './components/HomeView';
import { LinksView } from './components/LinksView';
import { LinkDetailView } from './components/LinkDetailView';
import { SettingsView } from './components/SettingsView';
import { StatusView } from './components/StatusView';
import { WarningView } from './components/WarningView';
import { DeleteModal } from './components/DeleteModal';
import { EditModal } from './components/EditModal';
import { QRModal } from './components/QRModal';
import { ReportModal } from './components/ReportModal';
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
  const [activeTab, setActiveTab] = useState<'home' | 'links' | 'settings'>('home');
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

      if (path === '/status' || params.has('status')) {
        const sType = (params.get('type') || params.get('status') || 'unknown') as any;
        const code = params.get('code') || '';
        setPageRoute({
          type: 'status',
          statusType: sType,
          code,
        });
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
  const handleToggleStatus = async (link: LinkRecord) => {
    const nextStatus = link.status === 'active' ? 'disabled' : 'active';
    try {
      const updated = await toggleLinkStatus(link.internal_id, nextStatus);
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
    }
  };

  // Handler for Destination Edit
  const handleSaveDestination = async (newDestination: string) => {
    if (!linkToEdit) return;
    const updated = await updateLinkDestination(linkToEdit.internal_id, newDestination);
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
    const res = await deleteLink(linkToDelete.internal_id, permanent);
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
        if (tab === 'settings') {
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
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 480,
              damping: 30,
              mass: 0.7,
            }}
            id="shrtly-toast"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-medium shadow-2xl backdrop-blur-2xl border select-none pointer-events-none"
            style={{
              backgroundColor:
                toast.type === 'success' ? 'rgba(17, 17, 19, 0.92)' : 'rgba(225, 29, 72, 0.94)',
              color: '#ffffff',
              borderColor:
                toast.type === 'success'
                  ? 'rgba(255, 255, 255, 0.14)'
                  : 'rgba(255, 255, 255, 0.22)',
              boxShadow:
                '0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
            }}
          >
            <div
              className={`flex items-center justify-center w-5 h-5 rounded-full ${
                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </div>
            <span className="tracking-tight text-[12.5px] font-medium">{toast.message}</span>
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
                onBack={() => setSelectedLinkForDetail(null)}
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
                onOpenQR={(l) => setLinkForQR(l)}
                onOpenAnalytics={(l) => setSelectedLinkForDetail(l)}
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
                onNavigateToHome={() => setActiveTab('home')}
                onOpenAnalytics={(l) => setSelectedLinkForDetail(l)}
                onOpenQR={(l) => setLinkForQR(l)}
                onEditDestination={(l) => setLinkToEdit(l)}
                onToggleStatus={handleToggleStatus}
                onDelete={(l) => setLinkToDelete(l)}
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
                healthStatus={healthStatus}
                onClearLocalData={() => {
                  setLinks([]);
                  setSelectedLinkForDetail(null);
                  showToast('Riwayat peramban lokal telah dibersihkan.');
                }}
                onRefreshHealth={handleRefreshHealth}
                isRefreshingHealth={refreshingHealth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Modals */}
      {linkToDelete && (
        <DeleteModal
          link={linkToDelete}
          isOpen={true}
          onClose={() => setLinkToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {linkToEdit && (
        <EditModal
          link={linkToEdit}
          isOpen={true}
          onClose={() => setLinkToEdit(null)}
          onSave={handleSaveDestination}
        />
      )}

      {linkForQR && (
        <QRModal
          shortUrl={`${origin}/${linkForQR.code}`}
          code={linkForQR.code}
          isOpen={true}
          onClose={() => setLinkForQR(null)}
        />
      )}

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
