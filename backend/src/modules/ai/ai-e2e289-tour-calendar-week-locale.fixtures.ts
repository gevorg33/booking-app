/**
 * e2e-bug.289 — HY (and RU) list_tour_calendar_week empty/success summaries
 * must stay in the prompt language (not English after enrich).
 */

export type E2e289LocaleCase = {
  id: string;
  prompt: string;
  locale?: 'en' | 'hy' | 'ru';
  expectLocale: 'en' | 'hy' | 'ru';
  /** Armenian letters / Cyrillic / English empty-state cue. */
  expectSummaryMatch: RegExp;
  forbidEnglishEmpty?: boolean;
  forbidSlashDdMm?: boolean;
};

/** Empty-state locale matrix (guru QA edge coverage). */
export const E2E289_EMPTY_LOCALE_CASES: readonly E2e289LocaleCase[] = [
  {
    id: 'e289-hy-canonical-pax',
    prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-hy-short',
    prompt: 'Այս շաբաթվա էքսկուրսիաները օրացույցում',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-hy-next-week',
    prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-hy-last-week',
    prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-hy-with-en-session-locale',
    prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում',
    locale: 'en',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
  },
  {
    id: 'e289-ru-canonical',
    prompt: 'Покажи туры на этой неделе в календаре с pax',
    expectLocale: 'ru',
    expectSummaryMatch: /нет подтверждённых выездов туров|календарной неделе/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-ru-next-week',
    prompt: 'Какие туры на следующей неделе в календаре?',
    expectLocale: 'ru',
    expectSummaryMatch: /нет подтверждённых выездов туров|календарной неделе/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-en-canonical',
    prompt: 'List tour departures on the provider calendar this week',
    expectLocale: 'en',
    expectSummaryMatch: /No confirmed tour departures visible/i,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-en-any-tours-this-week',
    prompt: 'Any tours this week?',
    expectLocale: 'en',
    expectSummaryMatch: /No confirmed tour departures visible/i,
    forbidSlashDdMm: true,
  },
  {
    id: 'e289-en-prompt-session-locale-hy',
    prompt: 'Any tours this week?',
    locale: 'hy',
    expectLocale: 'hy',
    expectSummaryMatch: /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար/u,
    forbidEnglishEmpty: true,
    forbidSlashDdMm: true,
  },
];

export const E2E289_SKIP_ENRICH_ACTION = 'list_tour_calendar_week' as const;

export const E2E289_ENGLISH_EMPTY_CUES = [
  'No confirmed tour departures',
  'There are no confirmed tour departures',
  'calendar week',
] as const;
