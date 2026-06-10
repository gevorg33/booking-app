import { useEffect, useState } from 'react';
import { getCustomerToken } from '../lib/customer-auth.js';
import { updateMyPreferredLocale } from '../services/public-api.js';
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
    if (getCustomerToken(slug)) {
      void updateMyPreferredLocale(slug, next).catch(() => {
        // keep local choice; server sync is best-effort
      });
    }
  };

  return {
    locale,
    setConsumerLocale,
    enabledLocales,
    localeLabels: LOCALE_LABELS,
  };
}
