/** n99-1 — near-99% clarify → success on next turn program. */

export const CLARIFY_NEAR_99_TARGET = 0.99;
export const CLARIFY_NEAR_99_MIN_SAMPLE = 20;
export const CLARIFY_NEAR_99_LOCALE_SPREAD_MAX = 0.03;
export const CLARIFY_NEAR_99_PRIMARY_LOCALES = ['en', 'hy', 'ru'] as const;

export const CLARIFY_FOLLOWUP_EVAL_FLOOR = 0.95;

export const N99_CLARIFY_FOLLOWUP_SCENARIOS = [
  {
    id: 'en-merge-slot',
    originalPrompt: 'book massage with Anna',
    followUpPrompt: 'tomorrow at 10:00',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Massage' },
    expectMergedPrompt: 'book massage with Anna. tomorrow at 10:00',
    expectNormalizedFollowUp: 'tomorrow at 10:00',
    expectRestoredAction: 'create_booking',
    expectInlineValid: true,
  },
  {
    id: 'en-normalize-voice',
    originalPrompt: 'book haircut',
    followUpPrompt: 'tomrw at 2pm',
    originalAction: 'create_booking',
    partialParams: { employeeName: 'Sam' },
    expectNormalizedFollowUp: 'tomorrow at 14:00',
    expectInlineValid: true,
  },
  {
    id: 'en-invalid-date',
    originalPrompt: 'book color',
    followUpPrompt: 'maybe sometime',
    originalAction: 'create_booking',
    field: 'date',
    expectInlineValid: false,
    expectInlineHint: 'Pick a specific date (for example tomorrow or 2026-06-10).',
    expectSecondTurnSuccess: false,
  },
  {
    id: 'hy-merge-slot',
    originalPrompt: 'ամրագրել մերսում',
    followUpPrompt: 'վաղը ժամը 10:00',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Massage' },
    expectMergedPrompt: 'ամրագրել մերսում. վաղը ժամը 10:00',
    expectInlineValid: true,
  },
  {
    id: 'ru-merge-slot',
    originalPrompt: 'записаться на стрижку',
    followUpPrompt: 'завтра в 10:00',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Haircut' },
    expectMergedPrompt: 'записаться на стрижку. завтра в 10:00',
    expectInlineValid: true,
  },
  {
    id: 'en-lossless-complete',
    originalPrompt: 'book massage with Anna',
    followUpPrompt: 'I meant Anna Smith. Date: 2026-06-09. Time: 10:00',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Massage' },
    expectRestoredAction: 'create_booking',
    expectInlineValid: true,
    expectExecuteImmediately: true,
  },
  {
    id: 'hy-voice-vagh',
    originalPrompt: 'ամրագրել մերսում',
    followUpPrompt: 'vagh@ at 2pm',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Massage' },
    expectNormalizedFollowUp: 'tomorrow at 14:00',
    expectInlineValid: true,
  },
  {
    id: 'hy-entity-anna',
    originalPrompt: 'book massage with Anna',
    followUpPrompt: 'Աննա',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Massage' },
    field: 'employeeName',
    expectNormalizedFollowUp: 'Աննա',
    expectInlineValid: true,
  },
  {
    id: 'ru-voice-zavtra',
    originalPrompt: 'записаться на стрижку',
    followUpPrompt: 'zavtra v 10:00',
    originalAction: 'create_booking',
    partialParams: { serviceName: 'Haircut' },
    expectNormalizedFollowUp: 'tomorrow 10:00',
    expectInlineValid: true,
  },
  {
    id: 'en-something-else',
    originalPrompt: 'move my thing tomorrow',
    surface: 'dashboard' as const,
    shortlist: ['reschedule_booking', 'cancel_booking', 'create_booking', 'list_bookings'],
    clarifyCandidates: [
      { action: 'reschedule_booking', label: 'Reschedule booking' },
      { action: 'cancel_booking', label: 'Cancel booking' },
    ],
    expectSomethingElseCount: 2,
  },
] as const;

export const N99_CLARIFY_NEAR_99_GATE_SCENARIOS = [
  {
    id: 'all-met',
    input: {
      clarifySuccessRate: 0.995,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: true,
  },
  {
    id: 'below-target',
    input: {
      clarifySuccessRate: 0.94,
      sampleSize: 120,
      localeSpread: 0.02,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
  {
    id: 'locale-spread-wide',
    input: {
      clarifySuccessRate: 0.995,
      sampleSize: 120,
      localeSpread: 0.05,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
  {
    id: 'insufficient-sample',
    input: {
      clarifySuccessRate: 1,
      sampleSize: 5,
      localeSpread: 0,
      insufficientLocales: [] as string[],
    },
    expectMet: false,
  },
] as const;
