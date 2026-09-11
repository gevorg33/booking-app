/** prov-exp-1 / ai-cmd-provider-5.1.6 — provider mobile utilization % narrative for a date range. */

export const PROVIDER_SUMMARIZE_UTILIZATION_CLASSIFIER_RULES = `- summarize_utilization: READ-ONLY — booked-vs-available percent for a date range — own stats for providers; team summary for managers. Triggers: how full is my week, how busy am I, what percent of my slots are booked, utilization this month. Optional dateFrom/dateTo (defaults to this week). NOT my_stats (broader performance rollup including revenue/reviews), NOT check_availability (open slots, not a percent summary).`;

export const PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS = [
  {
    id: 'summarize-utilization-how-full-en',
    prompt: 'How full is my week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-how-busy-en',
    prompt: 'How busy am I this week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-percent-booked-en',
    prompt: 'What percent of my slots are booked?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-this-month-en',
    prompt: 'Summarize my utilization this month',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-open-hours-en',
    prompt: 'How many open hours do I have this month?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-team-en',
    prompt: "What's the team's utilization this week?",
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-booked-percent-en',
    prompt: 'Booked percent for next week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-how-booked-en',
    prompt: 'How booked am I today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-utilisation-en',
    prompt: 'Show my utilisation for this week',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-schedule-full-en',
    prompt: 'Is my schedule full this week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-hy',
    prompt: 'Որքանո՞վ եմ զբաղված այս շաբաթ',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-percent-hy',
    prompt: 'Իմ գրաֆիկի լրացվածության տոկո՞սը',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-ru',
    prompt: 'Насколько я загружен на этой неделе?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
  {
    id: 'summarize-utilization-percent-ru',
    prompt: 'Какой процент моих слотов забронирован?',
    surface: 'provider' as const,
    expectedAction: 'summarize_utilization',
  },
] as const;
