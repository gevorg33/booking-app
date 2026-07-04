export const PROVIDER_SCHEDULE_READS_INTENTS = [
  'list_upcoming_bookings',
  'get_schedule_summary',
] as const;

export type ProviderScheduleReadsIntent =
  (typeof PROVIDER_SCHEDULE_READS_INTENTS)[number];

export const PROVIDER_SCHEDULE_READS_CLASSIFIER_RULES = `- list_upcoming_bookings: READ — live list of upcoming appointments over the next N days (own scope, or team scope for managers), distinct from today only. Triggers: "What's coming up this week?", "What's coming up on my schedule for the next 10 days?", "What do I have coming up?". Optional days (1-30, default 7). Uses GET …/bookings/upcoming. NOT show_appointments (today's list), NOT list_bookings (date-filtered single day/range with explicit date params), NOT list_my_upcoming_appointments (customer's own visits at the salon).
- get_schedule_summary: READ — live day-by-day available vs booked slot counts over the next N days plus today's timeline and open time-off requests. Triggers: "Summarize my schedule for the next two weeks", "How does my schedule look this month?", "Give me a schedule overview". Optional days (1-30, default 14). Uses GET …/schedule/summary. NOT summarize_utilization (percent-busy metric), NOT get_calendar_month (calendar grid view).`;

export type ProviderScheduleReadsPromptFixture = {
  id: string;
  prompt: string;
  expectedAction: ProviderScheduleReadsIntent;
  days?: number;
};

export const PROVIDER_SCHEDULE_READS_PROMPTS: readonly ProviderScheduleReadsPromptFixture[] =
  [
    {
      id: 'whats-coming-up',
      prompt: "What's coming up this week?",
      expectedAction: 'list_upcoming_bookings',
    },
    {
      id: 'upcoming-next-10-days',
      prompt: "What's coming up on my schedule for the next 10 days?",
      expectedAction: 'list_upcoming_bookings',
      days: 10,
    },
    {
      id: 'schedule-summary-two-weeks',
      prompt: 'Summarize my schedule for the next two weeks',
      expectedAction: 'get_schedule_summary',
      days: 14,
    },
    {
      id: 'schedule-overview',
      prompt: 'Give me a schedule overview',
      expectedAction: 'get_schedule_summary',
    },
  ];
