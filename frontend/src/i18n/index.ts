import type { AppLocale, MessageTree } from './types';
import en from './messages/en';
import hy from './messages/hy';
import ru from './messages/ru';

export const messages: Record<AppLocale, MessageTree> = { en, hy, ru };

export function getMessages(locale: AppLocale): MessageTree {
  return messages[locale] ?? messages.en;
}

export * from './types';
export { translate } from './translate';
export { I18nProvider, useI18n, useOptionalI18n } from './I18nProvider';
