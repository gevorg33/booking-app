import { useEffect, useState } from 'react';
import {
  CONSUMER_LOCALE_LABELS,
  readEnabledLocales,
  resolveConsumerLocale,
  writeStoredConsumerLocale,
  type ConsumerLocale,
} from '../lib/tenant-locale.js';

export function useConsumerLocale(
  slug: string,
  profile: {
    locale?: string;
    defaultLocale?: string;
    enabledLocales?: string[];
  },
) {
  const enabledLocales = readEnabledLocales(profile);
  const [locale, setLocale] = useState<ConsumerLocale>(() =>
    resolveConsumerLocale(slug, profile),
  );

  useEffect(() => {
    setLocale(resolveConsumerLocale(slug, profile));
  }, [slug, profile.defaultLocale, profile.enabledLocales, profile.locale]);

  const setConsumerLocale = (next: ConsumerLocale) => {
    if (!enabledLocales.includes(next)) return;
    writeStoredConsumerLocale(slug, next);
    setLocale(next);
  };

  return {
    locale,
    setConsumerLocale,
    enabledLocales,
    localeLabels: CONSUMER_LOCALE_LABELS,
  };
}
