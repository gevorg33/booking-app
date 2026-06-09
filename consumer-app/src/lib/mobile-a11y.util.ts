/** adopt-5.6 — document language, RTL-safe direction, VoiceOver/TalkBack helpers. */

export type MobileA11yLocale = 'en' | 'hy' | 'ru';

/** WCAG 2.5.5 / iOS HIG ~44pt minimum interactive target. */
export const MOBILE_A11Y_HIT_TARGET_MIN_REM = 2.75;

export const MOBILE_A11Y_FONT_SCALE_DEFAULT = 1;

export const MOBILE_A11Y_CSS_VARS = {
  fontScale: '--adoption-font-scale',
  hitTargetMin: '--adoption-hit-target-min',
  bodyFontSize: '--adoption-body-font-size',
  captionFontSize: '--adoption-caption-font-size',
} as const;

export const MOBILE_A11Y_ROOT_CLASS = 'adoption-a11y-root';

export function normalizeMobileA11yLocale(value?: string | null): MobileA11yLocale {
  const code = value?.trim().toLowerCase().slice(0, 2);
  if (code === 'hy' || code === 'ru') return code;
  return 'en';
}

/** HY/RU/EN are LTR; layouts use logical CSS properties for RTL readiness. */
export function resolveDocumentDirection(_locale: MobileA11yLocale): 'ltr' | 'rtl' {
  return 'ltr';
}

export function resolveMobileFontScale(): number {
  return MOBILE_A11Y_FONT_SCALE_DEFAULT;
}

export function applyDocumentAccessibility(locale: MobileA11yLocale): void {
  if (typeof document === 'undefined') return;
  const fontScale = resolveMobileFontScale();
  document.documentElement.lang = locale;
  document.documentElement.dir = resolveDocumentDirection(locale);
  document.documentElement.style.setProperty(
    MOBILE_A11Y_CSS_VARS.fontScale,
    String(fontScale),
  );
  document.documentElement.style.setProperty(
    MOBILE_A11Y_CSS_VARS.hitTargetMin,
    `${MOBILE_A11Y_HIT_TARGET_MIN_REM}rem`,
  );
  const root = document.body ?? document.documentElement;
  root?.classList?.add(MOBILE_A11Y_ROOT_CLASS);
}

export function resolveConsumerDocumentLocale(): MobileA11yLocale {
  if (typeof window === 'undefined') return 'en';
  const pathname = window.location?.pathname ?? '';
  const match = pathname.match(/\/s\/([^/]+)/);
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
