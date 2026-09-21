import React from 'react';
import { Link2, List, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';
import { HealthStatus } from '../types';
import { haptic } from '../utils/haptics';

interface AppShellProps {
  activeTab: 'home' | 'links' | 'settings';
  onSelectTab: (tab: 'home' | 'links' | 'settings') => void;
  linksCount: number;
  healthStatus: HealthStatus | null;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = React.memo(({
  activeTab,
  onSelectTab,
  linksCount,
  healthStatus,
  children,
}) => {
  const handleTabChange = (tab: 'home' | 'links' | 'settings') => {
    if (tab !== activeTab) {
      haptic.selection();
    }
    onSelectTab(tab);
  };

  const navItems: { id: 'home' | 'links' | 'settings'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Shorten', icon: Link2 },
    { id: 'links', label: 'My Links', icon: List },
    { id: 'settings', label: 'Data & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-200 font-sans pb-20 sm:pb-8 pb-[env(safe-area-inset-bottom)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo / Brand */}
          <div
            onClick={() => handleTabChange('home')}
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
          <nav className="hidden sm:flex items-center gap-1 bg-neutral-100/60 dark:bg-neutral-900/60 p-1 rounded-full border border-neutral-200/50 dark:border-neutral-800/50" role="tablist">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-white dark:text-neutral-950 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-white shadow-sm"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.id === 'links' && linksCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors ${
                          isActive
                            ? 'bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900'
                            : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {linksCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (Touch targets >= 44px) */}
      <nav
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800/80 px-4 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-lg shadow-black/5"
        aria-label="Navigasi Bawah Seluler"
        role="tablist"
      >
        <button
          id="mobile-tab-home"
          role="tab"
          aria-selected={activeTab === 'home'}
          onClick={() => handleTabChange('home')}
          className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'home'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          {activeTab === 'home' && (
            <motion.div
              layoutId="mobile-active-nav-bubble"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-0 rounded-2xl bg-neutral-100 dark:bg-neutral-900 -z-10"
            />
          )}
          <Link2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Shorten</span>
        </button>

        <button
          id="mobile-tab-links"
          role="tab"
          aria-selected={activeTab === 'links'}
          onClick={() => handleTabChange('links')}
          className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'links'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          {activeTab === 'links' && (
            <motion.div
              layoutId="mobile-active-nav-bubble"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-0 rounded-2xl bg-neutral-100 dark:bg-neutral-900 -z-10"
            />
          )}
          <List className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">My Links</span>
          {linksCount > 0 && (
            <span className="absolute top-1 right-3 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              {linksCount}
            </span>
          )}
        </button>

        <button
          id="mobile-tab-settings"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => handleTabChange('settings')}
          className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] gap-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'settings'
              ? 'text-neutral-950 dark:text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          {activeTab === 'settings' && (
            <motion.div
              layoutId="mobile-active-nav-bubble"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="absolute inset-0 rounded-2xl bg-neutral-100 dark:bg-neutral-900 -z-10"
            />
          )}
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-neutral-400 dark:text-neutral-600 py-4 hidden sm:block">
        <p>SHRTLY • Fast. Quiet. Clear. • Privacy-first link shortener</p>
      </footer>
    </div>
  );
});
