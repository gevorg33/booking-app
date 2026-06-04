import type { AppLocale } from '@shared-i18n/types';
import { SUPPORTED_LOCALES } from '@shared-i18n/types';
import { readStoredLocale } from './locale-storage';

export function normalizeAppLocale(value?: string | null): AppLocale {
  if (value && SUPPORTED_LOCALES.includes(value as AppLocale)) {
    return value as AppLocale;
  }
  return 'en';
}

/** Provider app default: user locale → business locale → stored override → English. */
export function resolveProviderAppLocale(
  userLocale?: string | null,
  businessLocale?: string | null,
): AppLocale {
  const fromUser = normalizeAppLocale(userLocale);
  if (userLocale && SUPPORTED_LOCALES.includes(userLocale as AppLocale)) {
    return fromUser;
  }
  if (businessLocale && SUPPORTED_LOCALES.includes(businessLocale as AppLocale)) {
    return businessLocale as AppLocale;
  }
  return readStoredLocale() ?? 'en';
}
