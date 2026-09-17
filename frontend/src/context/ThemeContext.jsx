import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';

const ThemeContext = createContext(null);

const THEMES = ['light', 'dark'];
const media = () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/** The theme the pre-paint script in index.html already applied. */
const readInitialTheme = () => {
  const applied = document.documentElement.getAttribute('data-theme');
  if (THEMES.includes(applied)) return applied;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (THEMES.includes(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); fall through to the OS setting.
  }
  return media()?.matches ? 'dark' : 'light';
};

const hasExplicitChoice = () => {
  try {
    return THEMES.includes(localStorage.getItem(STORAGE_KEYS.theme));
  } catch {
    return false;
  }
};

/**
 * Light/dark theme for the whole app. The choice is a `data-theme` attribute
 * on <html> (Tailwind's dark variant and the CSS palettes key off it) and is
 * persisted in localStorage. Until the user picks explicitly, the OS
 * preference is followed live.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }, [theme]);

  /* Follow the OS while no explicit choice has been saved. */
  useEffect(() => {
    const query = media();
    if (!query) return undefined;
    const onChange = (event) => {
      if (!hasExplicitChoice()) setThemeState(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    const root = document.documentElement;
    // A short cross-fade only while switching, so normal interactions stay snappy.
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 300);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      // Persisting is best-effort.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within a ThemeProvider');
  return context;
};

export default ThemeContext;
