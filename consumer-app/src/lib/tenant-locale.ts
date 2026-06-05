const SUPPORTED = ['en', 'hy', 'ru'] as const;
export type ConsumerLocale = (typeof SUPPORTED)[number];

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

export function writeStoredConsumerLocale(slug: string, locale: ConsumerLocale) {
  try {
    localStorage.setItem(localeStorageKey(slug), locale);
  } catch {
    // ignore quota / private mode
  }
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
