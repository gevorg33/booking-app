/** Provider mobile — appointment counts and net revenue summaries. */
export const PROVIDER_EARNINGS_CLASSIFIER_RULES = `- summarize_my_appointments: READ — provider mobile only: count the signed-in provider's appointments for today, tomorrow, a specific day, or dateFrom–dateTo. Triggers: how many appointments do I have, count my bookings tomorrow, appointments between dates. NOT show_appointments (full list), NOT summarize_day (status breakdown narrative), NOT list_bookings (admin-style list).
- summarize_my_revenue: READ — provider mobile only: net provider earnings for a period — gross collected minus tax, then salon commission % when rules exist. Triggers: how much did I make, my revenue last week, net earnings this month, income from 1 Jun to 15 Jun. NOT explain_appointment_tax (tax line breakdown on one booking), NOT explain_provider_payment_currency (currency symbol), NOT payment_sweep (mark paid), NOT dashboard summarize_staff.
- Examples:
  - "How many appointments do I have tomorrow?" → summarize_my_appointments, date=tomorrow
  - "Count my bookings from 1 June to 15 June" → summarize_my_appointments, dateFrom/dateTo
  - "How much did I make last week?" → summarize_my_revenue
  - "What's my net revenue this month?" → summarize_my_revenue`;

export const PROVIDER_EARNINGS_PROMPT_SCENARIOS = [
  {
    id: 'appt-count-today-en',
    prompt: 'How many appointments do I have today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-tomorrow-en',
    prompt: 'How many appointments do I have tomorrow?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-last-week-en',
    prompt: 'Count my appointments last week',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-range-en',
    prompt: 'How many bookings do I have from 1 June to 15 June?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-specific-day-en',
    prompt: 'Number of my appointments on 12 June',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-next-week-en',
    prompt: 'How many clients am I seeing next week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-this-month-en',
    prompt: 'Total appointments this month for me',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-question-en',
    prompt: 'Do I have any appointments tomorrow?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-hy',
    prompt: 'Քանի ամրագրում ունեմ վաղը',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'appt-count-ru',
    prompt: 'Сколько у меня записей на завтра?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'revenue-today-en',
    prompt: 'How much did I make today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-tomorrow-en',
    prompt: 'What is my revenue tomorrow?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-last-week-en',
    prompt: 'How much did I earn last week?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-last-month-en',
    prompt: 'My net revenue last month',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-range-en',
    prompt: 'Show my earnings from 1 June to 15 June',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-this-month-en',
    prompt: 'What did I make this month so far?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-net-en',
    prompt: 'Summarize my net earnings after tax this week',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-commission-en',
    prompt: 'How much is my cut from paid appointments today?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-hy',
    prompt: 'Քանի եմ վաստակել անցած շաբաթ',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
  {
    id: 'revenue-ru',
    prompt: 'Сколько я заработал на прошлой неделе?',
    surface: 'provider' as const,
    expectedAction: 'summarize_my_revenue',
  },
] as const;
