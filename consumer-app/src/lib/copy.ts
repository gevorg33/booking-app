/** Localized consumer UI copy aligned with web public booking (gap-2.7). */
export type { ConsumerCopy, ConsumerDocumentCategory } from './consumer-copy.types.js';
export {
  CONSUMER_COPY_EN,
  CONSUMER_COPY_HY,
  CONSUMER_COPY_RU,
  CONSUMER_COPY_LOCALES,
  getConsumerCopy,
} from './consumer-copy-catalog.js';
export { normalizeConsumerLocale, type ConsumerLocale } from './tenant-locale.js';

import { getConsumerCopy, CONSUMER_COPY_EN } from './consumer-copy-catalog.js';
import { normalizeConsumerLocale } from './tenant-locale.js';

/** English fallback for legacy imports and tests. */
export const copy = CONSUMER_COPY_EN;

export function consumerCopyForLocale(locale?: string | null): ReturnType<typeof getConsumerCopy> {
  return getConsumerCopy(normalizeConsumerLocale(locale) ?? 'en');
}

export function formatCopy(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
