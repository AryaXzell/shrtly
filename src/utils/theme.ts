export type Theme = 'system' | 'light' | 'dark';

const THEME_KEY = 'shrtly_theme';

export function getThemePreference(): Theme {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(THEME_KEY) as Theme;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const pref = getThemePreference();
  if (pref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return pref;
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }

  let effective: 'light' | 'dark' = 'light';
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      root.classList.add('dark');
      effective = 'dark';
    } else {
      root.classList.remove('dark');
      effective = 'light';
    }
  } else if (theme === 'dark') {
    root.classList.add('dark');
    effective = 'dark';
  } else {
    root.classList.remove('dark');
    effective = 'light';
  }

  // Update theme-color meta for mobile Safari status bar
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', effective === 'dark' ? '#09090b' : '#fafafa');
  }

  // Dispatch custom event so all listeners stay perfectly synchronized
  window.dispatchEvent(new CustomEvent('shrtly-theme-change', { detail: { theme, effective } }));
}

export function initTheme(): void {
  const current = getThemePreference();
  applyTheme(current);

  // Listen to OS system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (getThemePreference() === 'system') {
        applyTheme('system');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // @ts-ignore
      mediaQuery.addListener(listener);
    }
  }
}

