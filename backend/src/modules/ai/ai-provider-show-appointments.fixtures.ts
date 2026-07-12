/** ai-cmd-provider-5.1.2 — provider mobile flat appointment list, filterable by clock time, day-part, and status. */

export const PROVIDER_SHOW_APPOINTMENTS_CLASSIFIER_RULES = `- show_appointments: READ — provider mobile only: flat list of individual bookings for own (or, for managers, scoped team) calendar. Supports serviceName and status/statusFilter, plus clock-time ("at 2pm") and day-part ("this morning/afternoon/evening") filters. Triggers: who do I see at 2pm, list my afternoon, show my confirmed bookings, show completed appointments today. NOT summarize_day (status-breakdown narrative, not a list), NOT summarize_my_appointments (count-only), NOT team_whos_next (manager cross-team queue), NOT summarize_utilization (busy-percent, not a list).`;

export const PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS = [
  {
    id: 'show-appointments-clock-time-en',
    prompt: 'Who do I see at 2pm?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-afternoon-en',
    prompt: 'List my afternoon',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-today-en',
    prompt: 'Show me my appointments today',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-morning-en',
    prompt: 'What appointments do I have this morning?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-tomorrow-morning-en',
    prompt: 'Show me tomorrow morning',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-confirmed-en',
    prompt: 'List my confirmed bookings',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-completed-today-en',
    prompt: 'Show completed appointments today',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-clock-time-half-en',
    prompt: "Who's on my schedule at 3:30?",
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-no-show-en',
    prompt: 'Show me my no-show appointments',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-tomorrow-all-en',
    prompt: 'List all my appointments for tomorrow',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-weekday-en',
    prompt: 'What appointments do I have this Friday?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-explicit-date-en',
    prompt: 'Show me my appointments on March 5th',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-today-hy',
    prompt: 'Ցույց տուր իմ ժամադրությունները այսօր',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-clock-time-hy',
    prompt: 'Ում եմ տեսնում ժամը 2-ին',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-today-ru',
    prompt: 'Покажи мои записи на сегодня',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
  {
    id: 'show-appointments-clock-time-ru',
    prompt: 'Кого я принимаю в 14:00?',
    surface: 'provider' as const,
    expectedAction: 'show_appointments',
  },
] as const;
