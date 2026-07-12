export const PROVIDER_SCHEDULE_READS_INTENTS = [
  'list_upcoming_bookings',
  'get_schedule_summary',
  'get_calendar_month',
  'list_schedule_gaps',
] as const;

export type ProviderScheduleReadsIntent =
  (typeof PROVIDER_SCHEDULE_READS_INTENTS)[number];

export const PROVIDER_SCHEDULE_READS_CLASSIFIER_RULES = `- list_upcoming_bookings: READ — live list of upcoming appointments over the next N days (own scope, or team scope for managers), distinct from today only. Triggers: "What's coming up this week?", "What's coming up on my schedule for the next 10 days?", "What do I have coming up?". Optional days (1-30, default 7). Uses GET …/bookings/upcoming. NOT show_appointments (today's list), NOT list_bookings (date-filtered single day/range with explicit date params), NOT list_my_upcoming_appointments (customer's own visits at the salon).
- get_schedule_summary: READ — live day-by-day available vs booked slot counts over the next N days plus today's timeline and open time-off requests. Triggers: "Summarize my schedule for the next two weeks", "How does my schedule look this month?", "Give me a schedule overview". Optional days (1-30, default 14). Uses GET …/schedule/summary. NOT summarize_utilization (percent-busy metric), NOT get_calendar_month (calendar grid view).
- get_calendar_month: READ — live calendar-grid view for a given month (own scope, or team/business scope for managers): per-day booking count and utilization band (empty/low/medium/high). Triggers: "Show me my calendar for this month", "Which days this month are fully booked?", "How does next month look on my calendar?". Optional month (YYYY-MM, default current month). Uses GET …/calendar/month. NOT summarize_utilization (single percent over a date range, no per-day grid), NOT explain_calendar_utilization_bands (static FAQ about what the bands mean, not live data).
- list_schedule_gaps: READ — per-day list of open/unfilled time windows over a date range (own scope, or all providers for managers), distinct from a single "gaps between clients today" question. Triggers: "Which days do I have gaps this week?", "List my schedule gaps for next week", "Show my open time windows by day". Requires a date range (default this week when unstated). Uses GET …/schedule/gaps. NOT fill_unused_slots (mutate — actually books/blocks the gaps), NOT suggest_waitlist_for_gap (matches waitlist customers to a gap, doesn't list gaps), NOT explain_today_timeline (single-day "gaps between clients" narrative), NOT check_availability (specific day/time slot lookup, not a per-day gap grid).`;

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
    {
      id: 'calendar-month-this-month',
      // Deliberately avoids "my"/"this ... calendar" ordering, which collides
      // with isAddBookingToCalendarPrompt's BOOKING_CONTEXT regex
      // (ai-add-booking-to-calendar.util.ts) — that rescue runs earlier in
      // the cascade for the customer-facing add-to-calendar-links intent.
      prompt: 'Pull up the calendar for this month',
      expectedAction: 'get_calendar_month',
    },
    {
      id: 'calendar-month-fully-booked-days',
      prompt: 'Which days this month are fully booked?',
      expectedAction: 'get_calendar_month',
    },
    {
      id: 'schedule-gaps-which-days',
      prompt: 'Which days do I have gaps this week?',
      expectedAction: 'list_schedule_gaps',
    },
    {
      id: 'schedule-gaps-list-next-week',
      prompt: 'List my schedule gaps for next week',
      expectedAction: 'list_schedule_gaps',
    },
  ];
