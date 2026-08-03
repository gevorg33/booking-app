/**
 * e2e-bug.310 — HY last-week (անցած/նախորդ/անցյալ/վերջին շաբաթվա) calendar
 * tour lists must deterministically anchor last Mon–Sun (not this week).
 * Residual of e2e-bug.289; sibling of e2e-bug.309 RU next/last week.
 */

export type E2e310HyTourWeekCase = {
  id: string;
  prompt: string;
  expectCalendarWeek: boolean;
  weekRelative?: 'next' | 'last' | 'this';
};

export const E2E310_HY_LAST_WEEK_POSITIVES: readonly E2e310HyTourWeekCase[] = [
  {
    id: 'ai-e2e310-hy-ancac-shabatva-canonical',
    prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-ancac-show',
    prompt: 'Ցույց տուր անցած շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-ancac-lowercase',
    prompt: 'անցած շաբաթվա տուրերը օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-nakhord-shabatva',
    prompt: 'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-nakhord-show-tours',
    prompt: 'Ցույց տուր նախորդ շաբաթի տուրերը օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-ancyal-shabatva',
    prompt: 'անցյալ շաբաթվա տուրերը օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-verjin-shabatva',
    prompt: 'Վերջին շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-hy-next-control',
    prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'next',
  },
  {
    id: 'ai-e2e310-hy-this-control',
    prompt: 'այս շաբաթվա էքսկուրսիաները օրացույցում',
    expectCalendarWeek: true,
    weekRelative: 'this',
  },
  {
    id: 'ai-e2e310-en-last-regression',
    prompt: 'Any tours last week?',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
  {
    id: 'ai-e2e310-ru-last-regression',
    prompt: 'Туры на прошлой неделе в календаре',
    expectCalendarWeek: true,
    weekRelative: 'last',
  },
] as const;

/** Classifier "this week" ISO must not override HY last-week prompt. */
export const E2E310_CLASSIFIER_OVERRIDE_CASES = [
  {
    id: 'override-hy-ancac-vs-this-iso',
    prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
    params: { weekStartDate: '2026-08-01' },
    weekRelative: 'last' as const,
  },
  {
    id: 'override-hy-nakhord-vs-this-week-phrase',
    prompt: 'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
    params: { weekStartDate: 'this week' },
    weekRelative: 'last' as const,
  },
  {
    id: 'override-hy-ancyal-vs-today-iso',
    prompt: 'անցյալ շաբաթվա տուրերը օրացույցում',
    params: { weekStartDate: '2026-07-27' },
    weekRelative: 'last' as const,
  },
] as const;

export const E2E310_LIVE_CASES = [
  {
    id: 'live-hy-ancac-canonical',
    prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-hy-ancac-repeat-stability',
    prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
    repeats: 5,
  },
  {
    id: 'live-hy-ancac-show',
    prompt: 'Ցույց տուր անցած շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-hy-nakhord',
    prompt: 'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-hy-ancyal',
    prompt: 'անցյալ շաբաթվա տուրերը օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-hy-verjin',
    prompt: 'Վերջին շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-hy-next-control',
    prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'next' as const,
  },
  {
    id: 'live-hy-this-control',
    prompt: 'այս շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'hy' as const,
    expectWeekRelative: 'this' as const,
  },
  {
    id: 'live-en-last-regression',
    prompt: 'Any tours last week?',
    locale: 'en' as const,
    expectWeekRelative: 'last' as const,
  },
  {
    id: 'live-ru-last-regression',
    prompt: 'Туры на прошлой неделе в календаре',
    locale: 'ru' as const,
    expectWeekRelative: 'last' as const,
  },
] as const;
