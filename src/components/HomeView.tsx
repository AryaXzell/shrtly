import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon, Sparkles, Clock, AlertCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkRecord, LinkCreatePayload } from '../types';
import { createShortLink } from '../utils/api';
import { haptic } from '../utils/haptics';
import { LinkResultCard } from './LinkResultCard';
import { WelcomeIllustration } from './illustrations/Illustrations';

interface HomeViewProps {
  origin: string;
  userLinks: LinkRecord[];
  onLinkCreated: (link: LinkRecord) => void;
  onOpenQR: (link: LinkRecord) => void;
  onOpenAnalytics: (link: LinkRecord) => void;
}

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  origin,
  userLinks,
  onLinkCreated,
  onOpenQR,
  onOpenAnalytics,
}) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Progressive Disclosure: Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [expiresIn, setExpiresIn] = useState<'never' | '1h' | '24h' | '7d' | '30d' | 'custom'>('never');
  const [customExpiresAt, setCustomExpiresAt] = useState('');

  // Result state
  const [createdResult, setCreatedResult] = useState<{
    link: LinkRecord;
    shortUrl: string;
  } | null>(null);
  const [copiedRecentId, setCopiedRecentId] = useState<string | null>(null);

  const handleCopyRecent = useCallback((e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${origin}/${code}`);
    haptic.success();
    setCopiedRecentId(id);
    setTimeout(() => {
      setCopiedRecentId((curr) => (curr === id ? null : curr));
    }, 2000);
  }, [origin]);

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
  }, []);

  // Duplicate warning detection
  const duplicateLink = useMemo(() => {
    if (!url.trim()) return null;
    const clean = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return userLinks.find((l) => {
      const destClean = l.destination.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return destClean === clean && l.status === 'active';
    });
  }, [url, userLinks]);

  // Real-time URL format and security validation
  const validation = useMemo(() => {
    if (!url.trim()) return { isValid: true };
    const trimmed = url.trim();

    // 1. Length check
    if (trimmed.length > 2048) {
      return { isValid: false, error: 'URL terlalu panjang (maksimal 2048 karakter).' };
    }

    const lower = trimmed.toLowerCase();

    // 2. Suspicious scripting/protocol check
    if (/<script|javascript:|data:|vbscript:|<|>|iframe|onload|onerror|alert\(/i.test(lower)) {
      return { isValid: false, error: 'Karakter atau skrip berbahaya (XSS) terdeteksi!' };
    }

    // 3. Suspicious SQL/command injections check
    if (/(\s+or\s+[\d'=]+)|(\s+and\s+[\d'=]+)|union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table/i.test(lower)) {
      return { isValid: false, error: 'Pola SQL injection berbahaya terdeteksi!' };
    }

    // 4. Other unsafe characters inside standard domain
    if (/[\\`]/.test(trimmed)) {
      return { isValid: false, error: 'Karakter tidak aman terdeteksi.' };
    }

    // 5. Basic URL and format check
    let hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
    let checkString = trimmed;
    if (!hasProtocol) {
      checkString = 'https://' + trimmed;
    }

    try {
      const parsed = new URL(checkString);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, error: 'Hanya protokol http dan https yang didukung.' };
      }

      const hostname = parsed.hostname;
      if (!hostname || !hostname.includes('.')) {
        return { isValid: false, error: 'Format nama host/domain tidak valid.' };
      }

      // 6. Suspicious deceptive tracking check
      const SUSPICIOUS_DOMAINS = ['grabify.link', 'iplogger.org', 'blasze.com', '2no.co', 'yip.su', 'psportable.org'];
      if (SUSPICIOUS_DOMAINS.some(d => hostname.toLowerCase().includes(d))) {
        return { isValid: true, isWarning: true, error: 'Peringatan: Domain ini terkait dengan pelacak/IP Logger.' };
      }

      // 7. Local address prevention
      const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '[::]'];
      if (localhostPatterns.some(p => hostname.toLowerCase().includes(p))) {
        return { isValid: false, error: 'Tujuan mengarah ke alamat jaringan lokal yang dilarang.' };
      }

    } catch (e) {
      return { isValid: false, error: 'Format URL tidak valid.' };
    }

    return { isValid: true };
  }, [url]);

  const activeError = useMemo(() => {
    if (inlineError) return { message: inlineError, type: 'error' };
    if (!validation.isValid && validation.error) {
      return { message: validation.error, type: 'error' };
    }
    if (validation.isWarning && validation.error) {
      return { message: validation.error, type: 'warning' };
    }
    return null;
  }, [inlineError, validation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      haptic.warning();
      setInlineError('Silakan tempel URL terlebih dahulu.');
      return;
    }

    if (!validation.isValid) {
      haptic.warning();
      return;
    }

    setInlineError(null);
    setIsSubmitting(true);
    haptic.medium();

    try {
      const payload: Omit<LinkCreatePayload, 'owner_id'> = {
        url: url.trim(),
        custom_alias: customAlias.trim() || undefined,
        expires_in: expiresIn,
        custom_expires_at: expiresIn === 'custom' ? customExpiresAt : undefined,
      };

      const res = await createShortLink(payload);
      haptic.success();
      setCreatedResult({
        link: res.link,
        shortUrl: res.short_url,
      });
      onLinkCreated(res.link);
      setUrl('');
      setCustomAlias('');
      setShowAdvanced(false);
    } catch (err: any) {
      haptic.error();
      setInlineError(err?.message || 'Gagal memperpendek tautan. Periksa format URL Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="home-view" className="space-y-8 max-w-xl mx-auto text-center">
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="space-y-2 pt-2"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          SHRTLY
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
          Tautan pendek, tanpa kerumitan.
        </p>
      </motion.div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input Box */}
        <div className="relative group">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 gap-2 sm:gap-0 rounded-3xl sm:rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-sm group-focus-within:border-neutral-400 dark:group-focus-within:border-neutral-600 transition-all">
            <div className="flex items-center flex-1 min-w-0">
              <div className="pl-3.5 pr-2 text-neutral-400 shrink-0">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="main-url-input"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                disabled={isSubmitting}
                placeholder="Tempel URL Anda (misal: github.com/aryaxzell)..."
                className="w-full py-2.5 text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
            </div>
            {!url && (
              <div className="hidden sm:flex items-center mr-2 shrink-0">
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 rounded-md select-none pointer-events-none">
                  {isMac ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              id="shorten-submit-btn"
              type="submit"
              disabled={isSubmitting || !url.trim() || !validation.isValid}
              className="px-5 py-2.5 rounded-2xl sm:rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-opacity shrink-0 cursor-pointer w-full sm:w-auto"
            >
              {isSubmitting ? 'Memperpendek...' : 'Perpendek'}
            </motion.button>
          </div>
        </div>

        {/* Inline Error/Warning Notice */}
        <AnimatePresence>
          {activeError && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs text-left overflow-hidden ${
                activeError.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{activeError.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duplicate URL detection notice */}
        <AnimatePresence>
          {duplicateLink && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-xs text-left overflow-hidden"
            >
              <div className="space-y-0.5">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Anda sudah memiliki tautan untuk URL ini
                </span>
                <p className="text-[11px] text-neutral-500 font-mono">
                  /{duplicateLink.code} ({duplicateLink.click_count} klik)
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAnalytics(duplicateLink)}
                className="px-3 py-1 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 hover:opacity-80 cursor-pointer"
              >
                Lihat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progressive Disclosure: Advanced Options */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setShowAdvanced(!showAdvanced);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1 cursor-pointer"
          >
            <span>Opsi lanjutan</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-2.5 p-4 rounded-3xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4 overflow-hidden"
              >
                {/* Custom Alias */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Custom Alias (Opsional)</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 focus-within:ring-2 focus-within:ring-neutral-900 dark:focus-within:ring-white">
                    <span className="font-mono text-xs text-neutral-400">/</span>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      placeholder="nama-khusus"
                      className="w-full bg-transparent pl-1 text-xs font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Expiration Options */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Masa Berlaku (Kedaluwarsa)</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                    {[
                      { id: 'never', label: 'Never' },
                      { id: '1h', label: '1 Jam' },
                      { id: '24h', label: '24 Jam' },
                      { id: '7d', label: '7 Hari' },
                      { id: '30d', label: '30 Hari' },
                      { id: 'custom', label: 'Kustom' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setExpiresIn(opt.id as any);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          expiresIn === opt.id
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {expiresIn === 'custom' && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        value={customExpiresAt}
                        onChange={(e) => setCustomExpiresAt(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Result Card */}
      <AnimatePresence>
        {createdResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <LinkResultCard
              link={createdResult.link}
              shortUrl={createdResult.shortUrl}
              onOpenQR={() => onOpenQR(createdResult.link)}
              onOpenAnalytics={() => onOpenAnalytics(createdResult.link)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Empty State for fresh users */}
      {userLinks.length === 0 && !createdResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-6 sm:pt-8 flex flex-col items-center text-center select-none"
        >
          <WelcomeIllustration size={110} />
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
            Tempel tautan panjang apa pun untuk membuatnya ringkas, cepat diakses, dan privat.
          </p>
        </motion.div>
      )}

      {/* Recent Links Section if user has links */}
      {userLinks.length > 0 && !createdResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-6 space-y-3 text-left"
        >
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Tautan Terbaru Anda</span>
            <span className="font-mono text-[11px]">{userLinks.length} tautan tersimpan</span>
          </div>
          <div className="space-y-2">
            {userLinks.slice(0, 3).map((link, idx) => {
              const isCopied = copiedRecentId === link.internal_id;
              return (
                <motion.div
                  key={link.internal_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  whileHover={{ scale: 1.005 }}
                  onClick={() => onOpenAnalytics(link)}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer flex items-center justify-between gap-3 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      /{link.code}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {link.destination}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyRecent(e, link.code, link.internal_id)}
                      className={`p-2 rounded-full text-xs transition-all cursor-pointer active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title={isCopied ? 'Tersalin' : 'Salin tautan'}
                      aria-label="Salin tautan"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {link.click_count} klik
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
});
