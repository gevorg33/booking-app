/**
 * e2e-bug.85 — explain_rtl_layout always answered "EN …" because it read
 * classifier params.locale (never populated) instead of the request locale.
 */
export const E2E85_REQUEST_LOCALE_CASES = [
  {
    id: 'e2e85-hy-what-is-rtl',
    prompt: 'What is RTL?',
    locale: 'hy',
    expectedLocaleLabel: 'HY',
    expectedDirection: 'ltr' as const,
  },
  {
    id: 'e2e85-ru-what-is-rtl',
    prompt: 'What is RTL?',
    locale: 'ru',
    expectedLocaleLabel: 'RU',
    expectedDirection: 'ltr' as const,
  },
  {
    id: 'e2e85-en-what-is-rtl',
    prompt: 'What is RTL?',
    locale: 'en',
    expectedLocaleLabel: 'EN',
    expectedDirection: 'ltr' as const,
  },
  {
    id: 'e2e85-ar-rtl-direction',
    prompt: 'What is RTL?',
    locale: 'ar',
    expectedLocaleLabel: null as string | null,
    expectedDirection: 'rtl' as const,
  },
] as const;

export const E2E85_MISSING_LOCALE_DEFAULT = {
  id: 'e2e85-missing-locale-defaults-en',
  prompt: 'What is RTL?',
  expectedLocaleLabel: 'EN',
} as const;
