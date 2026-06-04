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

/** Persist theme for SSR (path=/; mirrors locale cookie rules). */
export function writeThemeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const parts = [`${THEME_STORAGE_KEY}=${theme}`, 'path=/', 'max-age=31536000', 'samesite=lax'];
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('secure');
  }

  const rootHost = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(':')[0]?.toLowerCase();
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (
    rootHost &&
    rootHost !== 'localhost' &&
    rootHost !== '127.0.0.1' &&
    hostname.endsWith(`.${rootHost}`)
  ) {
    parts.push(`domain=.${rootHost}`);
  }

  document.cookie = parts.join(';');
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
  writeThemeCookie(theme);
  applyTheme(theme);
}
