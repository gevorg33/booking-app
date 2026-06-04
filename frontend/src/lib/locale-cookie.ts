import { LOCALE_COOKIE, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

/** Read persisted locale from document.cookie (client only). */
export function readCookieLocale(): AppLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1]?.trim();
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : null;
}

/** Persist locale for the current site (path=/; optional parent domain for tenant subdomains). */
export function writeCookieLocale(locale: AppLocale): void {
  if (typeof document === 'undefined') return;

  const parts = [`${LOCALE_COOKIE}=${locale}`, 'path=/', 'max-age=31536000', 'samesite=lax'];
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
