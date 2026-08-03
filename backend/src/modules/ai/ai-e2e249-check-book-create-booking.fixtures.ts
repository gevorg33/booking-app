/**
 * e2e-bug.249 — dashboard check-then-book / nearest-slot must stay on
 * create_booking (with bookingFirstAvailable), not public book_appointment.
 */
export type E2e249CheckBookScenario = {
  id: string;
  prompt: string;
  surface: 'dashboard' | 'customer' | 'public' | undefined;
  fromAction: 'create_booking' | 'unknown' | 'check_providers_for_service';
  expectedAction:
    | 'create_booking'
    | 'book_appointment'
    | 'book_nearest_slot';
  expectBookingFirstAvailable?: boolean;
  expectRescueReason?: string;
};

/** Public/customer flexible book intents (either is OK; nearest → book_nearest_slot). */
export const E2E249_PUBLIC_FLEXIBLE_ACTIONS = [
  'book_appointment',
  'book_nearest_slot',
] as const;

/** Dashboard staff phrasing — must NOT become book_appointment. */
export const E2E249_DASHBOARD_CREATE_BOOKING_SCENARIOS: readonly E2e249CheckBookScenario[] =
  [
    {
      id: 'check-book-nearest-permanent-lashes',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      surface: undefined,
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
      expectRescueReason: 'check_and_book_compound',
    },
    {
      id: 'check-book-nearest-dashboard-surface',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
      expectRescueReason: 'check_and_book_compound',
    },
    {
      id: 'book-nearest-massage-create',
      prompt: 'Book the nearest available slot for massage tomorrow',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'book-first-available-lashes',
      prompt: 'Book first available permanent lashes tomorrow evening',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'soonest-any-provider',
      prompt:
        'Book the soonest slot for massage tomorrow evening on any provider',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'check-then-book-semicolon',
      prompt:
        'who is free tomorrow for facemassage; book the nearest slot',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'check-book-unknown-stays-create-or-check',
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'voice-check-book-nearest',
      prompt: 'see who is free for trim tomorrow book nearest please',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'check-book-asap',
      prompt: 'check providers for color tomorrow, book ASAP',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'check-book-earliest',
      prompt:
        'who can do Swedish massage tomorrow evening, book the earliest slot',
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'create_booking',
      expectBookingFirstAvailable: true,
    },
  ];

/** Public surface — nearest book uses book_nearest_slot / book_appointment (not create_booking). */
export const E2E249_PUBLIC_BOOK_APPOINTMENT_SCENARIOS: readonly E2e249CheckBookScenario[] =
  [
    {
      id: 'public-book-nearest-slot',
      prompt: 'Book the nearest slot for massage tomorrow',
      surface: 'public',
      fromAction: 'unknown',
      expectedAction: 'book_nearest_slot',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'public-flexible-from-create-misclass',
      prompt: 'Book the nearest available slot for facial tomorrow',
      surface: 'public',
      fromAction: 'create_booking',
      // create_booking is rejected for public remap (e2e-249); payments nearest
      // rescue still yields book_nearest_slot on public.
      expectedAction: 'book_nearest_slot',
      expectBookingFirstAvailable: true,
    },
  ];
