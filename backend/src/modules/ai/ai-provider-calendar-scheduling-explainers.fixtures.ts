/** ai-cmd-provider-5.23.2 / 5.23.4 — static educational explainers for the calendar month utilization bands and block-vs-time-off policy. */

export const PROVIDER_CALENDAR_SCHEDULING_EXPLAINERS_CLASSIFIER_RULES = `- explain_calendar_utilization_bands: READ — provider mobile only: explains what the calendar month view's color bands mean (empty, low, medium, high booked). Triggers: what do the green bands mean, fully booked day, what do the calendar colors mean, explain calendar bands. NOT summarize_utilization (live percent-busy metric for a specific period), NOT get_schedule_summary (day-by-day slot counts).
- explain_block_vs_time_off: READ — provider mobile only: self-service FAQ comparing instant block_schedule/block_my_time (no approval) vs request_time_off (needs manager approval). Triggers: block vs time off, which should I use for vacation, difference between block and time off. NOT block_schedule / block_my_time / request_time_off themselves (this only explains when to use which).`;

export const PROVIDER_EXPLAIN_CALENDAR_UTILIZATION_BANDS_PROMPT_SCENARIOS = [
  {
    id: 'explain-calendar-bands-green-en',
    prompt: 'What do the green bands mean?',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
  {
    id: 'explain-calendar-bands-fully-booked-en',
    prompt: 'Fully booked day?',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
  {
    id: 'explain-calendar-bands-colors-en',
    prompt: 'What do the calendar colors mean?',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
  {
    id: 'explain-calendar-bands-explain-en',
    prompt: 'Explain the calendar color bands',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
  {
    id: 'explain-calendar-bands-hy',
    prompt: 'Ի՞նչ են ցույց տալիս օրացույցի գույները',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
  {
    id: 'explain-calendar-bands-ru',
    prompt: 'Что означают цвета календаря?',
    surface: 'provider' as const,
    expectedAction: 'explain_calendar_utilization_bands',
  },
] as const;

export const PROVIDER_EXPLAIN_BLOCK_VS_TIME_OFF_PROMPT_SCENARIOS = [
  {
    id: 'explain-block-vs-time-off-diff-en',
    prompt: "What's the difference between block and time off?",
    surface: 'provider' as const,
    expectedAction: 'explain_block_vs_time_off',
  },
  {
    id: 'explain-block-vs-time-off-vacation-en',
    prompt: 'Which should I use for vacation?',
    surface: 'provider' as const,
    expectedAction: 'explain_block_vs_time_off',
  },
  {
    id: 'explain-block-vs-time-off-or-en',
    prompt: 'Block or time off for a dentist appointment?',
    surface: 'provider' as const,
    expectedAction: 'explain_block_vs_time_off',
  },
  {
    id: 'explain-block-vs-time-off-hy',
    prompt: 'Որն է տարբերությունը արգելափակման և արձակուրդի միջև',
    surface: 'provider' as const,
    expectedAction: 'explain_block_vs_time_off',
  },
  {
    id: 'explain-block-vs-time-off-ru',
    prompt: 'В чём разница между блокировкой и отпуском?',
    surface: 'provider' as const,
    expectedAction: 'explain_block_vs_time_off',
  },
] as const;
