export type { AppLocale, MessageTree } from '@shared-i18n/types';
export { SUPPORTED_LOCALES, LOCALE_LABELS } from '@shared-i18n/types';
export { translate } from '@shared-i18n/translate';
export { getMessages } from './catalog';
export { I18nProvider, useI18n } from './I18nProvider';
export { normalizeAppLocale, resolveProviderAppLocale } from './resolve-locale';
export { readStoredLocale, writeStoredLocale, clearStoredLocale } from './locale-storage';
