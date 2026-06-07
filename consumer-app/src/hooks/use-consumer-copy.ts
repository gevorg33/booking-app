import type { PublicBusinessProfile } from '../lib/types.js';
import { getConsumerCopy } from '../lib/copy.js';
import { useConsumerLocale } from './use-consumer-locale.js';

export type ConsumerLocaleProfile = Pick<
  PublicBusinessProfile,
  'locale' | 'defaultLocale' | 'enabledLocales'
>;

export function useConsumerCopy(slug: string, profile: ConsumerLocaleProfile) {
  const localeState = useConsumerLocale(slug, profile);
  return {
    ...localeState,
    copy: getConsumerCopy(localeState.locale),
  };
}
