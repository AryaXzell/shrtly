import React from 'react';
import { Link2, List, Activity, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';
import { HealthStatus } from '../types';
import { haptic } from '../utils/haptics';

interface AppShellProps {
  activeTab: 'home' | 'links' | 'system' | 'settings';
  onSelectTab: (tab: 'home' | 'links' | 'system' | 'settings') => void;
  linksCount: number;
  healthStatus: HealthStatus | null;
  isSwiping?: boolean;
  swipeProgress?: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = React.memo(({
  activeTab,
  onSelectTab,
  linksCount,
  healthStatus,
  isSwiping = false,
  swipeProgress = 0,
  children,
}) => {
  const handleTabChange = (tab: 'home' | 'links' | 'system' | 'settings') => {
    if (tab !== activeTab) {
      haptic.selection();
    }
    onSelectTab(tab);
  };

  const navItems: { id: 'home' | 'links' | 'system' | 'settings'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Shorten', icon: Link2 },
    { id: 'links', label: 'My Links', icon: List },
    { id: 'system', label: 'System Status', icon: Activity },
    { id: 'settings', label: 'Data & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 transition-colors duration-200 font-sans pb-20 sm:pb-8 pb-[env(safe-area-inset-bottom)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group text-left outline-none"
            id="brand-home-link"
            aria-label="Kembali ke Beranda SHRTLY"
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
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center gap-1 bg-neutral-100/70 dark:bg-neutral-900/70 p-1 rounded-full border border-neutral-200/60 dark:border-neutral-800/60" role="tablist">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(item.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer select-none outline-none ${
                    isActive
                      ? 'text-white dark:text-neutral-950 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-pill"
                      animate={{ scale: isSwiping ? 1.25 : 1 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 320, damping: 26, mass: 0.85 },
                        scale: { type: 'spring', stiffness: 200, damping: 19, mass: 0.85 },
                      }}
                      className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-white shadow-sm overflow-hidden"
                    >
                      {/* Subtle Indicator Progress Bar tracking horizontal swipe */}
                      <div className="absolute bottom-0.5 inset-x-2 h-[2px] rounded-full overflow-hidden bg-white/20 dark:bg-black/15 pointer-events-none">
                        <motion.div
                          className="h-full bg-white dark:bg-neutral-950 rounded-full"
                          animate={{
                            width: isSwiping ? `${Math.max(swipeProgress * 100, 8)}%` : '0%',
                            opacity: isSwiping ? 1 : 0,
                          }}
                          transition={{
                            width: { type: 'spring', stiffness: 300, damping: 26 },
                            opacity: { duration: 0.15 },
                          }}
                        />
                      </div>
                    </motion.div>
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

      {/* Mobile Bottom Navigation Bar (Floating Pill Capsule iOS-Style) */}
      <motion.nav
        id="mobile-bottom-nav"
        animate={{ scale: isSwiping ? 1.02 : 1 }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 24,
          mass: 0.8,
        }}
        className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-fit max-w-[95vw] z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-1 rounded-full flex items-center gap-0.5 shadow-2xl shadow-neutral-950/15 dark:shadow-black/60 origin-center"
        aria-label="Navigasi Bawah Seluler"
        role="tablist"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center px-3.5 py-1.5 min-h-[38px] min-w-[66px] gap-0.5 rounded-full transition-colors duration-150 cursor-pointer select-none outline-none active:scale-95 ${
                isActive
                  ? 'text-white dark:text-neutral-950 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active-nav-pill"
                  animate={{ scale: isSwiping ? 1.25 : 1 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 320, damping: 26, mass: 0.85 },
                    scale: { type: 'spring', stiffness: 200, damping: 19, mass: 0.85 },
                  }}
                  className="absolute inset-0 rounded-full bg-neutral-900 dark:bg-white shadow-sm overflow-hidden"
                >
                  {/* Subtle Indicator Progress Bar tracking horizontal swipe */}
                  <div className="absolute bottom-0.5 inset-x-2 h-[2px] rounded-full overflow-hidden bg-white/20 dark:bg-black/15 pointer-events-none">
                    <motion.div
                      className="h-full bg-white dark:bg-neutral-950 rounded-full"
                      animate={{
                        width: isSwiping ? `${Math.max(swipeProgress * 100, 8)}%` : '0%',
                        opacity: isSwiping ? 1 : 0,
                      }}
                      transition={{
                        width: { type: 'spring', stiffness: 300, damping: 26 },
                        opacity: { duration: 0.15 },
                      }}
                    />
                  </div>
                </motion.div>
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="text-[9px] tracking-tight relative z-10 leading-none">
                {item.label === 'Shorten' ? 'Shorten' : item.label === 'My Links' ? 'Links' : item.label === 'System Status' ? 'Status' : 'Settings'}
              </span>
              {item.id === 'links' && linksCount > 0 && (
                <span
                  className={`absolute top-0.5 right-2 px-1 rounded-full text-[8px] font-mono font-bold relative z-10 ${
                    isActive
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {linksCount}
                </span>
              )}
            </button>
          );
        })}
      </motion.nav>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-neutral-400 dark:text-neutral-600 py-4 hidden sm:block">
        <p>SHRTLY • Fast. Quiet. Clear. • Privacy-first link shortener</p>
      </footer>
    </div>
  );
});
