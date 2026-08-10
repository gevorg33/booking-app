/**
 * e2e-bug.336 — `explain_tour_calendar_span`'s week-range and span-range
 * labels (`ai-tour-calendar-span.logic.ts`) must use `formatDateForAiLabel`,
 * never DD/MM slash — sibling of Fixed e2e-bug.306/308. RU/HY prompts must
 * also get locale-native (still unambiguous) date labels, mirroring the
 * `resolveTourCalendarWeekLocale` pattern from e2e-bug.289/308.
 */

export type E2e336LocaleCase = {
  id: string;
  prompt: string;
  expectContains: string;
  forbidSlash: string;
};

export const E2E336_LOCALE_CASES: readonly E2e336LocaleCase[] = [
  {
    id: 'en-multi-day-span',
    prompt:
      'Why do tours appear across multiple days on the provider calendar?',
    expectContains: '8 June 2026',
    forbidSlash: '08/06/2026',
  },
  {
    id: 'ru-multi-day-span',
    prompt:
      'Почему тур отображается на несколько дней на календаре провайдера?',
    expectContains: '8 июня 2026',
    forbidSlash: '08/06/2026',
  },
  {
    id: 'hy-multi-day-span',
    prompt: 'Ինչու՞ շրջագայությունը երևում է մի քանի օր օրացույցում',
    expectContains: '8 հունիսի',
    forbidSlash: '08/06/2026',
  },
] as const;

/** Slash DD/MM must never appear regardless of locale. */
export const E2E336_SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
