/** n99-1.6 — clarify follow-up normalization (extends acc-3.7). */
export const CLARIFY_FOLLOWUP_NORMALIZATION_SCENARIOS: ReadonlyArray<{
  id: string;
  input: string;
  field?: string;
  expectNormalized: string;
  expectValidDate?: boolean;
  expectValidTime?: boolean;
}> = [
  {
    id: 'en-tomrw-2pm',
    input: 'tomrw at 2pm',
    expectNormalized: 'tomorrow at 14:00',
    expectValidDate: true,
    expectValidTime: true,
  },
  {
    id: 'en-voice-spoken',
    input: 'tomorow at two pm',
    expectNormalized: 'tomorrow at 14:00',
    expectValidDate: true,
    expectValidTime: true,
  },
  {
    id: 'hy-vagh-time',
    input: 'վաղը ժամը 10:00',
    field: 'date',
    expectNormalized: 'tomorrow',
    expectValidDate: true,
  },
  {
    id: 'hy-vagh-time-slot',
    input: 'ժամը 10:00',
    field: 'timeSlot',
    expectNormalized: '10:00',
    expectValidTime: true,
  },
  {
    id: 'ru-zavtra-time',
    input: 'завтра в 10:00',
    field: 'date',
    expectNormalized: 'tomorrow',
    expectValidDate: true,
  },
  {
    id: 'ru-time-only',
    input: 'в 14:00',
    field: 'timeSlot',
    expectNormalized: '14:00',
    expectValidTime: true,
  },
  {
    id: 'translit-vagh-2pm',
    input: 'vagh@ at 2pm',
    expectNormalized: 'tomorrow at 14:00',
    expectValidDate: true,
    expectValidTime: true,
  },
  {
    id: 'translit-zavtra',
    input: 'zavtra v 10:00',
    field: 'date',
    expectNormalized: 'tomorrow',
    expectValidDate: true,
  },
  {
    id: 'hy-entity-anna',
    input: 'Աննա',
    field: 'employeeName',
    expectNormalized: 'Աննա',
  },
  {
    id: 'hy-entity-anna-smith',
    input: 'I meant Anna Smith',
    field: 'employeeName',
    expectNormalized: 'I meant Anna Smith',
  },
  {
    id: 'merge-preserve-hy-script',
    input: 'վաղը ժամը 10:00',
    expectNormalized: 'վաղը ժամը 10:00',
  },
];

/** Relative date tokens in hy/ru/translit → canonical English for parsing. */
export const CLARIFY_FOLLOWUP_DATE_REPLACEMENTS: ReadonlyArray<{
  pattern: RegExp;
  value: string;
  label: string;
}> = [
  { pattern: /վաղը|վաղա/giu, value: 'tomorrow', label: 'clarify-date: hy tomorrow' },
  { pattern: /завтра/giu, value: 'tomorrow', label: 'clarify-date: ru tomorrow' },
  { pattern: /\bvagh@|\bvagh\b|\bvaxa\b/gi, value: 'tomorrow', label: 'clarify-date: translit tomorrow' },
  { pattern: /\bzavtra\b/gi, value: 'tomorrow', label: 'clarify-date: translit zavtra' },
  { pattern: /այսօր|այս\s*օր/giu, value: 'today', label: 'clarify-date: hy today' },
  { pattern: /сегодня/giu, value: 'today', label: 'clarify-date: ru today' },
  { pattern: /\baysor\b/gi, value: 'today', label: 'clarify-date: translit today' },
];

/** Strip hy/ru time filler words; keep HH:mm. */
export const CLARIFY_FOLLOWUP_TIME_REPLACEMENTS: ReadonlyArray<{
  pattern: RegExp;
  value: string;
  label: string;
}> = [
  {
    pattern: /ժամը\s+(\d{1,2}(?::\d{2})?(?:-\s*ին)?)/giu,
    value: '$1',
    label: 'clarify-time: hy',
  },
  { pattern: /\sв\s+(\d{1,2}(?::\d{2})?)/giu, value: ' $1', label: 'clarify-time: ru' },
  { pattern: /\s+v\s+(\d{1,2}(?::\d{2})?)/gi, value: ' $1', label: 'clarify-time: translit v' },
  { pattern: /\s+в\s+/giu, value: ' ', label: 'clarify-time: ru filler' },
];
