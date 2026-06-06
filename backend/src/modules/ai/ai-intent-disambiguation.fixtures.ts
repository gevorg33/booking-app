import type { CommandSurface } from './ai-command-registry.types.js';

/** Documented availability/booking intent matrix (ai-cmd-h1.4). */
export const AVAILABILITY_INTENT_MATRIX = [
  {
    userGoal: 'Named provider open slots at a time or day',
    namedProvider: true,
    bookVerb: false,
    dashboard: 'check_availability',
    customer: 'check_availability',
    public: 'check_availability',
    examples: [
      'is Gevorg available for massage tomorrow at 09:00',
      'what slots does Maria have on Friday',
    ],
  },
  {
    userGoal: 'Team-wide bookable windows for a service (customer booking)',
    namedProvider: false,
    bookVerb: false,
    dashboard: 'check_providers_for_service',
    customer: 'check_providers_for_service',
    public: 'check_availability',
    examples: [
      'who is free tomorrow evening for permanent lashes',
      'who has availability for massage tomorrow',
    ],
  },
  {
    userGoal: 'Staff catalog / schedule assignment (who performs or is scheduled)',
    namedProvider: false,
    bookVerb: false,
    dashboard: 'lookup_service_assignment',
    customer: null,
    public: null,
    examples: [
      'who is doing facemassage today',
      'who can perform color services',
    ],
  },
  {
    userGoal: 'Book at a fixed time',
    namedProvider: 'optional',
    bookVerb: true,
    dashboard: 'create_booking',
    customer: 'create_booking',
    public: 'book_appointment',
    examples: ['book massage with Gevorg tomorrow at 10:00'],
  },
  {
    userGoal: 'Book earliest open slot (flexible)',
    namedProvider: 'optional',
    bookVerb: true,
    dashboard: 'book_nearest_slot / create_booking + bookingFirstAvailable',
    customer: 'book_nearest_slot',
    public: 'book_appointment + bookingFirstAvailable',
    examples: ['book the nearest slot for massage tomorrow evening'],
  },
] as const;

/** Dashboard classifier disambiguation (staff ops + customer checkout simulation). */
export const DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES = `- Availability vs assignment vs booking (dashboard):
- check_availability: READ — one NAMED provider's open slots or schedule blocks. Requires employeeName (or unambiguous provider from context). Triggers: "is {provider} available", "{provider}'s slots", "does {provider} have time at {HH:MM}". Set serviceName, date, timeSlot/timeOfDay when mentioned. NEVER use for team-wide "who is free" without a named provider.
- check_providers_for_service: READ — team-wide bookable windows for a service (customer checkout simulation). Triggers: who/which/anyone/anybody + free|available|open + service; "check providers for {service}"; "who can take {service}". Set serviceName, date, timeOfDay, allProviders=true, employeeName=null. NOT lookup_service_assignment.
- lookup_service_assignment: READ — staff catalog assignment and who is scheduled on service blocks. Triggers: "who is doing {service}", "who can perform {service}", "who is working on {service} today", "which providers are assigned to {service}". Set assignmentLookup=providers_for_service, serviceName, date when mentioned. NOT for customer-style "who is free for lashes tomorrow evening" (use check_providers_for_service).
- create_booking: MUTATE — reserve a slot. Requires book|schedule|reserve OR follow-up after availability with a concrete timeSlot. NEVER for read-only availability questions.
- book_nearest_slot: MUTATE — flexible earliest slot (bookingFirstAvailable=true, timeSlot=null). Use when user says nearest/soonest/first available/ASAP without a fixed time.
- Disambiguation examples:
  - "is Gevorg available at 9 for massage tomorrow" → check_availability, employeeName=Gevorg
  - "who is free tomorrow evening for permanent lashes" → check_providers_for_service, allProviders=true
  - "who is doing facemassage today" → lookup_service_assignment
  - "book massage with Gevorg tomorrow at 10" → create_booking, timeSlot=10:00
  - "who is free for lashes and book nearest slot" → compound (check_providers_for_service + book_nearest_slot) — not create_booking alone`;

/** Customer + consumer app classifier disambiguation. */
export const CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES = `- Availability vs booking (customer / consumer app):
- check_availability: READ — one NAMED specialist's open times. Set employeeName, serviceName, date, timeSlot/timeOfDay. NOT for team-wide "who is free" (use check_providers_for_service).
- check_providers_for_service: READ — team-wide who is free/available/open for a service on a date/time-of-day. Set serviceName, date, timeOfDay, allProviders=true, employeeName=null.
- create_booking: MUTATE — logged-in booking at a fixed time. Omit when only asking who is free.
- book_nearest_slot: MUTATE — flexible earliest slot for the consumer checkout path.
- Do NOT use lookup_service_assignment (dashboard-only staff catalog).
- Do NOT use public-only actions (list_providers, recommend_specialists) on the logged-in customer surface unless the user is on anonymous public discovery.
- Examples:
  - "is Karo available tomorrow at 17:00 for lashes" → check_availability
  - "who is free tomorrow for massage" → check_providers_for_service
  - "book nearest slot for massage tomorrow evening" → book_nearest_slot`;

/** Public booking page classifier disambiguation. */
export const PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES = `- Availability vs booking (public booking page):
- check_availability: READ — open times OR team-wide who is free for a service. Named specialist → set employeeName; team-wide → allProviders=true, employeeName=null. Set serviceName/serviceCategory, date, timeOfDay, weekdays/dateFrom/dateTo.
- recommend_specialists: READ — best/top/highest-rated specialists only (not plain availability).
- book_appointment: MUTATE — reserve/schedule. bookingFirstAvailable=true for nearest/soonest/first/ASAP with timeSlot=null.
- list_providers: READ — who works here (not slots, not ratings).
- Do NOT use check_providers_for_service or book_nearest_slot (customer/dashboard action names) — public surface uses check_availability and book_appointment only.
- Examples:
  - "free slots on Monday for Gevorg" → check_availability, employeeName=Gevorg
  - "who is free tomorrow evening for permanent lashes" → check_availability, allProviders=true
  - "book nearest facemassage on any specialist" → book_appointment, bookingFirstAvailable=true, allProviders=true`;

export type AvailabilityDisambiguationScenario = {
  id: string;
  surface: Extract<CommandSurface, 'dashboard' | 'customer' | 'public'>;
  prompt: string;
  rescueFromAction?: string;
  expectedAction: string;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  /** When true, eval expects no rescue (classifier-only documentation). */
  classifierOnly?: boolean;
};

/** Golden disambiguation scenarios for eval + unit tests (ai-cmd-h1.4). */
export const AVAILABILITY_DISAMBIGUATION_SCENARIOS: AvailabilityDisambiguationScenario[] =
  [
    {
      id: 'dashboard-named-check-availability',
      surface: 'dashboard',
      prompt: 'is Gevorg available for massage tomorrow at 09:00',
      expectedAction: 'check_availability',
      rescueReason: 'check_availability_pattern',
    },
    {
      id: 'dashboard-team-check-providers',
      surface: 'dashboard',
      prompt: 'who is free tomorrow evening for permanent lashes',
      expectedAction: 'check_providers_for_service',
      rescueReason: 'providers_for_service',
    },
    {
      id: 'dashboard-staff-lookup-assignment',
      surface: 'dashboard',
      prompt: 'who is doing facemassage today',
      expectedAction: 'lookup_service_assignment',
      rescueReason: 'availability_query',
    },
    {
      id: 'dashboard-create-to-check-providers',
      surface: 'dashboard',
      prompt: 'who is free tomorrow for massage',
      rescueFromAction: 'create_booking',
      expectedAction: 'check_providers_for_service',
      rescueReason: 'create_booking_to_check_providers',
    },
    {
      id: 'dashboard-lookup-to-check-providers',
      surface: 'dashboard',
      prompt: 'who is available tomorrow evening for lashes',
      rescueFromAction: 'lookup_service_assignment',
      expectedAction: 'check_providers_for_service',
      rescueReason: 'lookup_to_check_providers',
    },
    {
      id: 'dashboard-check-avail-to-named',
      surface: 'dashboard',
      prompt: 'check availability for Gevorg tomorrow at 14:00 for massage',
      expectedAction: 'check_availability',
      rescueReason: 'check_availability_pattern',
    },
    {
      id: 'dashboard-fixed-time-booking',
      surface: 'dashboard',
      prompt: 'book massage with Gevorg tomorrow at 10:00',
      rescueFromAction: 'unknown',
      expectedAction: 'create_booking',
      rescueReason: 'create_booking_pattern',
    },
    {
      id: 'customer-team-check-providers',
      surface: 'customer',
      prompt: 'who has availability tomorrow for massage',
      expectedAction: 'check_providers_for_service',
      rescueReason: 'providers_for_service',
    },
    {
      id: 'customer-named-check-availability',
      surface: 'customer',
      prompt: 'is Karo available tomorrow at 17:00 for lashes',
      rescueFromAction: 'create_booking',
      expectedAction: 'check_availability',
      rescueReason: 'create_booking_to_check_availability',
    },
    {
      id: 'customer-flexible-book-nearest',
      surface: 'customer',
      prompt: 'book the nearest slot for massage tomorrow evening',
      expectedAction: 'book_nearest_slot',
      rescueReason: 'nearest_slot',
    },
    {
      id: 'public-team-check-availability',
      surface: 'public',
      prompt: 'who is free tomorrow evening for permanent lashes',
      expectedAction: 'check_availability',
      classifierOnly: true,
    },
    {
      id: 'public-named-check-availability',
      surface: 'public',
      prompt: 'free slots on Monday for Gevorg for massage',
      expectedAction: 'check_availability',
      classifierOnly: true,
    },
    {
      id: 'public-flexible-book',
      surface: 'public',
      prompt: 'book nearest facemassage on any specialist after 16:00',
      expectedAction: 'book_appointment',
      classifierOnly: true,
    },
  ];
