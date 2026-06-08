/** acc-3.7 — deterministic normalization scenarios (unit + service specs). */
export const PROMPT_NORMALIZATION_SCENARIOS: ReadonlyArray<{
  id: string;
  input: string;
  expectContains: string[];
  expectNotContains?: string[];
  expectExpansionIncludes?: string;
}> = [
  {
    id: 'abbrev-tomrw-apt',
    input: 'Book apt tomrw at 2pm',
    expectContains: ['appointment', 'tomorrow', '14:00'],
    expectExpansionIncludes: 'abbrev',
  },
  {
    id: 'spell-massage-misspell',
    input: 'Book masage with Gevorg tomorow',
    expectContains: ['massage', 'tomorrow'],
    expectExpansionIncludes: 'spell',
  },
  {
    id: 'spoken-time-nine-am',
    input: 'Schedule haircut nine am tomorrow',
    expectContains: ['09:00', 'tomorrow'],
    expectExpansionIncludes: 'time',
  },
  {
    id: 'mixed-script-latin-armenian',
    input: 'book facemassageՄարիա tomorrow',
    expectContains: ['facemassage', 'Մարիա', 'tomorrow'],
    expectExpansionIncludes: 'mixed-script',
  },
  {
    id: 'mixed-script-latin-cyrillic',
    input: 'book massageЗавтра at 10:00',
    expectContains: ['massage', 'Завтра', '10:00'],
    expectExpansionIncludes: 'mixed-script',
  },
  {
    id: 'number-word-two-pm',
    input: 'Book massage two pm tomorrow',
    expectContains: ['14:00', 'tomorrow'],
    expectExpansionIncludes: 'time',
  },
  {
    id: 'collapsed-asap-nearest',
    input: 'Book nearest masage asap on any provider',
    expectContains: ['as soon as possible', 'massage'],
    expectExpansionIncludes: 'abbrev',
  },
];

/** Common booking-domain misspellings → canonical word (acc-3.7 spell-correction). */
export const SPELL_CORRECTIONS: Readonly<Record<string, string>> = {
  tommorow: 'tomorrow',
  tommorrow: 'tomorrow',
  tomorow: 'tomorrow',
  tomoro: 'tomorrow',
  scheduel: 'schedule',
  apointment: 'appointment',
  apointments: 'appointments',
  masage: 'massage',
  masagee: 'massage',
  boking: 'booking',
  bokings: 'bookings',
  neares: 'nearest',
  nearst: 'nearest',
  sumarize: 'summarize',
  revnue: 'revenue',
  custmer: 'customer',
  packge: 'package',
  suport: 'support',
  contct: 'contact',
  cancle: 'cancel',
  cancl: 'cancel',
  rescedule: 'reschedule',
  availablity: 'availability',
  availble: 'available',
};

/** Abbreviation / shorthand expansions before classify. */
export const ABBREVIATION_REPLACEMENTS: ReadonlyArray<{
  pattern: RegExp;
  value: string;
  label: string;
}> = [
  { pattern: /\btomrw\b/gi, value: 'tomorrow', label: 'abbrev: tomrw→tomorrow' },
  { pattern: /\btmrw\b/gi, value: 'tomorrow', label: 'abbrev: tmrw→tomorrow' },
  { pattern: /\btmr\b/gi, value: 'tomorrow', label: 'abbrev: tmr→tomorrow' },
  { pattern: /\btdy\b/gi, value: 'today', label: 'abbrev: tdy→today' },
  { pattern: /\basap\b/gi, value: 'as soon as possible', label: 'abbrev: asap' },
  { pattern: /\bapt\b/gi, value: 'appointment', label: 'abbrev: apt→appointment' },
  { pattern: /\bappt\b/gi, value: 'appointment', label: 'abbrev: appt→appointment' },
  { pattern: /\bappts\b/gi, value: 'appointments', label: 'abbrev: appts→appointments' },
  { pattern: /\bsched\b/gi, value: 'schedule', label: 'abbrev: sched→schedule' },
  { pattern: /\bbkg\b/gi, value: 'booking', label: 'abbrev: bkg→booking' },
  { pattern: /\bw\/\b/gi, value: 'with', label: 'abbrev: w/→with' },
  { pattern: /\b2pm\b/gi, value: '14:00', label: 'time: 2pm→14:00' },
  { pattern: /\b2\s*pm\b/gi, value: '14:00', label: 'time: 2 pm→14:00' },
  { pattern: /\b9am\b/gi, value: '09:00', label: 'time: 9am→09:00' },
  { pattern: /\b9\s*am\b/gi, value: '09:00', label: 'time: 9 am→09:00' },
  { pattern: /\b10am\b/gi, value: '10:00', label: 'time: 10am→10:00' },
  { pattern: /\b10\s*am\b/gi, value: '10:00', label: 'time: 10 am→10:00' },
];

/** Spoken hour words for time normalization (acc-3.7). */
export const SPOKEN_HOUR_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/** Relative date word normalization (only when the token changes). */
export const DATE_WORD_REPLACEMENTS: ReadonlyArray<{
  pattern: RegExp;
  value: string;
  label: string;
}> = [
  { pattern: /\btonight\b/gi, value: 'evening', label: 'date: tonight→evening' },
];
