import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'thanzi-theme';

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(preference: ThemePreference) {
  const isDark = preference === 'dark' || (preference === 'system' && getSystemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
}

interface ThemeContextValue {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'
  );
  const [isDark, setIsDark] = useState(() =>
    preference === 'dark' || (preference === 'system' && getSystemPrefersDark())
  );

  useEffect(() => {
    function sync() {
      const dark = preference === 'dark' || (preference === 'system' && getSystemPrefersDark());
      applyTheme(preference);
      setIsDark(dark);
    }
    sync();

    // Follow OS-level changes live when the user hasn't picked light/dark explicitly.
    if (preference === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }
  }, [preference]);

  function setPreference(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next);
    setPreferenceState(next);
  }

  function toggle() {
    // A single tap flips between light and dark — the most common gesture.
    // "System" is still reachable via setPreference, just not part of this quick toggle.
    setPreference(isDark ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ preference, isDark, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
