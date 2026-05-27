export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'optischedule-theme';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
  applyTheme(theme);
}
