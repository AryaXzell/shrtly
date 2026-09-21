import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Link as LinkIcon, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { LinkRecord, LinkCreatePayload } from '../types';
import { createShortLink } from '../utils/api';
import { LinkResultCard } from './LinkResultCard';
import { WelcomeIllustration } from './illustrations/Illustrations';

interface HomeViewProps {
  origin: string;
  userLinks: LinkRecord[];
  onLinkCreated: (link: LinkRecord) => void;
  onOpenQR: (link: LinkRecord) => void;
  onOpenAnalytics: (link: LinkRecord) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
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

  // Duplicate warning detection
  const duplicateLink = React.useMemo(() => {
    if (!url.trim()) return null;
    const clean = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return userLinks.find((l) => {
      const destClean = l.destination.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return destClean === clean && l.status === 'active';
    });
  }, [url, userLinks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setInlineError('Silakan tempel URL terlebih dahulu.');
      return;
    }

    setInlineError(null);
    setIsSubmitting(true);

    try {
      const payload: Omit<LinkCreatePayload, 'owner_id'> = {
        url: url.trim(),
        custom_alias: customAlias.trim() || undefined,
        expires_in: expiresIn,
        custom_expires_at: expiresIn === 'custom' ? customExpiresAt : undefined,
      };

      const res = await createShortLink(payload);
      setCreatedResult({
        link: res.link,
        shortUrl: res.short_url,
      });
      onLinkCreated(res.link);
      setUrl('');
      setCustomAlias('');
      setShowAdvanced(false);
    } catch (err: any) {
      setInlineError(err?.message || 'Gagal memperpendek tautan. Periksa format URL Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="home-view" className="space-y-8 max-w-xl mx-auto text-center">
      {/* Brand Header */}
      <div className="space-y-2 pt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          SHRTLY
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
          Short links, without the noise.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input Box */}
        <div className="relative group">
          <div className="relative flex items-center p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-sm group-focus-within:border-neutral-400 dark:group-focus-within:border-neutral-600 transition-all">
            <div className="pl-3.5 pr-2 text-neutral-400">
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
              placeholder="Paste your URL (e.g. github.com/aryaxzell)..."
              className="w-full py-2.5 text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
              autoComplete="off"
              autoFocus
            />
            <button
              id="shorten-submit-btn"
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0"
            >
              {isSubmitting ? 'Shortening...' : 'Shorten'}
            </button>
          </div>
        </div>

        {/* Inline Error Notice */}
        {inlineError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inlineError}</span>
          </div>
        )}

        {/* Duplicate URL detection notice */}
        {duplicateLink && (
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-xs text-left animate-in fade-in">
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
              className="px-3 py-1 rounded-full bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 hover:opacity-80"
            >
              Lihat
            </button>
          </div>
        )}

        {/* Progressive Disclosure: Advanced Options */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors py-1"
          >
            <span>Opsi lanjutan</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-4 rounded-3xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4 animate-in fade-in duration-150">
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
                      onClick={() => setExpiresIn(opt.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
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
            </div>
          )}
        </div>
      </form>

      {/* Result Card */}
      {createdResult && (
        <LinkResultCard
          link={createdResult.link}
          shortUrl={createdResult.shortUrl}
          onOpenQR={() => onOpenQR(createdResult.link)}
          onOpenAnalytics={() => onOpenAnalytics(createdResult.link)}
        />
      )}

      {/* Welcome Empty State for fresh users */}
      {userLinks.length === 0 && !createdResult && (
        <div className="pt-6 sm:pt-8 flex flex-col items-center text-center select-none animate-in fade-in duration-300">
          <WelcomeIllustration size={110} />
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 max-w-xs leading-relaxed">
            Tempel tautan panjang apa pun untuk membuatnya ringkas, cepat diakses, dan privat.
          </p>
        </div>
      )}

      {/* Recent Links Section if user has links */}
      {userLinks.length > 0 && !createdResult && (
        <div className="pt-6 space-y-3 text-left">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Tautan Terbaru Anda</span>
            <span className="font-mono text-[11px]">{userLinks.length} tautan tersimpan</span>
          </div>
          <div className="space-y-2">
            {userLinks.slice(0, 3).map((link) => (
              <div
                key={link.internal_id}
                onClick={() => onOpenAnalytics(link)}
                className="p-3.5 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="truncate max-w-[70%]">
                  <div className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    /{link.code}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {link.destination}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {link.click_count} klik
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
