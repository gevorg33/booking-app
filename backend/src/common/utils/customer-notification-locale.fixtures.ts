import type { AppLocale } from '../i18n/messages.js';

export const CUSTOMER_NOTIFICATION_LOCALE_SCENARIOS: Array<{
  id: string;
  metadata?: Record<string, unknown> | null;
  businessSettings?: Record<string, unknown>;
  expected: AppLocale;
}> = [
  {
    id: 'stored-hy',
    metadata: { preferredLocale: 'hy' },
    businessSettings: { enabledLocales: ['en', 'hy'], defaultLocale: 'en' },
    expected: 'hy',
  },
  {
    id: 'stored-ru-clamped-to-default',
    metadata: { preferredLocale: 'ru' },
    businessSettings: { enabledLocales: ['en', 'hy'], defaultLocale: 'hy' },
    expected: 'hy',
  },
  {
    id: 'missing-pref-uses-default',
    metadata: {},
    businessSettings: { enabledLocales: ['en', 'hy'], defaultLocale: 'hy' },
    expected: 'hy',
  },
  {
    id: 'invalid-stored-falls-back',
    metadata: { preferredLocale: 'de' },
    businessSettings: { enabledLocales: ['en', 'ru'], defaultLocale: 'ru' },
    expected: 'ru',
  },
  {
    id: 'null-metadata',
    metadata: null,
    businessSettings: { enabledLocales: ['en'], defaultLocale: 'en' },
    expected: 'en',
  },
];
