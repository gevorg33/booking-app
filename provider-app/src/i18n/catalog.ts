import en from '@shared-i18n/messages/en';
import hy from '@shared-i18n/messages/hy';
import ru from '@shared-i18n/messages/ru';
import { deepMergeMessages } from '@shared-i18n/merge-messages';
import type { AppLocale, MessageTree } from '@shared-i18n/types';

export function getMessages(locale: AppLocale): MessageTree {
  if (locale === 'en') return en;
  const partial = locale === 'hy' ? hy : locale === 'ru' ? ru : null;
  return partial ? deepMergeMessages(en, partial) : en;
}
