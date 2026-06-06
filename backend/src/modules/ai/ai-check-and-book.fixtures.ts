import type { CommandSurface } from './ai-command-registry.types.js';

/** Classifier rules shared by dashboard INTENT_SCHEMA and customer classifier schema. */
export const CHECK_AND_BOOK_CLASSIFIER_RULES = `- Check-then-book compound (one message): when the user asks who is free/available/open for a service AND wants the nearest/soonest/next/earliest slot or ASAP, extract serviceName, date, timeOfDay (morning/afternoon/evening/tonight), allProviders=true when no named provider, and bookingFirstAvailable=true with timeSlot=null. Multi-step execution is handled automatically — do NOT require a fixed start time.
- check_providers_for_service: READ — list providers with open bookable windows for a service on a date/time-of-day. Triggers: who/which/anyone/anybody + free|available|open|providers|stylists; "see who is open", "who can take {service}", "check providers for {service}".
- book_nearest_slot: MUTATE — book the earliest open slot after an optional provider check. Triggers: book|find|get|reserve|schedule|grab + nearest|soonest|first|next|earliest|ASAP + slot|appointment|opening|time (or a service name). Set bookingFirstAvailable=true, timeSlot=null.
- Do NOT use create_booking or book_appointment with a required timeSlot when the user says nearest/first/soonest/next available/earliest/ASAP — set bookingFirstAvailable=true instead.
- Do NOT confuse with check_availability (single named provider's slots) or lookup_service_assignment (dashboard staff catalog assignment).
- timeOfDay: morning (before 12:00), afternoon (12:00–17:00), evening (after 17:00); "tonight" counts as evening. Set timeOfDay when mentioned.
- timeFrom: earliest hour for flexible booking (e.g. "after 16:00" → timeFrom="16:00"; evening implies a not-before window downstream).
- allProviders: true when no specific provider is named and the user asks who is free / any provider / team-wide.
- Examples:
  - "who's free tomorrow evening for permanent lashes, book the nearest slot" → serviceName=permanent lashes, date=tomorrow, timeOfDay=evening, allProviders=true, bookingFirstAvailable=true
  - "see who is open tomorrow afternoon for massage and find the nearest appointment" → serviceName=massage, timeOfDay=afternoon, bookingFirstAvailable=true
  - "which stylist is available tomorrow for massage and book the soonest slot" → serviceName=massage, allProviders=true, bookingFirstAvailable=true`;

/** Classifier rules for the anonymous public booking page (check_availability + book_appointment). */
export const PUBLIC_CHECK_AND_BOOK_CLASSIFIER_RULES = `- Check-then-book compound (one message): when the user asks who is free/available/open for a service AND wants the nearest/soonest/next/earliest slot or ASAP, extract serviceName, date, timeOfDay (morning/afternoon/evening/tonight), allProviders=true when no named specialist, and bookingFirstAvailable=true with timeSlot=null for the booking step. Multi-step execution is handled automatically — do NOT require a fixed start time.
- check_availability: READ — open times / who is free for a service on a date/time-of-day. Triggers: who/which/anyone/anybody + free|available|open|providers|stylists; "see who is open", "who can take {service}".
- book_appointment: MUTATE — book the earliest open slot. Triggers: book|find|get|reserve|schedule|grab + nearest|soonest|first|next|earliest|ASAP + slot|appointment|opening|time (or a service name). Set bookingFirstAvailable=true, timeSlot=null.
- Do NOT use book_appointment with a required timeSlot when the user says nearest/first/soonest/next available/earliest/ASAP — set bookingFirstAvailable=true instead.
- Do NOT use recommend_specialists when the user only asks who is free without asking for best/top rated.
- timeOfDay: morning (before 12:00), afternoon (12:00–17:00), evening (after 17:00); "tonight" counts as evening. Set timeOfDay when mentioned.
- timeFrom: earliest hour for flexible booking (e.g. "after 16:00" → timeFrom="16:00").
- allProviders: true when no specific specialist is named and the user asks who is free / any provider / team-wide.
- Examples:
  - "who's free tomorrow evening for permanent lashes, book the nearest slot" → serviceName=permanent lashes, date=tomorrow, timeOfDay=evening, allProviders=true, bookingFirstAvailable=true
  - "see who is open tomorrow afternoon for massage and find the nearest appointment" → serviceName=massage, timeOfDay=afternoon, bookingFirstAvailable=true
  - "which stylist is available tomorrow for massage and book the soonest slot" → serviceName=massage, allProviders=true, bookingFirstAvailable=true`;

/** Natural-language variants for check-provider + book-nearest compound flows. */
export const SIMILAR_CHECK_AND_BOOK_PROMPTS = [
  {
    id: 'whos-free-comma',
    prompt:
      "who's free tomorrow evening for permanent lashes, book the nearest slot",
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'stylist-soonest',
    prompt:
      'which stylist is available tomorrow for massage and book the soonest slot',
    serviceName: 'massage',
    notBeforeTime: null,
    timeOfDay: null,
  },
  {
    id: 'see-who-open-find',
    prompt:
      'see who is open tomorrow afternoon for permanent lips and find the nearest appointment',
    serviceName: 'permanent lips',
    notBeforeTime: '12:00',
    timeOfDay: 'afternoon',
  },
  {
    id: 'who-can-take-semicolon',
    prompt:
      'check who can take permanent lashes tomorrow evening; book next available slot',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'tonight-earliest',
    prompt: 'who is free tonight for massage and get the earliest slot',
    serviceName: 'massage',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'providers-for-lashes-comma',
    prompt:
      'check providers tomorrow evening for lashes, book nearest time slot',
    serviceName: 'lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'anyone-free-question',
    prompt:
      'anyone free tomorrow for permanent lashes? book the nearest opening',
    serviceName: 'permanent lashes',
    notBeforeTime: null,
    timeOfDay: null,
  },
  {
    id: 'availability-asap',
    prompt: 'who has availability tomorrow evening for massage and book ASAP',
    serviceName: 'massage',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'then-book-nearest',
    prompt:
      'which providers are free tomorrow for permanent lashes, then book nearest slot',
    serviceName: 'permanent lashes',
    notBeforeTime: null,
    timeOfDay: null,
  },
  {
    id: 'lookup-reserve',
    prompt:
      'look up who is available tomorrow evening for massage and reserve the nearest slot',
    serviceName: 'massage',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'anybody-open-schedule',
    prompt:
      'is anybody open tomorrow morning for massage and schedule the next available appointment',
    serviceName: 'massage',
    notBeforeTime: '00:00',
    timeOfDay: 'morning',
  },
  {
    id: 'which-specialist-free',
    prompt:
      'which specialist is free tomorrow evening for permanent lips and book earliest slot',
    serviceName: 'permanent lips',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
] as const;

/** Core check+book compound prompts (dashboard + customer eval). */
export const CHECK_AND_BOOK_CORE_PROMPTS = [
  {
    id: 'free-comma-nearest-slot',
    prompt:
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'available-and-nearest-slot',
    prompt:
      'Who is available tomorrow evening for massage and book the nearest slot',
    serviceName: 'massage',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'open-and-book-nearest',
    prompt:
      'who is open tomorrow morning for massage and book the nearest appointment',
    serviceName: 'massage',
    notBeforeTime: '00:00',
    timeOfDay: 'morning',
  },
  {
    id: 'check-providers-comma-book',
    prompt:
      'check providers for permanent lips tomorrow afternoon, book nearest slot',
    serviceName: 'permanent lips',
    notBeforeTime: '12:00',
    timeOfDay: 'afternoon',
  },
  {
    id: 'quoted-service-and-book',
    prompt:
      'check who is free tomorrow for "Permanent lashes" and book the nearest slot',
    serviceName: 'Permanent lashes',
    notBeforeTime: null,
    timeOfDay: null,
  },
  {
    id: 'asap-booking-wording',
    prompt:
      'check who is available tomorrow for massage and book first available slot',
    serviceName: 'massage',
    notBeforeTime: null,
    timeOfDay: null,
  },
] as const;

export type CheckAndBookEvalScenario = {
  id: string;
  surface: Extract<CommandSurface, 'dashboard' | 'customer'>;
  prompt: string;
  serviceName: string;
  notBeforeTime?: string | null;
  timeOfDay?: string | null;
};

/** Golden eval scenarios for check+book compound decomposition (ai-cmd-h1.3). */
export const CHECK_AND_BOOK_EVAL_SCENARIOS: CheckAndBookEvalScenario[] = [
  ...(['dashboard', 'customer'] as const).flatMap((surface) =>
    [...CHECK_AND_BOOK_CORE_PROMPTS, ...SIMILAR_CHECK_AND_BOOK_PROMPTS].map(
      (entry) => ({
        id: `${surface}-${entry.id}`,
        surface,
        prompt: entry.prompt,
        serviceName: entry.serviceName,
        notBeforeTime: entry.notBeforeTime,
        timeOfDay: entry.timeOfDay,
      }),
    ),
  ),
];

export type FlexibleBookingEvalScenario = {
  id: string;
  prompt: string;
  /** LLM mislabel to disambiguate (defaults to unknown for pure rescue). */
  rescueFromAction?: string;
  rescuedAction: string;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
};

/** Single-intent flexible booking rescue/disambiguation golden cases (ai-cmd-h1.3). */
export const FLEXIBLE_BOOKING_EVAL_SCENARIOS: FlexibleBookingEvalScenario[] = [
  {
    id: 'unknown-book-nearest-slot',
    prompt: 'book the nearest slot for massage tomorrow evening',
    rescuedAction: 'book_nearest_slot',
    rescueReason: 'nearest_slot',
  },
  {
    id: 'unknown-check-providers-free',
    prompt: 'check who is free tomorrow evening for permanent lashes',
    rescuedAction: 'check_providers_for_service',
    rescueReason: 'providers_for_service',
  },
  {
    id: 'misclassified-first-available',
    prompt: 'Book the nearest available slot for massage tomorrow',
    rescueFromAction: 'create_booking',
    rescuedAction: 'create_booking',
    rescueReason: 'booking_first_available',
    paramsPartial: { bookingFirstAvailable: true },
  },
  {
    id: 'misclassified-check-book-compound',
    prompt:
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
    rescueFromAction: 'create_booking',
    rescuedAction: 'create_booking',
    rescueReason: 'check_and_book_compound',
    paramsPartial: {
      bookingFirstAvailable: true,
      allProviders: true,
      timeOfDay: 'evening',
    },
  },
  {
    id: 'unknown-first-available-asap',
    prompt: 'Book first available permanent lashes tomorrow evening',
    rescuedAction: 'create_booking',
    rescueReason: 'create_booking_pattern',
    paramsPartial: { bookingFirstAvailable: true },
  },
  {
    id: 'misclassified-soonest-any-provider',
    prompt:
      'Book the soonest slot for massage tomorrow evening on any provider',
    rescueFromAction: 'create_booking',
    rescuedAction: 'create_booking',
    rescueReason: 'booking_first_available',
    paramsPartial: { bookingFirstAvailable: true, allProviders: true },
  },
  {
    id: 'unknown-earliest-opening',
    prompt: 'get the earliest slot for permanent lips tomorrow evening',
    rescuedAction: 'book_nearest_slot',
    rescueReason: 'nearest_slot',
  },
  {
    id: 'misclassified-reschedule-nearest',
    prompt: 'Move to June 11 nearest free time for Maria',
    rescueFromAction: 'reschedule_booking',
    rescuedAction: 'reschedule_booking',
    rescueReason: 'booking_first_available',
    paramsPartial: { bookingFirstAvailable: true },
  },
];
