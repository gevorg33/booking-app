/** ai-cmd-provider-5.1.7 — provider mobile end-of-day wrap-up: appointment count + unpaid + no-show follow-ups + tomorrow's gaps. */

export const PROVIDER_END_OF_DAY_SUMMARY_CLASSIFIER_RULES = `- end_of_day_summary: READ — provider mobile own calendar only: end-of-day wrap-up (appointment count, still-unpaid count, no-show follow-ups, gaps tomorrow). Triggers: wrap up today, end of day summary, close out my day, anything still unpaid, no-shows I need to follow up on. NOT summarize_day (mid-day status breakdown, not a closing wrap-up).`;

export const PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS = [
  {
    id: 'end-of-day-summary-wrap-up-en',
    prompt: 'Wrap up today',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-still-unpaid-en',
    prompt: 'Anything still unpaid?',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-eod-en',
    prompt: 'End of day summary',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-close-out-en',
    prompt: 'Close out my day',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-give-me-en',
    prompt: 'Give me my end of day summary',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-no-show-follow-up-en',
    prompt: 'Any no-shows I still need to follow up on?',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-how-was-en',
    prompt: 'How was my day overall?',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-wrap-up-my-day-en',
    prompt: 'Wrap up my day',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-before-close-up-en',
    prompt: 'Anything unpaid before I close up?',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-todays-wrap-up-en',
    prompt: "Give me today's wrap-up",
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-hy',
    prompt: 'Ամփոփիր օրս',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-unpaid-hy',
    prompt: 'Ինչ-որ բան դեռ չվճարվա՞ծ է',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-ru',
    prompt: 'Подведи итоги дня',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
  {
    id: 'end-of-day-summary-unpaid-ru',
    prompt: 'Есть что-то неоплаченное?',
    surface: 'provider' as const,
    expectedAction: 'end_of_day_summary',
  },
] as const;
