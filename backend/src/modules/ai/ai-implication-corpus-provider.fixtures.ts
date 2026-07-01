import type {
  ImplicationCorpusScenario,
  ImplicationTopIntent,
} from './ai-implication-corpus.fixtures.js';

/** pipe-1.12.5 — provider mobile implied intents (heuristic rescue, not semantic anchors). */
export const IMPLICATION_CORPUS_PROVIDER_PIPE_MARKER = 'pipe-1.12.5';

type ProviderImplicationRow = {
  id: string;
  topIntent: ImplicationTopIntent;
  prompt: string;
  expectedAction: string;
};

const PROVIDER_BOOKING: ProviderImplicationRow[] = [
  {
    id: 'provider-next-after-client-implied-booking',
    topIntent: 'booking',
    prompt: 'Who is next after this client',
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-schedule-tomorrow-implied-booking',
    topIntent: 'booking',
    prompt: "What's on my schedule tomorrow morning",
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-appointment-count-implied-booking',
    topIntent: 'booking',
    prompt: 'How many appointments do I have today',
    expectedAction: 'summarize_my_appointments',
  },
  {
    id: 'provider-list-afternoon-implied-booking',
    topIntent: 'booking',
    prompt: 'List my appointments this afternoon',
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-next-after-lunch-implied-booking',
    topIntent: 'booking',
    prompt: 'Curious about my next appointment after lunch',
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-next-client-implied-booking',
    topIntent: 'booking',
    prompt: 'Trying to figure out who my next client is',
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-team-whos-next-implied-booking',
    topIntent: 'booking',
    prompt: "Who's next across the team in the next 2 hours",
    expectedAction: 'team_whos_next',
  },
  {
    id: 'provider-whos-next-book-implied-booking',
    topIntent: 'booking',
    prompt: 'Wondering who is next on my book today',
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-schedule-friday-implied-booking',
    topIntent: 'booking',
    prompt: "What's on my schedule Friday afternoon",
    expectedAction: 'show_appointments',
  },
  {
    id: 'provider-between-clients-implied-booking',
    topIntent: 'booking',
    prompt: 'Between clients — who is next for me',
    expectedAction: 'show_appointments',
  },
];

const PROVIDER_AVAILABILITY: ProviderImplicationRow[] = [
  {
    id: 'provider-check-availability-afternoon-implied-availability',
    topIntent: 'availability',
    prompt: 'Check my availability tomorrow afternoon',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-open-slots-week-implied-availability',
    topIntent: 'availability',
    prompt: 'Are there open slots on my calendar this week',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-free-times-thursday-implied-availability',
    topIntent: 'availability',
    prompt: 'What times are free on my calendar Thursday',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-free-slots-four-implied-availability',
    topIntent: 'availability',
    prompt: 'Are there free slots at 4pm today',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-slots-open-afternoon-implied-availability',
    topIntent: 'availability',
    prompt: 'What slots are open this afternoon on my calendar',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-check-before-leaving-implied-availability',
    topIntent: 'availability',
    prompt: 'Check availability at 4pm today before I leave',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-open-times-friday-implied-availability',
    topIntent: 'availability',
    prompt: 'What times are free Friday evening on my calendar',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-free-slots-today-implied-availability',
    topIntent: 'availability',
    prompt: 'Are there free slots this afternoon for another booking',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-check-open-slots-implied-availability',
    topIntent: 'availability',
    prompt: 'Are there free slots on my calendar tomorrow morning',
    expectedAction: 'check_availability',
  },
  {
    id: 'provider-check-my-open-times-implied-availability',
    topIntent: 'availability',
    prompt: 'What times are open on my calendar next week',
    expectedAction: 'check_availability',
  },
];

const PROVIDER_SCHEDULE: ProviderImplicationRow[] = [
  {
    id: 'provider-block-lunch-noon-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Need to block my lunch break tomorrow at noon',
    expectedAction: 'block_my_time',
  },
  {
    id: 'provider-block-break-friday-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Block my break from 12 to 1 this Friday',
    expectedAction: 'block_my_time',
  },
  {
    id: 'provider-gaps-afternoon-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Any gaps this afternoon on my book',
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'provider-afternoon-gaps-week-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Afternoon gaps this week I could fill',
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'provider-waitlist-gap-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Fill this gap with someone from the waitlist',
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'provider-suggest-waitlist-gap-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Suggest waitlist clients to fill this gap on my book',
    expectedAction: 'suggest_waitlist_for_gap',
  },
  {
    id: 'provider-block-admin-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Block 14:00 to 15:00 on my schedule for admin',
    expectedAction: 'block_schedule',
  },
  {
    id: 'provider-lunch-blocking-implied-schedule',
    topIntent: 'schedule',
    prompt: 'My lunch needs blocking on the calendar today',
    expectedAction: 'block_my_time',
  },
  {
    id: 'provider-gaps-fill-walkins-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Any gaps this afternoon I could fill with walk-ins',
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'provider-block-lunch-side-implied-schedule',
    topIntent: 'schedule',
    prompt: 'Block lunch 12:00-13:00 today on my side',
    expectedAction: 'block_schedule',
  },
];

function toProviderScenario(
  row: ProviderImplicationRow,
): ImplicationCorpusScenario {
  return {
    id: row.id,
    topIntent: row.topIntent,
    prompt: row.prompt,
    surface: 'provider',
    expectedAction: row.expectedAction,
    locale: 'en',
  };
}

export const PROVIDER_BOOKING_IMPLICATION_SCENARIOS: ImplicationCorpusScenario[] =
  PROVIDER_BOOKING.map(toProviderScenario);

export const PROVIDER_AVAILABILITY_IMPLICATION_SCENARIOS: ImplicationCorpusScenario[] =
  PROVIDER_AVAILABILITY.map(toProviderScenario);

export const PROVIDER_SCHEDULE_IMPLICATION_SCENARIOS: ImplicationCorpusScenario[] =
  PROVIDER_SCHEDULE.map(toProviderScenario);

export const IMPLICATION_CORPUS_PROVIDER_SCENARIOS: ImplicationCorpusScenario[] =
  [
    ...PROVIDER_BOOKING_IMPLICATION_SCENARIOS,
    ...PROVIDER_AVAILABILITY_IMPLICATION_SCENARIOS,
    ...PROVIDER_SCHEDULE_IMPLICATION_SCENARIOS,
  ];
