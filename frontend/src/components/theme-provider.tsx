'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { getStoredTheme, storeTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeTheme(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function ThemeProvider({
  children,
  initialTheme = 'dark',
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const storedTheme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => initialTheme);
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? storedTheme;

  const setTheme = useCallback((next: Theme) => {
    setOverride(next);
    storeTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}
