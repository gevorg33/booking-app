import {
  t,
  SUPPORTED_LOCALES,
  type AppLocale,
} from '../../common/i18n/messages.js';

export function resolveProviderSuggestionsLocale(
  userLocale?: string | null,
  businessLocale?: string | null,
): AppLocale {
  if (userLocale && SUPPORTED_LOCALES.includes(userLocale as AppLocale)) {
    return userLocale as AppLocale;
  }
  if (
    businessLocale &&
    SUPPORTED_LOCALES.includes(businessLocale as AppLocale)
  ) {
    return businessLocale as AppLocale;
  }
  return 'en';
}

export function providerSuggestionText(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  return t(locale, `providerSuggestions.${key}`, vars);
}
