import { BadRequestException } from '@nestjs/common';
import { SUPPORTED_LOCALES, type AppLocale } from '../i18n/messages.js';

export { SUPPORTED_LOCALES, type AppLocale };

export function normalizeAppLocale(
  code: string | null | undefined,
): AppLocale | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim().toLowerCase();
  if (!SUPPORTED_LOCALES.includes(trimmed as AppLocale)) return null;
  return trimmed as AppLocale;
}

export function isSupportedAppLocale(code: string): boolean {
  return normalizeAppLocale(code) !== null;
}

export function getBusinessEnabledLocales(
  settings?: Record<string, unknown>,
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

export function getBusinessDefaultLocale(
  settings?: Record<string, unknown>,
): AppLocale {
  const enabled = getBusinessEnabledLocales(settings);
  const preferred =
    normalizeAppLocale(settings?.defaultLocale as string | undefined) ??
    normalizeAppLocale(settings?.locale as string | undefined) ??
    'en';

  if (enabled.includes(preferred)) return preferred;
  return enabled[0];
}

export function assertBusinessLocaleSettings(input: {
  enabledLocales?: unknown;
  defaultLocale?: unknown;
}): { enabledLocales: AppLocale[]; defaultLocale: AppLocale } {
  let enabledLocales: AppLocale[];

  if (input.enabledLocales === undefined) {
    enabledLocales = [...SUPPORTED_LOCALES];
  } else if (!Array.isArray(input.enabledLocales)) {
    throw new BadRequestException(
      'enabledLocales must be an array of locale codes',
    );
  } else {
    const seen = new Set<AppLocale>();
    enabledLocales = [];
    for (const item of input.enabledLocales) {
      const locale = normalizeAppLocale(typeof item === 'string' ? item : null);
      if (!locale) {
        throw new BadRequestException(
          'Each enabled locale must be one of: en, hy, ru',
        );
      }
      if (seen.has(locale)) continue;
      seen.add(locale);
      enabledLocales.push(locale);
    }
    if (enabledLocales.length === 0) {
      throw new BadRequestException('At least one language must be enabled');
    }
  }

  const defaultLocale =
    input.defaultLocale === undefined
      ? enabledLocales[0]
      : normalizeAppLocale(input.defaultLocale as string);
  if (!defaultLocale) {
    throw new BadRequestException('defaultLocale must be one of: en, hy, ru');
  }
  if (!enabledLocales.includes(defaultLocale)) {
    throw new BadRequestException(
      'defaultLocale must be one of the enabled languages',
    );
  }

  return { enabledLocales, defaultLocale };
}

export function resolveTenantLocale(
  preferred: string | null | undefined,
  settings?: Record<string, unknown>,
): AppLocale {
  const enabled = getBusinessEnabledLocales(settings);
  const defaultLocale = getBusinessDefaultLocale(settings);
  const normalized = normalizeAppLocale(preferred);
  if (normalized && enabled.includes(normalized)) return normalized;
  return defaultLocale;
}

/** Dashboard/staff: user preference when supported, else tenant default. */
export function resolveStaffLocale(
  userLocale: string | null | undefined,
  settings?: Record<string, unknown>,
): AppLocale {
  const normalized = normalizeAppLocale(userLocale);
  if (normalized) return normalized;
  return getBusinessDefaultLocale(settings);
}

export function filterTranslationLocaleKeys<T extends Record<string, unknown>>(
  input: T,
  enabledLocales: readonly AppLocale[],
  options?: { strict?: boolean; stripDisabledOnly?: boolean },
): T {
  const enabled = new Set(enabledLocales);
  const result = {} as T;
  const strict = options?.strict ?? false;
  const stripDisabledOnly = options?.stripDisabledOnly ?? false;

  for (const [key, value] of Object.entries(input)) {
    const locale = normalizeAppLocale(key);
    if (!locale) {
      if (strict) {
        throw new BadRequestException(
          `Unsupported locale in translations: ${key}`,
        );
      }
      continue;
    }
    if (!enabled.has(locale)) {
      if (strict && !stripDisabledOnly) {
        throw new BadRequestException(
          `Locale ${locale} is not enabled for this business`,
        );
      }
      continue;
    }
    result[key as keyof T] = value as T[keyof T];
  }

  return result;
}

export function mergeBusinessLocaleSettings(
  current: Record<string, unknown> | undefined,
  patch: {
    enabledLocales?: AppLocale[];
    defaultLocale?: AppLocale;
  },
): Record<string, unknown> {
  const next = { ...(current ?? {}) };
  if (patch.enabledLocales !== undefined) {
    next.enabledLocales = patch.enabledLocales;
  }
  if (patch.defaultLocale !== undefined) {
    next.defaultLocale = patch.defaultLocale;
    next.locale = patch.defaultLocale;
  }
  return next;
}
