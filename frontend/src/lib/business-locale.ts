import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

export { SUPPORTED_LOCALES, type AppLocale };

export function normalizeAppLocale(
  code: string | null | undefined,
): AppLocale | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim().toLowerCase();
  return SUPPORTED_LOCALES.includes(trimmed as AppLocale)
    ? (trimmed as AppLocale)
    : null;
}

export function readBusinessEnabledLocales(
  settings?: Record<string, unknown> | null,
): AppLocale[] {
  const raw = settings?.enabledLocales;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...SUPPORTED_LOCALES];
  }

  const seen = new Set<AppLocale>();
  const result: AppLocale[] = [];
  for (const item of raw) {
    const locale = normalizeAppLocale(typeof item === 'string' ? item : null);
    if (!locale || seen.has(locale)) continue;
    seen.add(locale);
    result.push(locale);
  }

  return result.length > 0 ? result : [...SUPPORTED_LOCALES];
}

export function readBusinessDefaultLocale(
  settings?: Record<string, unknown> | null,
): AppLocale {
  const enabled = readBusinessEnabledLocales(settings);
  const preferred =
    normalizeAppLocale(settings?.defaultLocale as string | undefined) ??
    normalizeAppLocale(settings?.locale as string | undefined) ??
    'en';

  if (enabled.includes(preferred)) return preferred;
  return enabled[0];
}

export function resolveTenantLocale(
  preferred: string | null | undefined,
  settings?: Record<string, unknown> | null,
): AppLocale {
  const enabled = readBusinessEnabledLocales(settings);
  const defaultLocale = readBusinessDefaultLocale(settings);
  const normalized = normalizeAppLocale(preferred);
  if (normalized && enabled.includes(normalized)) return normalized;
  return defaultLocale;
}

export function resolveStaffLocale(
  userLocale: string | null | undefined,
  settings?: Record<string, unknown> | null,
): AppLocale {
  const normalized = normalizeAppLocale(userLocale);
  if (normalized) return normalized;
  return readBusinessDefaultLocale(settings);
}

export function filterLocalizedNamesPayload<T extends Record<string, unknown>>(
  input: T,
  enabledLocales: readonly AppLocale[],
): T {
  const enabled = new Set(enabledLocales);
  const result = {} as T;
  for (const [key, value] of Object.entries(input)) {
    const locale = normalizeAppLocale(key);
    if (locale && enabled.has(locale)) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}
