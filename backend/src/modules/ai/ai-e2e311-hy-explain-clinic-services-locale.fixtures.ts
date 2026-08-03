/**
 * e2e-bug.311 — HY/RU explain_clinic_services empty summaries must stay
 * localized (not flake to English via LLM enrich). Residual of e2e-bug.291.
 */

export const E2E311_SKIP_ENRICH_ACTION = 'explain_clinic_services' as const;

export type E2e311LocaleCase = {
  id: string;
  prompt: string;
  paramsLocale?: 'en' | 'hy' | 'ru';
  expectedLocale: 'en' | 'hy' | 'ru';
  expectEmptyMatch: RegExp;
  forbidEnglishEmpty?: boolean;
};

export const E2E311_LOCALE_RESOLVE_CASES: readonly E2e311LocaleCase[] = [
  {
    id: 'hy-lab-fasting-prompt',
    prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող',
    paramsLocale: 'hy',
    expectedLocale: 'hy',
    expectEmptyMatch: /կլինիկական կատալոգում|հասանելի չեն/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'hy-consultation-count-bug-repro',
    prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
    paramsLocale: 'hy',
    expectedLocale: 'hy',
    expectEmptyMatch: /կլինիկական կատալոգում|հասանելի չեն/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'hy-explain-services',
    prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները և բաժինները',
    paramsLocale: 'en',
    expectedLocale: 'hy',
    expectEmptyMatch: /կլինիկական կատալոգում|հասանելի չեն/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'hy-department-counts',
    prompt: 'Ցույց տուր բաժինների քանակը կատալոգում',
    paramsLocale: 'hy',
    expectedLocale: 'hy',
    expectEmptyMatch: /կլինիկական կատալոգում|հասանելի չեն/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'ru-consultation-count',
    prompt: 'Сколько консультаций в каталоге?',
    paramsLocale: 'ru',
    expectedLocale: 'ru',
    expectEmptyMatch: /каталоге клиники|нет доступных/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'ru-fasting-labs',
    prompt: 'Какие лабораторные тесты требуют голодания?',
    paramsLocale: 'en',
    expectedLocale: 'ru',
    expectEmptyMatch: /каталоге клиники|нет доступных/i,
    forbidEnglishEmpty: true,
  },
  {
    id: 'en-fasting-labs',
    prompt: 'Which lab tests require fasting?',
    paramsLocale: 'en',
    expectedLocale: 'en',
    expectEmptyMatch: /No clinic catalog services are currently available/i,
  },
  {
    id: 'en-explain-clinic',
    prompt: 'Explain our clinic services and department counts',
    paramsLocale: 'en',
    expectedLocale: 'en',
    expectEmptyMatch: /No clinic catalog services are currently available/i,
  },
] as const;

export const E2E311_LIVE_CASES = [
  {
    id: 'live-hy-lab-fasting',
    prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-consultation-count',
    prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-consultation-stability-1',
    prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-consultation-stability-2',
    prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-consultation-stability-3',
    prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-explain-services',
    prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-hy-department-counts',
    prompt: 'Ցույց տուր բաժինների քանակը',
    locale: 'hy' as const,
    expectHy: true,
  },
  {
    id: 'live-ru-consultation',
    prompt: 'Сколько консультаций в каталоге?',
    locale: 'ru' as const,
    expectRu: true,
  },
  {
    id: 'live-ru-fasting',
    prompt: 'Какие лабораторные тесты требуют голодания?',
    locale: 'ru' as const,
    expectRu: true,
  },
  {
    id: 'live-en-fasting',
    prompt: 'Which lab tests require fasting?',
    locale: 'en' as const,
    expectEn: true,
  },
] as const;
