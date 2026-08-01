/**
 * e2e-bug.307 — public "is anybody open…" must stay availability
 * (check_availability), never add_booking_to_calendar. Residual of e2e-bug.287.
 */

export type E2e307AnybodyOpenNotCalendarCase = {
  id: string;
  prompt: string;
  /** Detector must reject calendar-add */
  expectCalendar: false;
  expectAvailabilityOpenCheck: true;
};

export const E2E307_AVAILABILITY_NOT_CALENDAR: readonly E2e307AnybodyOpenNotCalendarCase[] =
  [
    {
      id: 'ai-e2e307-anybody-open-swedish',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-anyone-free-swedish',
      prompt: 'is anyone free tomorrow morning for Swedish massage',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-who-is-open-swedish',
      prompt: 'who is open tomorrow morning for Swedish massage',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-somebody-open-evening',
      prompt: 'is somebody open tomorrow evening for massage',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-see-who-is-open',
      prompt: 'see who is open tomorrow for facial',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-named-gevorg-open',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-who-is-free',
      prompt: 'who is free tomorrow morning for haircut',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
    {
      id: 'ai-e2e307-open-slots-browse',
      prompt: 'What open slots are there for massage tomorrow?',
      expectCalendar: false,
      expectAvailabilityOpenCheck: true,
    },
  ] as const;

/** Still must match add_booking_to_calendar. */
export const E2E307_CALENDAR_CONTROLS = [
  {
    id: 'ctrl-add-to-my-calendar',
    prompt: 'Add to my calendar',
  },
  {
    id: 'ctrl-send-ics',
    prompt: 'Send me an ICS for my booking',
  },
  {
    id: 'ctrl-put-google-calendar',
    prompt: 'Put my booking in Google Calendar',
  },
  {
    id: 'ctrl-save-appointment-calendar',
    prompt: 'Save my appointment to calendar',
  },
  {
    id: 'ctrl-open-my-calendar',
    prompt: 'Open my calendar for this booking',
  },
] as const;

export const E2E307_RESCUE_CASES = [
  {
    id: 'rescue-public-from-check-availability',
    prompt: 'is anybody open tomorrow morning for Swedish massage',
    surface: 'public' as const,
    fromAction: 'check_availability',
    expectedActions: [
      'check_availability',
      'check_providers_for_service',
    ] as const,
    forbidAction: 'add_booking_to_calendar',
  },
  {
    id: 'rescue-public-from-add-calendar',
    prompt: 'is anybody open tomorrow morning for Swedish massage',
    surface: 'public' as const,
    fromAction: 'add_booking_to_calendar',
    expectedActions: [
      'check_availability',
      'check_providers_for_service',
    ] as const,
    forbidAction: 'add_booking_to_calendar',
  },
  {
    id: 'rescue-public-from-providers',
    prompt: 'is anybody open tomorrow morning for Swedish massage',
    surface: 'public' as const,
    fromAction: 'check_providers_for_service',
    expectedActions: [
      'check_availability',
      'check_providers_for_service',
    ] as const,
    forbidAction: 'add_booking_to_calendar',
  },
  {
    id: 'rescue-public-anyone-free',
    prompt: 'is anyone free tomorrow morning for Swedish massage',
    surface: 'public' as const,
    fromAction: 'check_availability',
    expectedActions: [
      'check_availability',
      'check_providers_for_service',
      'explain_provider_availability',
    ] as const,
    forbidAction: 'add_booking_to_calendar',
  },
  {
    id: 'rescue-public-who-is-open',
    prompt: 'who is open tomorrow morning for facial',
    surface: 'public' as const,
    fromAction: 'add_booking_to_calendar',
    expectedActions: [
      'check_availability',
      'check_providers_for_service',
    ] as const,
    forbidAction: 'add_booking_to_calendar',
  },
  {
    id: 'rescue-dashboard-anybody-still-providers',
    prompt: 'is anybody open tomorrow morning for Swedish massage',
    surface: 'dashboard' as const,
    fromAction: 'add_booking_to_calendar',
    expectedActions: ['check_providers_for_service'] as const,
    forbidAction: 'add_booking_to_calendar',
  },
] as const;

export const E2E307_LIVE_CASES = [
  {
    id: 'live-anybody-open-swedish',
    prompt: 'is anybody open tomorrow morning for Swedish massage',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-anyone-free-swedish',
    prompt: 'is anyone free tomorrow morning for Swedish massage',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-who-is-open-swedish',
    prompt: 'who is open tomorrow morning for Swedish massage',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-see-who-is-open',
    prompt: 'see who is open tomorrow for facial',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-named-gevorg-open',
    prompt: 'is Gevorg open tomorrow morning for Swedish massage',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-anybody-open-evening',
    prompt: 'is anybody open tomorrow evening for massage',
    expectedActions: ['check_availability'] as const,
    forbidActions: ['add_booking_to_calendar'] as const,
  },
  {
    id: 'live-ctrl-add-to-calendar',
    prompt: 'Add to my calendar',
    expectedActions: ['add_booking_to_calendar'] as const,
    forbidActions: ['check_availability'] as const,
  },
  {
    id: 'live-ctrl-send-ics',
    prompt: 'Send me an ICS for my booking',
    expectedActions: ['add_booking_to_calendar'] as const,
    forbidActions: ['check_availability'] as const,
  },
] as const;
