import { useEffect, useState } from 'react';
import {
  readEnabledLocales,
  resolveConsumerLocale,
  writeStoredConsumerLocale,
  type ConsumerLocale,
} from '../lib/tenant-locale.js';

const LOCALE_LABELS: Record<ConsumerLocale, string> = {
  en: 'English',
  hy: 'Հայերեն',
  ru: 'Русский',
};

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
    localeLabels: LOCALE_LABELS,
  };
}
