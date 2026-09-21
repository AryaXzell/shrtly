import React from 'react';
import { Link2, List, Settings, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { HealthStatus } from '../types';

interface AppShellProps {
  activeTab: 'home' | 'links' | 'settings';
  onSelectTab: (tab: 'home' | 'links' | 'settings') => void;
  linksCount: number;
  healthStatus: HealthStatus | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onSelectTab,
  linksCount,
  healthStatus,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-200 font-sans pb-20 sm:pb-8">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo / Brand */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            id="brand-home-link"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-900 dark:bg-black shadow-sm ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img src="/favicon.svg" alt="SHRTLY Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-base leading-none">
                SHRTLY
              </span>
              <span className="text-[10px] font-medium tracking-wide text-neutral-400 dark:text-neutral-500 leading-tight">
                fast • quiet • clear
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Shorten
            </button>
            <button
              onClick={() => onSelectTab('links')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'links'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span>My Links</span>
              {linksCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === 'links'
                      ? 'bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {linksCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('settings')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Data & Settings
            </button>
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Storage indicator dot */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
              title={`Storage: ${healthStatus?.storage?.engine || 'Local'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{healthStatus?.storage?.engine?.includes('redis') ? 'Redis' : 'Ready'}</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-28 sm:py-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Touch targets >= 44px) */}
      <nav
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800/80 px-4 py-2 flex items-center justify-around safe-area-bottom"
        aria-label="Navigasi Bawah Seluler"
      >
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-colors ${
            activeTab === 'home'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Link2 className="w-5 h-5" />
          <span className="text-[10px]">Shorten</span>
        </button>

        <button
          onClick={() => onSelectTab('links')}
          className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-colors ${
            activeTab === 'links'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px]">Links</span>
          {linksCount > 0 && (
            <span className="absolute top-1 right-3.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              {linksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-colors ${
            activeTab === 'settings'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-neutral-400 dark:text-neutral-600 py-4 hidden sm:block">
        <p>SHRTLY • Fast. Quiet. Clear. • Privacy-first link shortener</p>
      </footer>
    </div>
  );
};
