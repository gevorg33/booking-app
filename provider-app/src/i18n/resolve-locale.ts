import type { AppLocale } from '@shared-i18n/types';
import { SUPPORTED_LOCALES } from '@shared-i18n/types';
import { readStoredLocale } from './locale-storage';

export function normalizeAppLocale(value?: string | null): AppLocale {
  if (value && SUPPORTED_LOCALES.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  return 'en';
}

/** Provider app default: user locale → business locale → stored override → tenant default. */
export function resolveProviderAppLocale(
  userLocale?: string | null,
  businessLocale?: string | null,
  enabledLocales?: readonly AppLocale[] | null,
  defaultLocale?: AppLocale | null,
): AppLocale {
  const enabled =
    enabledLocales && enabledLocales.length > 0
      ? enabledLocales
      : SUPPORTED_LOCALES;
  const fallback =
    defaultLocale && enabled.includes(defaultLocale)
      ? defaultLocale
      : (enabled[0] ?? 'en');

  const stored = readStoredLocale();
  if (stored && enabled.includes(stored)) return stored;

  if (
    userLocale &&
    SUPPORTED_LOCALES.includes(userLocale as AppLocale) &&
    enabled.includes(userLocale as AppLocale)
  ) {
    return userLocale as AppLocale;
  }

  if (
    businessLocale &&
    SUPPORTED_LOCALES.includes(businessLocale as AppLocale) &&
    enabled.includes(businessLocale as AppLocale)
  ) {
    return businessLocale as AppLocale;
  }

  return fallback;
}
