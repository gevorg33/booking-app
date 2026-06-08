/** adopt-5.6 — document language, RTL-safe direction, VoiceOver/TalkBack helpers. */

import type { AppLocale } from '@shared-i18n/types';

export type MobileA11yLocale = AppLocale;

export function normalizeMobileA11yLocale(value?: string | null): MobileA11yLocale {
  const code = value?.trim().toLowerCase().slice(0, 2);
  if (code === 'hy' || code === 'ru') return code;
  return 'en';
}

export function resolveDocumentDirection(_locale: MobileA11yLocale): 'ltr' | 'rtl' {
  return 'ltr';
}

export function applyDocumentAccessibility(locale: MobileA11yLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = resolveDocumentDirection(locale);
  document.body.classList.add('adoption-a11y-root');
}
