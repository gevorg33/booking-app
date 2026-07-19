const SUPPORTED = ['en', 'hy', 'ru'] as const;
export type ConsumerLocale = (typeof SUPPORTED)[number];

export const CONSUMER_LOCALE_LABELS: Record<ConsumerLocale, string> = {
  en: 'English',
  hy: 'Հայերեն',
  ru: 'Русский',
};

export function normalizeConsumerLocale(value?: string | null): ConsumerLocale | null {
  if (!value) return null;
  const code = value.trim().toLowerCase();
  return SUPPORTED.includes(code as ConsumerLocale) ? (code as ConsumerLocale) : null;
}

export function readEnabledLocales(profile: {
  enabledLocales?: string[];
}): ConsumerLocale[] {
  const raw = profile.enabledLocales;
  if (!Array.isArray(raw) || raw.length === 0) return [...SUPPORTED];
  const seen = new Set<ConsumerLocale>();
  const result: ConsumerLocale[] = [];
  for (const item of raw) {
    const locale = normalizeConsumerLocale(item);
    if (!locale || seen.has(locale)) continue;
    seen.add(locale);
    result.push(locale);
  }
  return result.length > 0 ? result : [...SUPPORTED];
}

export function readDefaultLocale(profile: {
  locale?: string;
  defaultLocale?: string;
  enabledLocales?: string[];
}): ConsumerLocale {
  const enabled = readEnabledLocales(profile);
  const preferred =
    normalizeConsumerLocale(profile.defaultLocale) ??
    normalizeConsumerLocale(profile.locale) ??
    'en';
  return enabled.includes(preferred) ? preferred : (enabled[0] ?? 'en');
}

export function localeStorageKey(slug: string) {
  return `consumer-locale:${slug}`;
}

export function readStoredConsumerLocale(slug: string): ConsumerLocale | null {
  try {
    return normalizeConsumerLocale(localStorage.getItem(localeStorageKey(slug)));
  } catch {
    return null;
  }
}

/** e2e-bug.22 — sync every mounted useConsumerLocale after a language change. */
export const CONSUMER_LOCALE_CHANGED_EVENT = 'consumer-locale-changed';

export type ConsumerLocaleChangedDetail = {
  slug: string;
  locale: ConsumerLocale;
};

export function writeStoredConsumerLocale(slug: string, locale: ConsumerLocale) {
  try {
    localStorage.setItem(localeStorageKey(slug), locale);
  } catch {
    // ignore quota / private mode
  }
  try {
    window.dispatchEvent(
      new CustomEvent<ConsumerLocaleChangedDetail>(CONSUMER_LOCALE_CHANGED_EVENT, {
        detail: { slug, locale },
      }),
    );
  } catch {
    // ignore non-browser / missing window
  }
}

/** Whether a locale-changed event should update this hook instance. */
export function shouldApplyConsumerLocaleChange(input: {
  eventSlug: string;
  hookSlug: string;
  nextLocale: string;
  enabledLocales: readonly string[];
}): boolean {
  if (input.eventSlug !== input.hookSlug) return false;
  const next = normalizeConsumerLocale(input.nextLocale);
  return Boolean(next && input.enabledLocales.includes(next));
}

export function resolveConsumerLocale(
  slug: string,
  profile: {
    locale?: string;
    defaultLocale?: string;
    enabledLocales?: string[];
  },
): ConsumerLocale {
  const enabled = readEnabledLocales(profile);
  const stored = readStoredConsumerLocale(slug);
  if (stored && enabled.includes(stored)) return stored;
  return readDefaultLocale(profile);
}

export function formatStoredTenantLocaleLabel(slug: string): string | null {
  const stored = readStoredConsumerLocale(slug);
  return stored ? CONSUMER_LOCALE_LABELS[stored] : null;
}

/**
 * Locale for screens without a tenant slug (welcome).
 * e2e-bug.54 — WelcomePage previously forced `getConsumerCopy('en')`.
 */
export function resolveAppConsumerLocale(): ConsumerLocale {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('consumer-locale:')) continue;
      const locale = normalizeConsumerLocale(localStorage.getItem(key));
      if (locale) return locale;
    }
  } catch {
    // ignore
  }
  try {
    const nav = normalizeConsumerLocale(
      typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : null,
    );
    if (nav) return nav;
  } catch {
    // ignore
  }
  return 'en';
}
