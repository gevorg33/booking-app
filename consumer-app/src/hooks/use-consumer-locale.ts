import { useEffect, useMemo, useState } from 'react';
import { getCustomerToken } from '../lib/customer-auth.js';
import { updateMyPreferredLocale } from '../services/public-api.js';
import {
  CONSUMER_LOCALE_CHANGED_EVENT,
  readEnabledLocales,
  resolveConsumerLocale,
  shouldApplyConsumerLocaleChange,
  writeStoredConsumerLocale,
  type ConsumerLocale,
  type ConsumerLocaleChangedDetail,
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
  const enabledKey = Array.isArray(profile.enabledLocales)
    ? profile.enabledLocales.join(',')
    : '';
  const enabledLocales = useMemo(
    () => readEnabledLocales(profile),
    // profile.enabledLocales identity churns; key on contents (e2e-bug.14).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabledKey],
  );
  const [locale, setLocale] = useState<ConsumerLocale>(() =>
    resolveConsumerLocale(slug, profile),
  );

  useEffect(() => {
    const next = resolveConsumerLocale(slug, profile);
    setLocale((prev) => (prev === next ? prev : next));
  }, [slug, profile.defaultLocale, enabledKey, profile.locale]);

  // e2e-bug.22 — Ionic keeps sibling tabs mounted; sync when another picker writes locale.
  useEffect(() => {
    const onLocaleChanged = (event: Event) => {
      const detail = (event as CustomEvent<ConsumerLocaleChangedDetail>).detail;
      if (
        !detail ||
        !shouldApplyConsumerLocaleChange({
          eventSlug: detail.slug,
          hookSlug: slug,
          nextLocale: detail.locale,
          enabledLocales,
        })
      ) {
        return;
      }
      setLocale((prev) => (prev === detail.locale ? prev : detail.locale));
    };
    window.addEventListener(CONSUMER_LOCALE_CHANGED_EVENT, onLocaleChanged);
    return () => {
      window.removeEventListener(CONSUMER_LOCALE_CHANGED_EVENT, onLocaleChanged);
    };
  }, [enabledLocales, slug]);

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
