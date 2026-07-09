/** prov-exp-1 / ai-cmd-provider-5.1.1 — provider mobile "how's my day" status-breakdown narrative. */

export const PROVIDER_SUMMARIZE_DAY_CLASSIFIER_RULES = `- summarize_day: READ — provider mobile only: status breakdown of today's (or a given date's) appointments — counts by confirmed/completed/no-show/cancelled. Triggers: how's today looking, how's my day going, any no-shows yet, status of today's appointments, give me a rundown of today. Optional date (defaults to today). NOT show_appointments (flat list of individual bookings), NOT summarize_my_appointments (count-only, no status breakdown), NOT end_of_day_summary (full end-of-day wrap-up with unpaid/no-show follow-ups).`;

export const PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS = [
  {
    id: 'summarize-day-looking-en',
    prompt: "How's today looking?",
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-going-en',
    prompt: "How's my day going?",
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-no-shows-en',
    prompt: 'Any no-shows yet today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-status-en',
    prompt: "What's the status of today's appointments?",
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-rundown-en',
    prompt: 'Give me a rundown of today',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-summary-en',
    prompt: 'Summarize my day',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-breakdown-en',
    prompt: "Give me a status breakdown of today's bookings",
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-tomorrow-en',
    prompt: "How's tomorrow looking?",
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-completed-en',
    prompt: 'How many appointments are completed so far today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-any-cancellations-en',
    prompt: 'Any cancellations today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-hy',
    prompt: 'Ինչպե՞ս է այսօրվա օրը',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-no-shows-hy',
    prompt: 'Կա՞ն բացակայողներ այսօր',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-ru',
    prompt: 'Как проходит мой день?',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
  {
    id: 'summarize-day-no-shows-ru',
    prompt: 'Есть неявки сегодня?',
    surface: 'provider' as const,
    expectedAction: 'summarize_day',
  },
] as const;
