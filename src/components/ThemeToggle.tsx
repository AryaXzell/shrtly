import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { Theme, getThemePreference, applyTheme } from '../utils/theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    setTheme(getThemePreference());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      } else {
        setTheme(getThemePreference());
      }
    };

    window.addEventListener('shrtly-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('shrtly-theme-change', handleThemeChange);
    };
  }, []);

  const handleSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: 'System theme', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light theme', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark theme', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      id="theme-selector"
      className="relative inline-flex items-center p-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800/80 backdrop-blur-md border border-neutral-300/50 dark:border-neutral-700/60"
      role="group"
      aria-label="Color theme selector"
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            id={`theme-${opt.id}-btn`}
            onClick={() => handleSelect(opt.id)}
            className={`relative z-10 p-1.5 rounded-full transition-colors flex items-center justify-center ${
              isActive
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
            title={opt.label}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-full bg-white dark:bg-neutral-700 shadow-sm"
              />
            )}
            <span className="relative z-20 flex items-center justify-center">
              {opt.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};

