/** acc-3.14 — minimum phrase-coverage score for heuristic semantic detection. */
export const HEURISTIC_SEMANTIC_MIN_SCORE = 0.55;

export type HeuristicSemanticTag =
  | 'first_available_booking'
  | 'team_wide_provider_availability'
  | 'booking_metric'
  | 'staff_metric'
  | 'service_metric'
  | 'customer_metric'
  | 'appointment_metric';

export interface HeuristicSemanticPhrase {
  id: string;
  phrase: string;
  tag: HeuristicSemanticTag;
  /** Metric enum value when tag ends with _metric. */
  value?: string;
  locale?: string;
}

export interface HeuristicSemanticScenario {
  id: string;
  prompt: string;
  tag: HeuristicSemanticTag;
  expected: boolean | string;
}

/** Canonical heuristic phrases — extend here instead of adding intent regex. */
export const HEURISTIC_SEMANTIC_PHRASES: HeuristicSemanticPhrase[] = [
  // first available / flexible slot booking
  { id: 'heur-fa-1', tag: 'first_available_booking', phrase: 'first available' },
  { id: 'heur-fa-2', tag: 'first_available_booking', phrase: 'earliest available slot' },
  { id: 'heur-fa-3', tag: 'first_available_booking', phrase: 'next available appointment' },
  { id: 'heur-fa-4', tag: 'first_available_booking', phrase: 'nearest available slot' },
  { id: 'heur-fa-5', tag: 'first_available_booking', phrase: 'nearest free time' },
  { id: 'heur-fa-translit-1', tag: 'first_available_booking', phrase: 'blizhayshee massage' },
  { id: 'heur-fa-6', tag: 'first_available_booking', phrase: 'book the nearest slot' },
  { id: 'heur-fa-7', tag: 'first_available_booking', phrase: 'grab the soonest opening' },
  { id: 'heur-fa-8', tag: 'first_available_booking', phrase: 'as soon as possible' },
  { id: 'heur-fa-9', tag: 'first_available_booking', phrase: 'asap' },
  { id: 'heur-fa-10', tag: 'first_available_booking', phrase: 'reserve the nearest slot' },
  { id: 'heur-fa-11', tag: 'first_available_booking', phrase: 'schedule the next available appointment' },
  { id: 'heur-fa-12', tag: 'first_available_booking', phrase: 'get the earliest slot' },
  { id: 'heur-fa-13', tag: 'first_available_booking', phrase: 'book the soonest slot' },
  { id: 'heur-fa-14', tag: 'first_available_booking', phrase: 'find the nearest appointment' },
  { id: 'heur-fa-15', tag: 'first_available_booking', phrase: 'book next available slot' },
  { id: 'heur-fa-16', tag: 'first_available_booking', phrase: 'soonest slot', locale: 'en' },
  { id: 'heur-fa-hy-1', tag: 'first_available_booking', phrase: 'ամրագրիր ամենամոտ slot', locale: 'hy' },
  { id: 'heur-fa-hy-2', tag: 'first_available_booking', phrase: 'ամրագրիր մոտակա slot', locale: 'hy' },
  { id: 'heur-fa-ru-1', tag: 'first_available_booking', phrase: 'ближайшее свободное время', locale: 'ru' },
  { id: 'heur-fa-ru-2', tag: 'first_available_booking', phrase: 'ближайший слот', locale: 'ru' },
  { id: 'heur-fa-ru-3', tag: 'first_available_booking', phrase: 'запиши ближайший слот', locale: 'ru' },

  // team-wide provider availability
  { id: 'heur-tw-1', tag: 'team_wide_provider_availability', phrase: 'who is free tomorrow for lashes' },
  { id: 'heur-tw-2', tag: 'team_wide_provider_availability', phrase: 'who has a free slot' },
  { id: 'heur-tw-3', tag: 'team_wide_provider_availability', phrase: 'who is available' },
  { id: 'heur-tw-4', tag: 'team_wide_provider_availability', phrase: 'who can do massage' },
  { id: 'heur-tw-5', tag: 'team_wide_provider_availability', phrase: 'who is doing facemassage today' },
  { id: 'heur-tw-6', tag: 'team_wide_provider_availability', phrase: 'which specialists are free for massage' },
  { id: 'heur-tw-7', tag: 'team_wide_provider_availability', phrase: 'free slots for tomorrow' },
  { id: 'heur-tw-8', tag: 'team_wide_provider_availability', phrase: 'who are available tomorrow' },
  { id: 'heur-tw-9', tag: 'team_wide_provider_availability', phrase: 'see who is open tomorrow afternoon' },
  { id: 'heur-tw-10', tag: 'team_wide_provider_availability', phrase: 'check who can take permanent lashes' },
  { id: 'heur-tw-11', tag: 'team_wide_provider_availability', phrase: 'which stylist is available tomorrow' },
  { id: 'heur-tw-hy-1', tag: 'team_wide_provider_availability', phrase: 'ով է ազատ վաղը', locale: 'hy' },
  { id: 'heur-tw-ru-1', tag: 'team_wide_provider_availability', phrase: 'кто свободен завтра', locale: 'ru' },

  // booking metrics
  { id: 'heur-bm-revenue-1', tag: 'booking_metric', value: 'revenue', phrase: 'total earnings for today' },
  { id: 'heur-bm-revenue-2', tag: 'booking_metric', value: 'revenue', phrase: 'how much did we earn' },
  { id: 'heur-bm-revenue-3', tag: 'booking_metric', value: 'revenue', phrase: 'calculate total earnings' },
  { id: 'heur-bm-count-1', tag: 'booking_metric', value: 'count', phrase: 'how many appointments today' },
  { id: 'heur-bm-count-2', tag: 'booking_metric', value: 'count', phrase: 'summarize today for all providers' },
  { id: 'heur-bm-count-3', tag: 'booking_metric', value: 'count', phrase: 'number of bookings' },
  { id: 'heur-bm-busy-1', tag: 'booking_metric', value: 'busiest_provider', phrase: 'busiest provider today' },
  { id: 'heur-bm-busy-2', tag: 'booking_metric', value: 'busiest_provider', phrase: 'most appointments today' },
  { id: 'heur-bm-noshow-1', tag: 'booking_metric', value: 'no_shows', phrase: 'no show appointments' },
  { id: 'heur-bm-cancel-1', tag: 'booking_metric', value: 'cancelled', phrase: 'cancelled appointments' },
  { id: 'heur-bm-unpaid-1', tag: 'booking_metric', value: 'unpaid', phrase: 'unpaid appointments' },
  { id: 'heur-bm-upcoming-1', tag: 'booking_metric', value: 'upcoming', phrase: 'upcoming appointments' },
  { id: 'heur-bm-confirmed-1', tag: 'booking_metric', value: 'confirmed', phrase: 'confirmed appointments' },
  { id: 'heur-bm-pending-1', tag: 'booking_metric', value: 'pending', phrase: 'pending appointments' },
  { id: 'heur-bm-completed-1', tag: 'booking_metric', value: 'completed', phrase: 'completed appointments' },
  { id: 'heur-bm-overview-1', tag: 'booking_metric', value: 'overview', phrase: 'booking overview summary' },

  // staff metrics
  { id: 'heur-sm-revenue-1', tag: 'staff_metric', value: 'most_revenue', phrase: 'top specialists by revenue' },
  { id: 'heur-sm-revenue-2', tag: 'staff_metric', value: 'most_revenue', phrase: 'which specialist earned the most' },
  { id: 'heur-sm-revenue-3', tag: 'staff_metric', value: 'most_revenue', phrase: 'who brought in the most revenue' },
  { id: 'heur-sm-busy-1', tag: 'staff_metric', value: 'busiest', phrase: 'busiest staff member' },
  { id: 'heur-sm-bookings-1', tag: 'staff_metric', value: 'most_bookings', phrase: 'most bookings by staff' },

  // service metrics
  { id: 'heur-svm-popular-1', tag: 'service_metric', value: 'most_booked', phrase: 'most popular service' },
  { id: 'heur-svm-popular-2', tag: 'service_metric', value: 'most_booked', phrase: 'most booked service' },
  { id: 'heur-svm-revenue-1', tag: 'service_metric', value: 'top_revenue', phrase: 'service revenue breakdown' },
  { id: 'heur-svm-least-1', tag: 'service_metric', value: 'least_booked', phrase: 'least popular service' },

  // customer metrics
  { id: 'heur-cm-noshow-1', tag: 'customer_metric', value: 'most_no_shows', phrase: 'customers with the most no-shows' },
  { id: 'heur-cm-noshow-2', tag: 'customer_metric', value: 'most_no_shows', phrase: 'most no-shows' },
  { id: 'heur-cm-risk-1', tag: 'customer_metric', value: 'at_risk', phrase: 're-engage inactive customers' },
  { id: 'heur-cm-risk-3', tag: 'customer_metric', value: 'at_risk', phrase: 'inactive customers' },
  { id: 'heur-cm-risk-4', tag: 'customer_metric', value: 'at_risk', phrase: 'lapsed clients' },
  { id: 'heur-cm-risk-2', tag: 'customer_metric', value: 'at_risk', phrase: 'at-risk customers' },
  { id: 'heur-cm-spender-1', tag: 'customer_metric', value: 'top_spenders', phrase: 'customers who paid the most' },
  { id: 'heur-cm-new-1', tag: 'customer_metric', value: 'new_customers', phrase: 'new customers this month' },
  { id: 'heur-cm-vip-1', tag: 'customer_metric', value: 'vip', phrase: 'vip loyal customers' },
  { id: 'heur-cm-cancel-1', tag: 'customer_metric', value: 'most_cancellations', phrase: 'customers who cancel the most' },
  { id: 'heur-cm-bookings-1', tag: 'customer_metric', value: 'most_bookings', phrase: 'customer who books the most' },

  // appointment metrics
  { id: 'heur-am-expensive-1', tag: 'appointment_metric', value: 'most_expensive', phrase: 'most expensive appointment' },
  { id: 'heur-am-long-1', tag: 'appointment_metric', value: 'longest', phrase: 'longest appointment' },
  { id: 'heur-am-short-1', tag: 'appointment_metric', value: 'shortest', phrase: 'shortest appointment' },
  { id: 'heur-am-early-1', tag: 'appointment_metric', value: 'earliest', phrase: 'earliest appointment today' },
  { id: 'heur-am-late-1', tag: 'appointment_metric', value: 'latest', phrase: 'last appointment today' },
];

export const HEURISTIC_SEMANTIC_SCENARIOS: HeuristicSemanticScenario[] = [
  {
    id: 'fa-soonest-slot',
    prompt: 'book the soonest slot for massage',
    tag: 'first_available_booking',
    expected: true,
  },
  {
    id: 'fa-nearest-reschedule',
    prompt: 'Move Jujos appointment on June 10 from 16-17 to june 11th nearest free time',
    tag: 'first_available_booking',
    expected: true,
  },
  {
    id: 'tw-who-free-compound',
    prompt: "who's free tomorrow evening for permanent lashes, book the nearest slot",
    tag: 'team_wide_provider_availability',
    expected: true,
  },
  {
    id: 'tw-plain-booking-negative',
    prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    tag: 'team_wide_provider_availability',
    expected: false,
  },
  {
    id: 'fa-ru-nearest-slot',
    prompt: 'Запиши ближайший слот для massage завтра вечером',
    tag: 'first_available_booking',
    expected: true,
  },
  {
    id: 'bm-revenue-earnings',
    prompt: 'Calculate total earnings for last week',
    tag: 'booking_metric',
    expected: 'revenue',
  },
  {
    id: 'sm-top-revenue',
    prompt: 'Top 5 specialists by revenue last month',
    tag: 'staff_metric',
    expected: 'most_revenue',
  },
  {
    id: 'cm-no-shows',
    prompt: 'Find customers with the most no-shows',
    tag: 'customer_metric',
    expected: 'most_no_shows',
  },
];
