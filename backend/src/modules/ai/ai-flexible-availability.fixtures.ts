import type { AvailabilityWindow } from './ai-flexible-availability.util.js';

/** Dashboard check_availability OR windows (ai-cmd-ext-1.3). */
export const DASHBOARD_FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES = `- check_availability (dashboard): when the user asks about one NAMED provider's open slots with OR phrasing, set availabilityWindows with one object per alternative (same shape as public/customer). Apply filterSlotsByTimeOfDay per window. Optional maxPrice/serviceRank filter catalog before slot scan when combined with budget/rank discovery language.
- check_providers_for_service (dashboard): team-wide "who is free" with OR phrasing — same availabilityWindows shape as check_availability on public/customer. Set allProviders=true, employeeName=null, serviceCategory/serviceName. Example: "Who is free tomorrow evening or Friday afternoon for massage?" → check_providers_for_service, serviceCategory=massage, allProviders=true, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}].
- availabilityWindows: array of OR alternatives — each entry may include date, weekdays, timeOfDay (morning | afternoon | evening), timeSlot (HH:MM), employeeName (per-window specialist). AND weekdays ("Monday and Friday afternoon") → single window with weekdays array, NOT availabilityWindows.
- create_booking with bookingFirstAvailable across OR windows inherits availabilityWindows from session when follow-up omits dates.`;

/** Customer/public classifier rules for flexible OR availability windows (avail-1.2 / avail-1.10). */
export const FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES = `- availabilityWindows: array of OR alternatives — each entry is one date/time window scanned independently for open slots. Use when the user says "tomorrow evening OR Friday afternoon", "either Monday morning or Wednesday morning", or comma-separated day+timeOfDay pairs. Each window object may include: date (DD/MM/YYYY), weekdays (["monday", "friday", etc.]), timeOfDay (morning | afternoon | evening; tonight = evening), timeFrom (HH:MM earliest — "after 5" / "after work" → 17:00 on each OR window), timeTo (HH:MM latest — lunch → 12:00–14:00 narrow afternoon), timeSlot (HH:MM fixed start — use instead of timeOfDay when the user names a clock time like "at 6pm"), employeeName (named specialist for that window only — "Karo tomorrow evening or Mary Friday afternoon"). Set serviceName or serviceCategory on the top-level params; repeat is NOT required inside each window.
- check_availability (public booking web): READ — open times / who is free for a service. When OR phrasing appears, set availabilityWindows with one object per alternative instead of a single timeOfDay that drops the second window. allProviders=true unless one specialist is named. Legacy single-window prompts may still use date/weekdays/timeOfDay alone — post-LLM rescue expands OR phrases when the classifier misses availabilityWindows.
- check_providers_for_service (customer app): same OR window semantics as check_availability — use check_providers_for_service on customer surface, not check_availability.
- book_appointment (public) / book_nearest_slot (customer): when the user wants the soonest/nearest slot across OR windows, set bookingFirstAvailable=true, timeSlot=null, and availabilityWindows with each alternative. Pick earliest bookable slot across windows downstream.
- AND vs OR (critical): "Monday and Friday afternoon" → ONE window with weekdays=["monday","friday"] and timeOfDay=afternoon — NOT availabilityWindows. "Monday morning or Wednesday morning" → availabilityWindows with two entries, each with its own weekday + timeOfDay.
- Combine with maxPrice when the user states a budget ("tomorrow evening or Friday afternoon, I have $50") — set maxPrice on params AND availabilityWindows; catalog filter runs before slot scan. When nothing matches the budget, clarify with closest options above the ceiling — do not silently scan over-budget services.
- Overlap clarify: when tomorrow lands on a named weekday (tomorrow IS Friday), still set both OR windows — downstream handlers merge the calendar day and label each timeOfDay section honestly.
- NOT gift card balance as maxPrice ("$50 gift card, haircut tomorrow or Friday") — gift card checkout, not availabilityWindows budget filter.
- NOT recommend_specialists when the user asks who is free / open slots without best-rated/provider-ranking language — use check_availability or check_providers_for_service with availabilityWindows instead.
- Budget + OR compounds (one message): filter catalog by maxPrice → check both windows → optional book nearest with bookingFirstAvailable=true. Public: check_availability then book_appointment. Customer: check_providers_for_service then book_nearest_slot.
- Examples:
  - "I want a haircut tomorrow evening or Friday afternoon" → check_availability, serviceCategory=haircut, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Massage Monday morning or Wednesday morning" → check_availability, serviceCategory=massage, availabilityWindows=[{weekdays: [monday], timeOfDay: morning}, {weekdays: [wednesday], timeOfDay: morning}]
  - "Either Monday morning or Wednesday morning for color" → check_availability, serviceCategory=color, availabilityWindows=[{weekdays: [monday], timeOfDay: morning}, {weekdays: [wednesday], timeOfDay: morning}]
  - "Facial tomorrow, Friday afternoon, or Saturday morning" → check_availability, serviceCategory=facial, availabilityWindows=[{date: tomorrow}, {weekdays: [friday], timeOfDay: afternoon}, {weekdays: [saturday], timeOfDay: morning}]
  - "Who's free tomorrow evening for massage?" → check_availability, serviceCategory=massage, date=tomorrow, timeOfDay=evening — single window (no availabilityWindows required)
  - "Any slots Friday afternoon for a facial?" → check_availability, serviceCategory=facial, weekdays=[friday], timeOfDay=afternoon — single window
  - "Monday and Friday afternoon for color" → check_availability, serviceCategory=color, weekdays=[monday, friday], timeOfDay=afternoon — AND weekdays, NOT OR
  - "Book lashes tomorrow evening or Saturday afternoon, whichever is sooner" → book_appointment, serviceCategory=lash, bookingFirstAvailable=true, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [saturday], timeOfDay: afternoon}]
  - "I want a haircut tomorrow evening or Friday afternoon, I have $50" → check_availability, serviceCategory=haircut, maxPrice=50, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Massage under $80 tomorrow or Thursday evening" → check_availability, serviceCategory=massage, maxPrice=80, availabilityWindows=[{date: tomorrow}, {weekdays: [thursday], timeOfDay: evening}]
  - "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest" → compound: check_availability then book_appointment with maxPrice=50 and the same availabilityWindows
  - "Show haircuts under $50, then check tomorrow evening or Friday afternoon" → compound: list_services with maxPrice=50 then check_availability with the same availabilityWindows
  - "Best premium facial under $100 tomorrow or Saturday" → check_availability, serviceCategory=facial, serviceRank=highest_price, maxPrice=100, availabilityWindows=[{date: tomorrow}, {weekdays: [saturday]}]
  - "Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ կեսօրին" → check_availability, serviceCategory=haircut, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Хочу стрижку завтра вечером или в пятницу днём, у меня 50 долларов" → check_availability, serviceCategory=haircut, maxPrice=50, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Haircut vaghva yereko yan kam urbat kesorin" → check_availability, serviceCategory=haircut, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Tomorrow at 6pm or Friday at 2pm for a haircut" → check_availability, serviceCategory=haircut, availabilityWindows=[{date: tomorrow, timeSlot: 18:00}, {weekdays: [friday], timeSlot: 14:00}]
  - "Karo tomorrow evening or Mary Friday afternoon for massage" → check_availability, serviceCategory=massage, availabilityWindows=[{employeeName: Karo, date: tomorrow, timeOfDay: evening}, {employeeName: Mary, weekdays: [friday], timeOfDay: afternoon}]
  - "Facial after 5 tomorrow or Friday" → check_availability, serviceCategory=facial, availabilityWindows=[{date: tomorrow, timeFrom: 17:00}, {weekdays: [friday], timeFrom: 17:00}]
  - "Manicure tomorrow lunch or Friday lunch" → check_availability, serviceCategory=manicure, availabilityWindows=[{date: tomorrow, timeOfDay: afternoon, timeFrom: 12:00, timeTo: 14:00}, {weekdays: [friday], timeOfDay: afternoon, timeFrom: 12:00, timeTo: 14:00}]
  - "Lashes ASAP or Saturday if not" → book_appointment / book_nearest_slot, serviceCategory=lash, bookingFirstAvailable=true, availabilityWindows=[{date: tomorrow}, {weekdays: [saturday], timeOfDay: afternoon}]
  - "Evening or weekend slots for a facial" → check_providers_for_service (customer), serviceCategory=facial, availabilityWindows=[{timeOfDay: evening}, {weekdays: [saturday, sunday]}]
  - "Need massage tomorrow PM or Sun AM" → check_availability / check_providers_for_service, serviceCategory=massage, availabilityWindows=[{date: tomorrow, timeOfDay: afternoon}, {weekdays: [sunday], timeOfDay: morning}]
  - Session append (multi-turn): T1 "I want a haircut tomorrow evening" then T2 "or Friday afternoon works too" → append second window; availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - Session drop (multi-turn): T1 "Haircut tomorrow or Friday afternoon" then T2 "Friday only" → replace with single window; availabilityWindows=[{weekdays: [friday], timeOfDay: afternoon}]
  - Session after-budget (multi-turn): T1 "Show haircuts under $50" then T2 "Check tomorrow evening or Friday afternoon for those" → carry maxPrice + availabilityWindows
  - "Any stylist tomorrow evening or Friday afternoon for a haircut" → check_availability / check_providers_for_service, serviceCategory=haircut, allProviders=true, availabilityWindows=[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]
  - "Karo tomorrow evening or anyone Friday afternoon for massage" → check_availability / check_providers_for_service, serviceCategory=massage, availabilityWindows=[{employeeName: Karo, date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}] — window B is team-wide fallback (no employeeName)
  - "Same person tomorrow or Friday afternoon for color" → check_availability / check_providers_for_service, serviceCategory=color, sameProviderAcrossWindows=true, availabilityWindows=[{date: tomorrow}, {weekdays: [friday], timeOfDay: afternoon}] — reuse session employeeName when set; scan both windows for one specialist
  - "Haircut tomorrow evening or Friday afternoon under $50 — nothing open in either window" → check_availability, maxPrice=50, availabilityWindows=[...]; budget filter passes but per-window summary uses availabilityNoSlotsBudget (not budget_no_match clarify)
  - "I want a haircut tomorrow evening or Friday afternoon" (no slots in either OR window) → check_availability; grouped per-window no-slot labels; append nearest alternative opening when one exists beyond the requested windows
  - "Facial tomorrow evening or Saturday afternoon" (only Saturday afternoon has slots) → check_availability; label each OR section; show Saturday afternoon openings and mark tomorrow evening empty
  - "Best specialist tomorrow or Friday for massage" → recommend_specialists when "best rated/top specialist" + provider focus; OR availabilityWindows when the user asks who is free without ranking language
- Time variants (sections I–M): tonight or tomorrow morning; Saturday afternoon or Sunday morning; voice shorthand ("tomorrow eve or fri afternoon"); ASAP with fallback window; session follow-ups append or replace OR windows; allProviders across OR when any stylist is fine; clarify when neither window has slots or only one window has openings`;

export type AvailabilityWindowParseScenario = {
  id: string;
  prompt: string;
  expectedWindows: AvailabilityWindow[];
};

export type AvailabilityWindowNormalizeScenario = {
  id: string;
  params: Record<string, unknown>;
  expectedWindows: AvailabilityWindow[];
};

/** OR window parse golden rows (avail-1.1 / ai-cmd-avail section A). */
export const AVAILABILITY_WINDOW_PARSE_SCENARIOS: AvailabilityWindowParseScenario[] =
  [
    {
      id: 'avail-or-tomorrow-friday-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-either-morning-en',
      prompt: 'Massage Monday morning or Wednesday morning',
      expectedWindows: [
        { weekdays: ['monday'], timeOfDay: 'morning' },
        { weekdays: ['wednesday'], timeOfDay: 'morning' },
      ],
    },
    {
      id: 'avail-three-way-or-en',
      prompt: 'Facial tomorrow, Friday afternoon, or Saturday morning',
      expectedWindows: [
        { date: 'tomorrow' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
        { weekdays: ['saturday'], timeOfDay: 'morning' },
      ],
    },
    {
      id: 'avail-or-book-en',
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['saturday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-budget-or-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-budget-under-or-en',
      prompt: 'Massage under $80 tomorrow or Thursday evening',
      expectedWindows: [
        { date: 'tomorrow' },
        { weekdays: ['thursday'], timeOfDay: 'evening' },
      ],
    },
    {
      id: 'avail-either-prefix-en',
      prompt: 'Either Monday morning or Wednesday morning for color',
      expectedWindows: [
        { weekdays: ['monday'], timeOfDay: 'morning' },
        { weekdays: ['wednesday'], timeOfDay: 'morning' },
      ],
    },
    {
      id: 'avail-or-hy',
      prompt: 'Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ կեսօրին',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-or-ru',
      prompt:
        'Хочу стрижку завтра вечером или в пятницу днём, у меня 50 долларов',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-or-translit-en',
      prompt: 'Haircut vaghva yereko yan kam urbat kesorin',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-or-specific-times-en',
      prompt: 'Tomorrow at 6pm or Friday at 2pm for a haircut',
      expectedWindows: [
        { date: 'tomorrow', timeSlot: '18:00' },
        { weekdays: ['friday'], timeSlot: '14:00' },
      ],
    },
    {
      id: 'avail-or-with-provider-en',
      prompt: 'Karo tomorrow evening or Mary Friday afternoon for massage',
      expectedWindows: [
        { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
        { employeeName: 'Mary', weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-after-work-en',
      prompt: 'Facial after 5 tomorrow or Friday',
      expectedWindows: [
        { date: 'tomorrow', timeFrom: '17:00' },
        { weekdays: ['friday'], timeFrom: '17:00' },
      ],
    },
    {
      id: 'avail-lunch-or-en',
      prompt: 'Manicure tomorrow lunch or Friday lunch',
      expectedWindows: [
        {
          date: 'tomorrow',
          timeOfDay: 'afternoon',
          timeFrom: '12:00',
          timeTo: '14:00',
        },
        {
          weekdays: ['friday'],
          timeOfDay: 'afternoon',
          timeFrom: '12:00',
          timeTo: '14:00',
        },
      ],
    },
    {
      id: 'avail-voice-asap-or-en',
      prompt: 'Lashes ASAP or Saturday if not',
      expectedWindows: [
        { date: 'tomorrow' },
        { weekdays: ['saturday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-voice-chip-en',
      prompt: 'Evening or weekend slots for a facial',
      expectedWindows: [
        { timeOfDay: 'evening' },
        { weekdays: ['saturday', 'sunday'] },
      ],
    },
    {
      id: 'avail-imperative-en',
      prompt: 'Need massage tomorrow PM or Sun AM',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'afternoon' },
        { weekdays: ['sunday'], timeOfDay: 'morning' },
      ],
    },
    {
      id: 'avail-or-any-provider-en',
      prompt: 'Any stylist tomorrow evening or Friday afternoon for a haircut',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-or-named-fallback-en',
      prompt: 'Karo tomorrow evening or anyone Friday afternoon for massage',
      expectedWindows: [
        { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-or-same-provider-en',
      prompt: 'Same person tomorrow or Friday afternoon for color',
      expectedWindows: [
        { date: 'tomorrow' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-budget-blocks-all-en',
      prompt:
        'Haircut tomorrow evening or Friday afternoon under $50 — nothing open in either window',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-neither-window-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-partial-one-window-en',
      prompt: 'Facial tomorrow evening or Saturday afternoon',
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['saturday'], timeOfDay: 'afternoon' },
      ],
    },
  ];

/** Single-window prompts must not be split into OR windows. */
export const AVAILABILITY_WINDOW_SINGLE_SCENARIOS: Array<{
  id: string;
  prompt: string;
}> = [
  {
    id: 'avail-single-tomorrow-evening-en',
    prompt: "Who's free tomorrow evening for massage?",
  },
  {
    id: 'avail-single-friday-afternoon-en',
    prompt: 'Any slots Friday afternoon for a facial?',
  },
  {
    id: 'avail-no-or-and-en',
    prompt: 'Monday and Friday afternoon for color',
  },
  {
    id: 'avail-not-gift-card-en',
    prompt: '$50 gift card, haircut tomorrow or Friday',
  },
];

/** Legacy param normalization golden rows (avail-1.1). */
export const AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS: AvailabilityWindowNormalizeScenario[] =
  [
    {
      id: 'avail-legacy-single-date-timeofday',
      params: { date: 'tomorrow', timeOfDay: 'evening' },
      expectedWindows: [{ date: 'tomorrow', timeOfDay: 'evening' }],
    },
    {
      id: 'avail-legacy-weekday-timeofday',
      params: { weekdays: ['friday'], timeOfDay: 'afternoon' },
      expectedWindows: [{ weekdays: ['friday'], timeOfDay: 'afternoon' }],
    },
    {
      id: 'avail-legacy-and-weekdays',
      params: {
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
      expectedWindows: [
        {
          weekdays: ['monday', 'friday'],
          timeOfDay: 'afternoon',
        },
      ],
    },
    {
      id: 'avail-explicit-windows-array',
      params: {
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['fri'], timeOfDay: 'afternoon' },
        ],
      },
      expectedWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-empty-params',
      params: {},
      expectedWindows: [],
    },
  ];

export type AvailabilityWindowEnrichmentScenario = {
  id: string;
  prompt: string;
  params: Record<string, unknown>;
  expectedParams: Record<string, unknown>;
};

/** Post-LLM enrichment golden rows (avail-1.3). */
export const AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS: AvailabilityWindowEnrichmentScenario[] =
  [
    {
      id: 'avail-not-single-timeofday-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      params: {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-or-tomorrow-friday-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      params: { serviceCategory: 'haircut' },
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-budget-or-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      params: { serviceCategory: 'haircut', maxPrice: 50 },
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-budget-under-or-en',
      prompt: 'Massage under $80 tomorrow or Thursday evening',
      params: { serviceCategory: 'massage', maxPrice: 80 },
      expectedParams: {
        serviceCategory: 'massage',
        maxPrice: 80,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
    },
    {
      id: 'avail-no-or-and-en',
      prompt: 'Monday and Friday afternoon for color',
      params: {
        serviceCategory: 'color',
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
      expectedParams: {
        serviceCategory: 'color',
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
    },
    {
      id: 'avail-single-tomorrow-evening-en',
      prompt: "Who's free tomorrow evening for massage?",
      params: {
        serviceCategory: 'massage',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      expectedParams: {
        serviceCategory: 'massage',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
    },
    {
      id: 'avail-or-specific-times-en',
      prompt: 'Tomorrow at 6pm or Friday at 2pm for a haircut',
      params: { serviceCategory: 'haircut' },
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeSlot: '18:00' },
          { weekdays: ['friday'], timeSlot: '14:00' },
        ],
      },
    },
    {
      id: 'avail-or-with-provider-en',
      prompt: 'Karo tomorrow evening or Mary Friday afternoon for massage',
      params: { serviceCategory: 'massage' },
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
          {
            employeeName: 'Mary',
            weekdays: ['friday'],
            timeOfDay: 'afternoon',
          },
        ],
      },
    },
    {
      id: 'avail-dashboard-parity-en',
      prompt: 'Who is free tomorrow evening or Friday afternoon for massage?',
      params: { serviceCategory: 'massage' },
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-after-work-en',
      prompt: 'Facial after 5 tomorrow or Friday',
      params: { serviceCategory: 'facial' },
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: [
          { date: 'tomorrow', timeFrom: '17:00' },
          { weekdays: ['friday'], timeFrom: '17:00' },
        ],
      },
    },
    {
      id: 'avail-lunch-or-en',
      prompt: 'Manicure tomorrow lunch or Friday lunch',
      params: { serviceCategory: 'manicure' },
      expectedParams: {
        serviceCategory: 'manicure',
        availabilityWindows: [
          {
            date: 'tomorrow',
            timeOfDay: 'afternoon',
            timeFrom: '12:00',
            timeTo: '14:00',
          },
          {
            weekdays: ['friday'],
            timeOfDay: 'afternoon',
            timeFrom: '12:00',
            timeTo: '14:00',
          },
        ],
      },
    },
    {
      id: 'avail-voice-asap-or-en',
      prompt: 'Lashes ASAP or Saturday if not',
      params: { serviceCategory: 'lash' },
      expectedParams: {
        serviceCategory: 'lash',
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-voice-chip-en',
      prompt: 'Evening or weekend slots for a facial',
      params: { serviceCategory: 'facial' },
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: [
          { timeOfDay: 'evening' },
          { weekdays: ['saturday', 'sunday'] },
        ],
      },
    },
    {
      id: 'avail-imperative-en',
      prompt: 'Need massage tomorrow PM or Sun AM',
      params: { serviceCategory: 'massage' },
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'afternoon' },
          { weekdays: ['sunday'], timeOfDay: 'morning' },
        ],
      },
    },
    {
      id: 'avail-or-any-provider-en',
      prompt: 'Any stylist tomorrow evening or Friday afternoon for a haircut',
      params: { serviceCategory: 'haircut' },
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-or-named-fallback-en',
      prompt: 'Karo tomorrow evening or anyone Friday afternoon for massage',
      params: { serviceCategory: 'massage' },
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [
          { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-or-same-provider-en',
      prompt: 'Same person tomorrow or Friday afternoon for color',
      params: { serviceCategory: 'color', employeeName: 'Alice' },
      expectedParams: {
        serviceCategory: 'color',
        employeeName: 'Alice',
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-budget-blocks-all-en',
      prompt:
        'Haircut tomorrow evening or Friday afternoon under $50 — nothing open in either window',
      params: { serviceCategory: 'haircut', maxPrice: 50 },
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-neither-window-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      params: { serviceCategory: 'haircut' },
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    {
      id: 'avail-partial-one-window-en',
      prompt: 'Facial tomorrow evening or Saturday afternoon',
      params: { serviceCategory: 'facial' },
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
    },
  ];

/** Handler golden rows for public check_availability window scan (avail-1.5). */
export type FlexibleAvailabilityCheckScenario = {
  id: string;
  slots: Array<{ startTime: string; endTime: string }>;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
  expectedTimes: string[];
};

export const FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS: FlexibleAvailabilityCheckScenario[] =
  [
    {
      id: 'avail-filter-evening-en',
      slots: [
        {
          startTime: '2026-06-10T09:00:00.000Z',
          endTime: '2026-06-10T09:30:00.000Z',
        },
        {
          startTime: '2026-06-10T17:00:00.000Z',
          endTime: '2026-06-10T17:30:00.000Z',
        },
        {
          startTime: '2026-06-10T18:00:00.000Z',
          endTime: '2026-06-10T18:30:00.000Z',
        },
      ],
      timeOfDay: 'evening',
      expectedTimes: ['17:00', '18:00'],
    },
    {
      id: 'avail-filter-afternoon-en',
      slots: [
        {
          startTime: '2026-06-13T12:00:00.000Z',
          endTime: '2026-06-13T12:30:00.000Z',
        },
        {
          startTime: '2026-06-13T14:00:00.000Z',
          endTime: '2026-06-13T14:30:00.000Z',
        },
        {
          startTime: '2026-06-13T17:30:00.000Z',
          endTime: '2026-06-13T18:00:00.000Z',
        },
      ],
      timeOfDay: 'afternoon',
      expectedTimes: ['12:00', '14:00'],
    },
    {
      id: 'avail-filter-none-without-timeofday',
      slots: [
        {
          startTime: '2026-06-10T17:00:00.000Z',
          endTime: '2026-06-10T17:30:00.000Z',
        },
      ],
      timeOfDay: null,
      expectedTimes: ['17:00'],
    },
  ];

export type FlexibleAvailabilityWindowLabelScenario = {
  id: string;
  window: {
    dateKeys: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
  };
  todayDateKey: string;
  expectedLabel: string;
};

export const FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS: FlexibleAvailabilityWindowLabelScenario[] =
  [
    {
      id: 'avail-label-tomorrow-evening-en',
      window: {
        dateKeys: ['2026-06-11'],
        timeOfDay: 'evening',
      },
      todayDateKey: '2026-06-10',
      expectedLabel: 'Tomorrow evening',
    },
    {
      id: 'avail-label-friday-afternoon-en',
      window: {
        dateKeys: ['2026-06-12', '2026-06-19'],
        timeOfDay: 'afternoon',
      },
      todayDateKey: '2026-06-10',
      expectedLabel: 'Friday afternoon',
    },
  ];

export type FlexibleAvailabilityNearestWindowScenario = {
  id: string;
  params: Record<string, unknown>;
  prompt: string;
  todayDateKey: string;
  expectedWindowCount: number;
  expectedQueries: Array<{
    timeOfDay: 'morning' | 'afternoon' | 'evening' | null;
    dateKeyCount: number;
  }>;
};

/** Nearest-slot OR window query golden rows (avail-1.6). */
export const FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS: FlexibleAvailabilityNearestWindowScenario[] =
  [
    {
      id: 'avail-earliest-across-windows',
      params: {
        serviceCategory: 'lash',
        bookingFirstAvailable: true,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner',
      todayDateKey: '2026-06-10',
      expectedWindowCount: 2,
      expectedQueries: [
        { timeOfDay: 'evening', dateKeyCount: 1 },
        { timeOfDay: 'afternoon', dateKeyCount: 2 },
      ],
    },
    {
      id: 'avail-nearest-or-tomorrow-friday-en',
      params: {
        serviceCategory: 'lash',
        bookingFirstAvailable: true,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner',
      todayDateKey: '2026-06-10',
      expectedWindowCount: 2,
      expectedQueries: [
        { timeOfDay: 'evening', dateKeyCount: 1 },
        { timeOfDay: 'afternoon', dateKeyCount: 2 },
      ],
    },
    {
      id: 'avail-nearest-single-evening-en',
      params: {
        serviceName: 'massage',
        bookingFirstAvailable: true,
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      prompt: 'book nearest massage tomorrow evening',
      todayDateKey: '2026-06-10',
      expectedWindowCount: 1,
      expectedQueries: [{ timeOfDay: 'evening', dateKeyCount: 1 }],
    },
  ];

export type FlexibleAvailabilityNearestPickScenario = {
  id: string;
  candidates: Array<{
    startTime: string;
    windowIndex: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  }>;
  expectedWindowIndex: number;
};

export const FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS: FlexibleAvailabilityNearestPickScenario[] =
  [
    {
      id: 'avail-earliest-across-windows',
      candidates: [
        {
          startTime: '2026-06-11T18:00:00.000Z',
          windowIndex: 0,
          timeOfDay: 'evening',
        },
        {
          startTime: '2026-06-13T14:00:00.000Z',
          windowIndex: 1,
          timeOfDay: 'afternoon',
        },
      ],
      expectedWindowIndex: 0,
    },
    {
      id: 'avail-nearest-pick-friday-over-tomorrow',
      candidates: [
        {
          startTime: '2026-06-12T19:00:00.000Z',
          windowIndex: 0,
          timeOfDay: 'evening',
        },
        {
          startTime: '2026-06-12T13:00:00.000Z',
          windowIndex: 1,
          timeOfDay: 'afternoon',
        },
      ],
      expectedWindowIndex: 1,
    },
    {
      id: 'avail-nearest-pick-tomorrow-over-friday',
      candidates: [
        {
          startTime: '2026-06-11T16:00:00.000Z',
          windowIndex: 0,
          timeOfDay: 'evening',
        },
        {
          startTime: '2026-06-12T14:00:00.000Z',
          windowIndex: 1,
          timeOfDay: 'afternoon',
        },
      ],
      expectedWindowIndex: 0,
    },
  ];

export type FlexibleAvailabilityBudgetScenario = {
  id: string;
  catalog: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
  maxPrice: number;
  expectedServiceIds: string[];
  expectNoMatch: boolean;
};

/** Budget intersection golden rows before slot scan (avail-1.7). */
export const FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS: FlexibleAvailabilityBudgetScenario[] =
  [
    {
      id: 'avail-budget-or-en',
      catalog: [
        { id: 'h1', name: 'Haircut basic', price: 35, durationMinutes: 30 },
        { id: 'h2', name: 'Haircut premium', price: 75, durationMinutes: 45 },
      ],
      maxPrice: 50,
      expectedServiceIds: ['h1'],
      expectNoMatch: false,
    },
    {
      id: 'avail-budget-pick-service-first-en',
      catalog: [
        { id: 'h1', name: 'Haircut basic', price: 35, durationMinutes: 30 },
        { id: 'h2', name: 'Haircut standard', price: 45, durationMinutes: 30 },
      ],
      maxPrice: 50,
      expectedServiceIds: ['h1', 'h2'],
      expectNoMatch: false,
    },
    {
      id: 'avail-budget-no-match-or-en',
      catalog: [
        { id: 'h1', name: 'Haircut standard', price: 55, durationMinutes: 30 },
        { id: 'h2', name: 'Haircut premium', price: 75, durationMinutes: 45 },
      ],
      maxPrice: 50,
      expectedServiceIds: [],
      expectNoMatch: true,
    },
    {
      id: 'avail-budget-blocks-all-en',
      catalog: [
        { id: 'h1', name: 'Haircut basic', price: 35, durationMinutes: 30 },
      ],
      maxPrice: 50,
      expectedServiceIds: ['h1'],
      expectNoMatch: false,
    },
  ];

export type FlexibleAvailabilityCompoundScenario = {
  id: string;
  prompt: string;
  maxPrice: number;
  serviceCategory: string;
  publicCompoundSteps: string[];
  customerCompoundSteps: string[];
  expectedAvailabilityWindows: Array<Record<string, unknown>>;
};

/** Budget + OR window compound decomposition (avail-1.8). */
export const FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS: FlexibleAvailabilityCompoundScenario[] =
  [
    {
      id: 'avail-check-then-book-or-en',
      prompt:
        "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
      maxPrice: 50,
      serviceCategory: 'haircut',
      publicCompoundSteps: ['check_availability', 'book_appointment'],
      customerCompoundSteps: [
        'check_providers_for_service',
        'book_nearest_slot',
      ],
      expectedAvailabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-budget-or-book-en',
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner, I have $50',
      maxPrice: 50,
      serviceCategory: 'lash',
      publicCompoundSteps: ['check_availability', 'book_appointment'],
      customerCompoundSteps: [
        'check_providers_for_service',
        'book_nearest_slot',
      ],
      expectedAvailabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['saturday'], timeOfDay: 'afternoon' },
      ],
    },
    {
      id: 'avail-list-budget-then-or-en',
      prompt:
        'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
      maxPrice: 50,
      serviceCategory: 'haircut',
      publicCompoundSteps: ['list_services', 'check_availability'],
      customerCompoundSteps: ['list_services', 'check_providers_for_service'],
      expectedAvailabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    },
  ];

export type FlexibleAvailabilityOverlapScenario = {
  id: string;
  todayDateKey: string;
  windows: Array<{
    dateKeys: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | null;
  }>;
  expectOverlap: boolean;
  expectClarifyNote: boolean;
  expectMergedWindowCount?: number;
  expectedLabels?: string[];
};

/** Overlap + clarify golden rows (avail-1.9). */
export const FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS: FlexibleAvailabilityOverlapScenario[] =
  [
    {
      id: 'avail-overlap-tomorrow-is-friday',
      todayDateKey: '2026-06-11',
      windows: [
        { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
        { dateKeys: ['2026-06-12'], timeOfDay: 'afternoon' },
      ],
      expectOverlap: true,
      expectClarifyNote: true,
      expectedLabels: ['Friday evening', 'Friday afternoon'],
    },
    {
      id: 'avail-clarify-overlap-en',
      todayDateKey: '2026-06-11',
      windows: [
        { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
        { dateKeys: ['2026-06-12'], timeOfDay: 'afternoon' },
      ],
      expectOverlap: true,
      expectClarifyNote: true,
      expectedLabels: ['Friday evening', 'Friday afternoon'],
    },
    {
      id: 'avail-overlap-merge-identical-evening',
      todayDateKey: '2026-06-11',
      windows: [
        { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
        { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
      ],
      expectOverlap: false,
      expectClarifyNote: false,
      expectMergedWindowCount: 1,
    },
    {
      id: 'avail-no-overlap-tomorrow-friday',
      todayDateKey: '2026-06-10',
      windows: [
        { dateKeys: ['2026-06-11'], timeOfDay: 'evening' },
        { dateKeys: ['2026-06-12'], timeOfDay: 'afternoon' },
      ],
      expectOverlap: false,
      expectClarifyNote: false,
      expectedLabels: ['Tomorrow evening', 'Friday afternoon'],
    },
  ];

export type FlexibleAvailabilityBudgetClarifyScenario = {
  id: string;
  maxPrice: number;
  catalog: Array<{ id: string; name: string; price: number }>;
  expectClarify: boolean;
};

export const FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS: FlexibleAvailabilityBudgetClarifyScenario[] =
  [
    {
      id: 'avail-budget-no-match-or-en',
      maxPrice: 50,
      catalog: [
        { id: 'h1', name: 'Haircut standard', price: 55 },
        { id: 'h2', name: 'Haircut premium', price: 75 },
      ],
      expectClarify: true,
    },
  ];

export type FlexibleAvailabilityBudgetNoSlotsScenario = {
  id: string;
  maxPrice: number;
  catalog: Array<{ id: string; name: string; price: number }>;
  windowLabels: [string, string];
};

/** Budget passes but both OR windows are empty — separate from budget_no_match (avail-budget-blocks-all-en). */
export const FLEXIBLE_AVAILABILITY_BUDGET_NO_SLOTS_SCENARIOS: FlexibleAvailabilityBudgetNoSlotsScenario[] =
  [
    {
      id: 'avail-budget-blocks-all-en',
      maxPrice: 50,
      catalog: [{ id: 'h1', name: 'Haircut basic', price: 35 }],
      windowLabels: ['Tomorrow evening', 'Friday afternoon'],
    },
  ];

export type FlexibleAvailabilityNeitherWindowScenario = {
  id: string;
  windowLabels: [string, string];
  nearestAlternative?: {
    employeeName: string;
    dateKey: string;
    startTime: string;
  };
};

/** Both OR windows empty — grouped labels + nearest alternative note (avail-neither-window-en). */
export const FLEXIBLE_AVAILABILITY_NEITHER_WINDOW_SCENARIOS: FlexibleAvailabilityNeitherWindowScenario[] =
  [
    {
      id: 'avail-neither-window-en',
      windowLabels: ['Tomorrow evening', 'Friday afternoon'],
      nearestAlternative: {
        employeeName: 'Alice',
        dateKey: '2026-06-13',
        startTime: '2026-06-13T10:00:00.000Z',
      },
    },
  ];

export type FlexibleAvailabilityPartialWindowScenario = {
  id: string;
  filledWindowLabel: string;
  emptyWindowLabel: string;
  expectedSlotTime: string;
};

/** Only one OR window has openings — label filled vs empty sections (avail-partial-one-window-en). */
export const FLEXIBLE_AVAILABILITY_PARTIAL_WINDOW_SCENARIOS: FlexibleAvailabilityPartialWindowScenario[] =
  [
    {
      id: 'avail-partial-one-window-en',
      filledWindowLabel: 'Saturday afternoon',
      emptyWindowLabel: 'Tomorrow evening',
      expectedSlotTime: '14:00',
    },
  ];

export type FlexibleAvailabilitySurface =
  | 'public'
  | 'customer'
  | 'both'
  | 'dashboard';

export type FlexibleAvailabilityPromptFixture = {
  id: string;
  prompt: string;
  surface: FlexibleAvailabilitySurface;
  expectedAction: string;
  customerExpectedAction?: string;
  expectedParams?: Record<string, unknown>;
  skipMaxPrice?: boolean;
  publicCompoundSteps?: readonly string[];
  customerCompoundSteps?: readonly string[];
  handlerOutcome?: boolean;
  phase2?: boolean;
  /** Multi-turn session fixture (section K — phase 2 handlers). */
  sessionFlow?: boolean;
  sessionTurns?: readonly string[];
};

const AVAIL_WIN_OR_TOMORROW_FRIDAY: AvailabilityWindow[] = [
  { date: 'tomorrow', timeOfDay: 'evening' },
  { weekdays: ['friday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_OR_KARO_MARY: AvailabilityWindow[] = [
  { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
  { employeeName: 'Mary', weekdays: ['friday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_OR_KARO_ANYONE: AvailabilityWindow[] = [
  { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
  { weekdays: ['friday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_OR_SPECIFIC_TIMES: AvailabilityWindow[] = [
  { date: 'tomorrow', timeSlot: '18:00' },
  { weekdays: ['friday'], timeSlot: '14:00' },
];

const AVAIL_WIN_OR_MON_WED_MORNING: AvailabilityWindow[] = [
  { weekdays: ['monday'], timeOfDay: 'morning' },
  { weekdays: ['wednesday'], timeOfDay: 'morning' },
];

const AVAIL_WIN_OR_LASHES_BOOK: AvailabilityWindow[] = [
  { date: 'tomorrow', timeOfDay: 'evening' },
  { weekdays: ['saturday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_THREE_WAY_OR: AvailabilityWindow[] = [
  { date: 'tomorrow' },
  { weekdays: ['friday'], timeOfDay: 'afternoon' },
  { weekdays: ['saturday'], timeOfDay: 'morning' },
];

const AVAIL_WIN_TONIGHT_TOMORROW: AvailabilityWindow[] = [
  { date: 'today', timeOfDay: 'evening' },
  { date: 'tomorrow', timeOfDay: 'morning' },
];

const AVAIL_WIN_WEEKEND_OR: AvailabilityWindow[] = [
  { weekdays: ['saturday'], timeOfDay: 'afternoon' },
  { weekdays: ['sunday'], timeOfDay: 'morning' },
];

const AVAIL_WIN_NEXT_WEEK_OR: AvailabilityWindow[] = [
  { weekdays: ['tuesday'] },
  { weekdays: ['thursday'], timeOfDay: 'evening' },
];

const AVAIL_WIN_AFTER_WORK_OR: AvailabilityWindow[] = [
  { date: 'tomorrow', timeFrom: '17:00' },
  { weekdays: ['friday'], timeFrom: '17:00' },
];

const AVAIL_WIN_LUNCH_OR: AvailabilityWindow[] = [
  {
    date: 'tomorrow',
    timeOfDay: 'afternoon',
    timeFrom: '12:00',
    timeTo: '14:00',
  },
  {
    weekdays: ['friday'],
    timeOfDay: 'afternoon',
    timeFrom: '12:00',
    timeTo: '14:00',
  },
];

const AVAIL_WIN_VOICE_SHORT_OR: AvailabilityWindow[] = [
  { date: 'tomorrow', timeOfDay: 'evening' },
  { weekdays: ['friday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_VOICE_ASAP_OR: AvailabilityWindow[] = [
  { date: 'tomorrow' },
  { weekdays: ['saturday'], timeOfDay: 'afternoon' },
];

const AVAIL_WIN_VOICE_CHIP_OR: AvailabilityWindow[] = [
  { timeOfDay: 'evening' },
  { weekdays: ['saturday', 'sunday'] },
];

const AVAIL_WIN_IMPERATIVE_OR: AvailabilityWindow[] = [
  { date: 'tomorrow', timeOfDay: 'afternoon' },
  { weekdays: ['sunday'], timeOfDay: 'morning' },
];

/** NL prompts for classifier, rescue, compounds, and eval — ai-cmd-avail sections A–M (avail-1.10 / avail-1.12). */
export const SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS: FlexibleAvailabilityPromptFixture[] =
  [
    // A — OR windows (core)
    {
      id: 'avail-or-tomorrow-friday-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-either-morning-en',
      prompt: 'Massage Monday morning or Wednesday morning',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_OR_MON_WED_MORNING,
      },
    },
    {
      id: 'avail-or-book-en',
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner',
      surface: 'both',
      expectedAction: 'book_appointment',
      customerExpectedAction: 'book_nearest_slot',
      expectedParams: {
        serviceCategory: 'lash',
        bookingFirstAvailable: true,
        availabilityWindows: AVAIL_WIN_OR_LASHES_BOOK,
      },
    },
    {
      id: 'avail-three-way-or-en',
      prompt: 'Facial tomorrow, Friday afternoon, or Saturday morning',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: AVAIL_WIN_THREE_WAY_OR,
      },
    },
    // B — Budget + OR
    {
      id: 'avail-budget-or-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-budget-under-or-en',
      prompt: 'Massage under $80 tomorrow or Thursday evening',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        maxPrice: 80,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['thursday'], timeOfDay: 'evening' },
        ],
      },
    },
    {
      id: 'avail-budget-no-match-or-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-budget-pick-service-first-en',
      prompt:
        'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    // C — Single window (regression)
    {
      id: 'avail-single-tomorrow-evening-en',
      prompt: "Who's free tomorrow evening for massage?",
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        date: 'tomorrow',
        timeOfDay: 'evening',
        allProviders: true,
      },
    },
    {
      id: 'avail-single-friday-afternoon-en',
      prompt: 'Any slots Friday afternoon for a facial?',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
        allProviders: true,
      },
    },
    {
      id: 'avail-no-or-and-en',
      prompt: 'Monday and Friday afternoon for color',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'color',
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
    },
    // D — Handler outcomes
    {
      id: 'avail-slots-window-a-only',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'public',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-slots-window-b-only',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'public',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-earliest-across-windows',
      prompt:
        'Book lashes tomorrow evening or Saturday afternoon, whichever is sooner',
      surface: 'both',
      expectedAction: 'book_appointment',
      customerExpectedAction: 'book_nearest_slot',
      expectedParams: {
        serviceCategory: 'lash',
        bookingFirstAvailable: true,
        availabilityWindows: AVAIL_WIN_OR_LASHES_BOOK,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-overlap-tomorrow-is-friday',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-public-timeofday-filter',
      prompt: 'Any slots Friday afternoon for a facial?',
      surface: 'public',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'facial',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
      },
      handlerOutcome: true,
    },
    // E — Compounds
    {
      id: 'avail-check-then-book-or-en',
      prompt:
        "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
      surface: 'both',
      expectedAction: 'check_availability',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      publicCompoundSteps: ['check_availability', 'book_appointment'],
      customerCompoundSteps: [
        'check_providers_for_service',
        'book_nearest_slot',
      ],
    },
    {
      id: 'avail-list-budget-then-or-en',
      prompt:
        'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: { serviceCategory: 'haircut', maxPrice: 50 },
      publicCompoundSteps: ['list_services', 'check_availability'],
      customerCompoundSteps: ['list_services', 'check_providers_for_service'],
    },
    {
      id: 'avail-rank-budget-or-en',
      prompt: 'Best premium facial under $100 tomorrow or Saturday',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        serviceRank: 'highest_price',
        maxPrice: 100,
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['saturday'] }],
      },
    },
    // F — Multilingual
    {
      id: 'avail-or-hy',
      prompt: 'Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ կեսօրին',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-or-ru',
      prompt:
        'Хочу стрижку завтра вечером или в пятницу днём, у меня 50 долларов',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-or-translit-en',
      prompt: 'Haircut vaghva yereko yan kam urbat kesorin',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    // G — Negative / rescue
    {
      id: 'avail-not-single-timeofday-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-not-gift-card-en',
      prompt: '$50 gift card, haircut tomorrow or Friday',
      surface: 'both',
      expectedAction: 'apply_gift_card_code',
      skipMaxPrice: true,
    },
    {
      id: 'avail-not-recommend-en',
      prompt: 'Who is free tomorrow or Friday for massage?',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: [{ date: 'tomorrow' }, { weekdays: ['friday'] }],
        allProviders: true,
      },
    },
    // H — Specific times & per-window named providers (avail-1.12)
    {
      id: 'avail-or-specific-times-en',
      prompt: 'Tomorrow at 6pm or Friday at 2pm for a haircut',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_SPECIFIC_TIMES,
      },
    },
    {
      id: 'avail-or-with-provider-en',
      prompt: 'Karo tomorrow evening or Mary Friday afternoon for massage',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_OR_KARO_MARY,
      },
    },
    {
      id: 'avail-dashboard-parity-en',
      prompt: 'Who is free tomorrow evening or Friday afternoon for massage?',
      surface: 'dashboard',
      expectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
        allProviders: true,
      },
    },
    // I — Time-of-day & relative date variants (avail-1.12)
    {
      id: 'avail-tonight-or-tomorrow-en',
      prompt: 'Haircut tonight or tomorrow morning',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_TONIGHT_TOMORROW,
      },
    },
    {
      id: 'avail-this-weekend-or-en',
      prompt: 'Massage Saturday afternoon or Sunday morning',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_WEEKEND_OR,
      },
    },
    {
      id: 'avail-next-week-or-en',
      prompt: 'Color next Tuesday or next Thursday evening',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'color',
        availabilityWindows: AVAIL_WIN_NEXT_WEEK_OR,
      },
      phase2: true,
    },
    {
      id: 'avail-after-work-en',
      prompt: 'Facial after 5 tomorrow or Friday',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: AVAIL_WIN_AFTER_WORK_OR,
      },
    },
    {
      id: 'avail-lunch-or-en',
      prompt: 'Manicure tomorrow lunch or Friday lunch',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'manicure',
        availabilityWindows: AVAIL_WIN_LUNCH_OR,
      },
    },
    // J — Voice / mobile phrasing (avail-1.12)
    {
      id: 'avail-voice-short-en',
      prompt: 'Haircut tomorrow eve or fri afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_VOICE_SHORT_OR,
      },
    },
    {
      id: 'avail-voice-asap-or-en',
      prompt: 'Lashes ASAP or Saturday if not',
      surface: 'both',
      expectedAction: 'book_appointment',
      customerExpectedAction: 'book_nearest_slot',
      expectedParams: {
        serviceCategory: 'lash',
        bookingFirstAvailable: true,
        availabilityWindows: AVAIL_WIN_VOICE_ASAP_OR,
      },
    },
    {
      id: 'avail-voice-chip-en',
      prompt: 'Evening or weekend slots for a facial',
      surface: 'customer',
      expectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: AVAIL_WIN_VOICE_CHIP_OR,
      },
    },
    {
      id: 'avail-imperative-en',
      prompt: 'Need massage tomorrow PM or Sun AM',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_IMPERATIVE_OR,
      },
    },
    // K — Session / multi-turn (avail-1.12)
    {
      id: 'avail-session-add-window-en',
      prompt: 'I want a haircut tomorrow evening',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      sessionFlow: true,
      sessionTurns: [
        'I want a haircut tomorrow evening',
        'or Friday afternoon works too',
      ],
    },
    {
      id: 'avail-session-drop-window-en',
      prompt: 'Haircut tomorrow or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: [{ weekdays: ['friday'], timeOfDay: 'afternoon' }],
      },
      sessionFlow: true,
      sessionTurns: ['Haircut tomorrow or Friday afternoon', 'Friday only'],
    },
    {
      id: 'avail-session-after-budget-en',
      prompt: 'Show haircuts under $50',
      surface: 'both',
      expectedAction: 'list_services',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      sessionFlow: true,
      sessionTurns: [
        'Show haircuts under $50',
        'Check tomorrow evening or Friday afternoon for those',
      ],
    },
    {
      id: 'avail-session-pick-slot-en',
      prompt: 'Book Friday 2pm',
      surface: 'both',
      expectedAction: 'book_appointment',
      customerExpectedAction: 'book_nearest_slot',
      expectedParams: {
        serviceCategory: 'haircut',
        weekdays: ['friday'],
        timeSlot: '14:00',
      },
      sessionFlow: true,
      sessionTurns: [
        'Who is free for a haircut tomorrow evening or Friday afternoon?',
        'Book Friday 2pm',
      ],
      phase2: true,
    },
    // L — Provider preference + OR (avail-1.12)
    {
      id: 'avail-or-any-provider-en',
      prompt: 'Any stylist tomorrow evening or Friday afternoon for a haircut',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        allProviders: true,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
    },
    {
      id: 'avail-or-named-fallback-en',
      prompt: 'Karo tomorrow evening or anyone Friday afternoon for massage',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'massage',
        availabilityWindows: AVAIL_WIN_OR_KARO_ANYONE,
      },
    },
    {
      id: 'avail-or-same-provider-en',
      prompt: 'Same person tomorrow or Friday afternoon for color',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'color',
        sameProviderAcrossWindows: true,
        availabilityWindows: [
          { date: 'tomorrow' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
    },
    // M — No-slot / clarify outcomes (avail-1.12)
    {
      id: 'avail-neither-window-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-partial-one-window-en',
      prompt: 'Facial tomorrow evening or Saturday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'facial',
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['saturday'], timeOfDay: 'afternoon' },
        ],
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-budget-blocks-all-en',
      prompt:
        'Haircut tomorrow evening or Friday afternoon under $50 — nothing open in either window',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        maxPrice: 50,
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
    {
      id: 'avail-clarify-overlap-en',
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      surface: 'both',
      expectedAction: 'check_availability',
      customerExpectedAction: 'check_providers_for_service',
      expectedParams: {
        serviceCategory: 'haircut',
        availabilityWindows: AVAIL_WIN_OR_TOMORROW_FRIDAY,
      },
      handlerOutcome: true,
    },
  ];

export const AVAIL_SECTION_A_OR_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-or-tomorrow-friday-en',
      'avail-either-morning-en',
      'avail-or-book-en',
      'avail-three-way-or-en',
    ].includes(scenario.id),
  );

export const AVAIL_OR_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) =>
      scenario.expectedParams?.availabilityWindows &&
      !scenario.handlerOutcome &&
      !scenario.phase2,
  );

export const AVAIL_BUDGET_OR_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) =>
      scenario.expectedParams?.maxPrice != null &&
      scenario.expectedParams?.availabilityWindows &&
      !scenario.phase2,
  );

export const AVAIL_SINGLE_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) =>
      !scenario.expectedParams?.availabilityWindows &&
      !scenario.handlerOutcome &&
      !scenario.phase2 &&
      scenario.expectedAction === 'check_availability',
  );

export const AVAIL_HANDLER_OUTCOME_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) => scenario.handlerOutcome === true,
  );

export const AVAIL_COMPOUND_PROMPT_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) =>
      scenario.publicCompoundSteps?.length ||
      scenario.customerCompoundSteps?.length,
  );

export const AVAIL_MULTILINGUAL_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-or-hy', 'avail-or-ru', 'avail-or-translit-en'].includes(
      scenario.id,
    ),
  );

export const AVAIL_DISAMBIGUATION_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-not-single-timeofday-en',
      'avail-not-gift-card-en',
      'avail-not-recommend-en',
      'avail-no-or-and-en',
    ].includes(scenario.id),
  );

export const AVAIL_SECTION_H_SPECIFIC_PROVIDER_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-or-specific-times-en', 'avail-or-with-provider-en'].includes(
      scenario.id,
    ),
  );

export const AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) => scenario.id === 'avail-dashboard-parity-en',
  );

export const AVAIL_SECTION_I_TIME_VARIANT_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-tonight-or-tomorrow-en',
      'avail-this-weekend-or-en',
      'avail-next-week-or-en',
      'avail-after-work-en',
      'avail-lunch-or-en',
    ].includes(scenario.id),
  );

export const AVAIL_SECTION_I_AFTER_WORK_LUNCH_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-after-work-en', 'avail-lunch-or-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_J_VOICE_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-voice-short-en',
      'avail-voice-asap-or-en',
      'avail-voice-chip-en',
      'avail-imperative-en',
    ].includes(scenario.id),
  );

export const AVAIL_SECTION_J_ASAP_CHIP_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-voice-asap-or-en', 'avail-voice-chip-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_J_IMPERATIVE_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-imperative-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_K_ADD_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-session-add-window-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_K_DROP_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-session-drop-window-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_K_AFTER_BUDGET_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-session-after-budget-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_K_SESSION_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) => scenario.sessionFlow === true,
  );

export const AVAIL_SECTION_L_ANY_PROVIDER_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-or-any-provider-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_L_NAMED_FALLBACK_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-or-named-fallback-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_L_SAME_PROVIDER_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-or-same-provider-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_M_BUDGET_NO_SLOTS_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-budget-blocks-all-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_M_NEITHER_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-neither-window-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_M_PARTIAL_WINDOW_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    ['avail-partial-one-window-en'].includes(scenario.id),
  );

export const AVAIL_SECTION_L_PROVIDER_OR_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-or-any-provider-en',
      'avail-or-named-fallback-en',
      'avail-or-same-provider-en',
    ].includes(scenario.id),
  );

export const AVAIL_SECTION_M_NO_SLOT_SCENARIOS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter((scenario) =>
    [
      'avail-neither-window-en',
      'avail-partial-one-window-en',
      'avail-budget-blocks-all-en',
      'avail-clarify-overlap-en',
    ].includes(scenario.id),
  );

export const AVAIL_PUBLIC_PROMPTS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) => scenario.surface === 'public' || scenario.surface === 'both',
  );

export const AVAIL_CUSTOMER_PROMPTS =
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
    (scenario) =>
      scenario.surface === 'customer' || scenario.surface === 'both',
  );

/** Public check_availability handler pipeline golden rows (avail-1.5 / discover-exit-2). */
export type PublicAvailHandlerIntegrationScenario = {
  id: string;
  params: Record<string, unknown>;
  todayDateKey: string;
  employees: Array<{ id: string; name: string }>;
  slotsByKey: Record<string, Array<{ startTime: string; endTime: string }>>;
  expectedSummaryContains: string[];
  expectedSummaryNotContains?: string[];
  /** OR windows with zero openings (avail-slots-window-*-only). */
  expectedEmptyWindowLabels?: string[];
  /** Earliest slot across OR windows for navigate pre-select (avail-earliest-across-windows). */
  expectedBestNavigateStartTime?: string;
};

export const PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS: PublicAvailHandlerIntegrationScenario[] =
  [
    {
      id: 'avail-public-timeofday-filter',
      params: {
        serviceCategory: 'facial',
        date: '2026-06-12',
        timeOfDay: 'afternoon',
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-12': [
          {
            startTime: '2026-06-12T09:00:00.000Z',
            endTime: '2026-06-12T09:30:00.000Z',
          },
          {
            startTime: '2026-06-12T14:00:00.000Z',
            endTime: '2026-06-12T14:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: ['14:00', 'Open slots for facial'],
      expectedSummaryNotContains: ['09:00'],
    },
    {
      id: 'avail-or-tomorrow-friday-en',
      params: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-12', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-11': [
          {
            startTime: '2026-06-11T17:00:00.000Z',
            endTime: '2026-06-11T17:30:00.000Z',
          },
        ],
        'e1:2026-06-12': [
          {
            startTime: '2026-06-12T13:00:00.000Z',
            endTime: '2026-06-12T13:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: [
        'Tomorrow evening',
        'Friday afternoon',
        '17:00',
        '13:00',
      ],
      expectedBestNavigateStartTime: '2026-06-11T17:00:00.000Z',
    },
    {
      id: 'avail-slots-window-a-only',
      params: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-12', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-11': [
          {
            startTime: '2026-06-11T17:00:00.000Z',
            endTime: '2026-06-11T17:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: [
        'Tomorrow evening',
        '17:00',
        'Friday afternoon',
      ],
      expectedEmptyWindowLabels: ['Friday afternoon'],
    },
    {
      id: 'avail-slots-window-b-only',
      params: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-12', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-12': [
          {
            startTime: '2026-06-12T13:00:00.000Z',
            endTime: '2026-06-12T13:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: [
        'Friday afternoon',
        '13:00',
        'Tomorrow evening',
      ],
      expectedEmptyWindowLabels: ['Tomorrow evening'],
    },
    {
      id: 'avail-neither-window-en',
      params: {
        serviceCategory: 'haircut',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-12', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {},
      expectedSummaryContains: [
        'Tomorrow evening:',
        'Friday afternoon:',
        'No open slots for Tomorrow evening.',
        'No open slots for Friday afternoon.',
      ],
      expectedSummaryNotContains: ['Try another day or specialist'],
    },
    {
      id: 'avail-partial-one-window-en',
      params: {
        serviceCategory: 'facial',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-13', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-13': [
          {
            startTime: '2026-06-13T14:00:00.000Z',
            endTime: '2026-06-13T14:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: [
        'Saturday afternoon',
        '14:00',
        'Tomorrow evening',
      ],
      expectedEmptyWindowLabels: ['Tomorrow evening'],
    },
    {
      id: 'avail-earliest-across-windows',
      params: {
        serviceCategory: 'lash',
        availabilityWindows: [
          { date: '2026-06-11', timeOfDay: 'evening' },
          { date: '2026-06-13', timeOfDay: 'afternoon' },
        ],
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-11': [
          {
            startTime: '2026-06-11T18:00:00.000Z',
            endTime: '2026-06-11T18:30:00.000Z',
          },
        ],
        'e1:2026-06-13': [
          {
            startTime: '2026-06-13T14:00:00.000Z',
            endTime: '2026-06-13T14:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: [
        'Tomorrow evening',
        'Saturday afternoon',
        '18:00',
        '14:00',
      ],
      expectedBestNavigateStartTime: '2026-06-11T18:00:00.000Z',
    },
    {
      id: 'avail-single-tomorrow-evening-en',
      params: {
        serviceCategory: 'massage',
        date: '2026-06-11',
        timeOfDay: 'evening',
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-11': [
          {
            startTime: '2026-06-11T10:00:00.000Z',
            endTime: '2026-06-11T10:30:00.000Z',
          },
          {
            startTime: '2026-06-11T18:00:00.000Z',
            endTime: '2026-06-11T18:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: ['18:00', 'Open slots for massage'],
      expectedSummaryNotContains: ['10:00'],
    },
    {
      id: 'avail-single-friday-afternoon-en',
      params: {
        serviceCategory: 'facial',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
      },
      todayDateKey: '2026-06-10',
      employees: [{ id: 'e1', name: 'Alice' }],
      slotsByKey: {
        'e1:2026-06-12': [
          {
            startTime: '2026-06-12T09:00:00.000Z',
            endTime: '2026-06-12T09:30:00.000Z',
          },
          {
            startTime: '2026-06-12T14:00:00.000Z',
            endTime: '2026-06-12T14:30:00.000Z',
          },
        ],
      },
      expectedSummaryContains: ['14:00', 'Open slots for facial'],
      expectedSummaryNotContains: ['09:00'],
    },
  ];

/** Unique ids across SIMILAR + specialized scenario arrays (avail-1.10 / avail-1.12 gate). */
export const AVAIL_DOMAIN_FIXTURE_IDS = [
  ...new Set([
    ...SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.map((scenario) => scenario.id),
    ...AVAILABILITY_WINDOW_PARSE_SCENARIOS.map((scenario) => scenario.id),
    ...AVAILABILITY_WINDOW_SINGLE_SCENARIOS.map((scenario) => scenario.id),
    ...AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS.map((scenario) => scenario.id),
    ...AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS.map((scenario) => scenario.id),
    ...FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS.map((scenario) => scenario.id),
    ...FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.map((scenario) => scenario.id),
    ...FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS.map((scenario) => scenario.id),
    ...FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_BUDGET_NO_SLOTS_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_NEITHER_WINDOW_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...FLEXIBLE_AVAILABILITY_PARTIAL_WINDOW_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
    ...PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS.map(
      (scenario) => scenario.id,
    ),
  ]),
];
