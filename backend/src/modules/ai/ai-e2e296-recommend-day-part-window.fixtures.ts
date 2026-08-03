/**
 * e2e-bug.296 — recommend someone + tonight/this evening must keep a same-day
 * day-part window (not fall back to a 14-day scan).
 */

export type E2e296DayPartCase = {
  id: string;
  prompt: string;
  expectTimeOfDay: 'evening' | 'morning' | 'afternoon';
  expectRelativeDate: 'today' | 'tomorrow';
  expectKeysLen: 1;
  forbidPeriodLabel: RegExp;
};

export const E2E296_SAME_DAY_DAY_PART_CASES: readonly E2e296DayPartCase[] = [
  {
    id: 'e296-recommend-someone-this-evening',
    prompt: 'recommend someone for massage this evening',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-recommend-someone-tonight',
    prompt: 'recommend someone for massage tonight',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-suggest-someone-this-evening',
    prompt: 'suggest someone for a massage this evening',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-recommend-someone-this-morning',
    prompt: 'recommend someone for massage this morning',
    expectTimeOfDay: 'morning',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-recommend-someone-this-afternoon',
    prompt: 'recommend someone for massage this afternoon',
    expectTimeOfDay: 'afternoon',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-who-recommend-this-evening-control',
    prompt: 'Who do you recommend for a massage this evening?',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-who-is-best-tonight-control',
    prompt: 'Who is best for massage tonight?',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
  {
    id: 'e296-best-rated-this-evening-control',
    prompt: 'best rated specialists for massage this evening',
    expectTimeOfDay: 'evening',
    expectRelativeDate: 'today',
    expectKeysLen: 1,
    forbidPeriodLabel: /\(14 days\)/i,
  },
] as const;

/** Classifier 14-day range / dateless windows must not override same-day cues. */
export const E2E296_CLASSIFIER_RANGE_OVERRIDE_CASES = [
  {
    id: 'e296-override-dateFromTo-this-evening',
    prompt: 'recommend someone for massage this evening',
    seedParams: {
      serviceCategory: 'massage',
      dateFrom: '01/08/2026',
      dateTo: '14/08/2026',
    },
    expectRelativeDate: 'today' as const,
    expectTimeOfDay: 'evening' as const,
    expectKeysLen: 1,
  },
  {
    id: 'e296-override-dateFromTo-tonight',
    prompt: 'recommend someone for massage tonight',
    seedParams: {
      serviceCategory: 'massage',
      dateFrom: '01/08/2026',
      dateTo: '14/08/2026',
    },
    expectRelativeDate: 'today' as const,
    expectTimeOfDay: 'evening' as const,
    expectKeysLen: 1,
  },
  {
    id: 'e296-override-dateless-availabilityWindows-this-evening',
    prompt: 'recommend someone for massage this evening',
    seedParams: {
      serviceCategory: 'massage',
      timeOfDay: 'evening',
      availabilityWindows: [{ timeOfDay: 'evening' }],
    },
    expectRelativeDate: 'today' as const,
    expectTimeOfDay: 'evening' as const,
    expectKeysLen: 1,
  },
  {
    id: 'e296-override-dateless-availabilityWindows-tonight',
    prompt: 'recommend someone for massage tonight',
    seedParams: {
      serviceCategory: 'massage',
      timeOfDay: 'evening',
      availabilityWindows: [{ timeOfDay: 'evening' }],
    },
    expectRelativeDate: 'today' as const,
    expectTimeOfDay: 'evening' as const,
    expectKeysLen: 1,
  },
  {
    id: 'e296-override-concrete-date-plus-range-this-evening',
    prompt: 'recommend someone for massage this evening',
    seedParams: {
      serviceCategory: 'massage',
      date: '01/08/2026',
      timeOfDay: 'evening',
      dateFrom: '01/08/2026',
      dateTo: '14/08/2026',
    },
    expectRelativeDate: 'today' as const,
    expectTimeOfDay: 'evening' as const,
    expectKeysLen: 1,
  },
] as const;

/** Open-ended evening without "this/tonight" may still scan ahead (control). */
export const E2E296_OPEN_EVENING_CONTROLS = [
  {
    id: 'e296-ctrl-evening-slots-no-this',
    prompt: 'Evening slots for massage',
    expectTimeOfDay: 'evening' as const,
    allowMultiDay: true,
  },
] as const;
