/** adopt-5.6 — document language, RTL-safe direction, VoiceOver/TalkBack helpers. */

export type MobileA11yLocale = 'en' | 'hy' | 'ru';

export function normalizeMobileA11yLocale(value?: string | null): MobileA11yLocale {
  const code = value?.trim().toLowerCase().slice(0, 2);
  if (code === 'hy' || code === 'ru') return code;
  return 'en';
}

/** HY/RU/EN are LTR; layouts use logical CSS properties for RTL readiness. */
export function resolveDocumentDirection(_locale: MobileA11yLocale): 'ltr' | 'rtl' {
  return 'ltr';
}

export function applyDocumentAccessibility(locale: MobileA11yLocale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = resolveDocumentDirection(locale);
  document.body.classList.add('adoption-a11y-root');
}

export function resolveConsumerDocumentLocale(): MobileA11yLocale {
  if (typeof window === 'undefined') return 'en';
  const match = window.location.pathname.match(/\/s\/([^/]+)/);
  const slug = match?.[1]?.toLowerCase();
  if (slug) {
    try {
      const stored = localStorage.getItem(`consumer-locale:${slug}`);
      const normalized = normalizeMobileA11yLocale(stored);
      if (stored && normalized) return normalized;
    } catch {
      // ignore storage errors
    }
  }
  return normalizeMobileA11yLocale(
    typeof navigator !== 'undefined' ? navigator.language : 'en',
  );
}
