import type { AppLocale, MessageTree } from './types';
import en from './messages/en';
import hy from './messages/hy';
import ru from './messages/ru';
import { deepMergeMessages } from './merge-messages';

export const messages: Record<AppLocale, MessageTree> = { en, hy, ru };

export function getMessages(locale: AppLocale): MessageTree {
  if (locale === 'en') return en;
  const partial = messages[locale];
  return partial ? deepMergeMessages(en, partial) : en;
}

export { LOCALE_COOKIE, SUPPORTED_LOCALES, LOCALE_LABELS } from './types';
export * from './types';
export { translate } from './translate';
export { I18nProvider, useI18n, useOptionalI18n } from './I18nProvider';
