/**
 * e2e-bug.286 — "Create a booking for the first available…" must stay
 * create_booking (with bookingFirstAvailable), never create_employee.
 * Residual of e2e-bug.268 live QA.
 */

export type E2e286CreateBookingNotEmployeeCase = {
  id: string;
  prompt: string;
  /** Detector must reject create_employee */
  expectCreateEmployee: false;
  /** Structural "create/make a booking…" cue (optional for plain "Book …") */
  expectCreateBookingCue: boolean;
  /** Semantic / rescue should treat as first-available booking */
  expectFirstAvailable: boolean;
};

export const E2E286_CREATE_BOOKING_NOT_EMPLOYEE_CASES: readonly E2e286CreateBookingNotEmployeeCase[] =
  [
    {
      id: 'ai-e2e286-canonical-create-booking-first-available',
      prompt:
        'Create a booking for the first available massage slot on Monday for any provider',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-create-a-booking-first-available-short',
      prompt: 'Create a booking for the first available massage slot',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-create-booking-soonest-any-provider',
      prompt:
        'Create a booking for the soonest massage slot tomorrow for any provider',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-create-an-appointment-first-available',
      prompt:
        'Create an appointment for the first available facial slot on Tuesday for any provider',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-schedule-a-booking-nearest-slot',
      prompt: 'Schedule a booking for the nearest available haircut slot',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-make-a-booking-first-available',
      prompt:
        'Make a booking for the first available massage on Monday for any provider',
      expectCreateEmployee: false,
      expectCreateBookingCue: true,
      expectFirstAvailable: true,
    },
    {
      id: 'ai-e2e286-book-first-available-still-ok',
      prompt: 'Book first available massage slot on Monday for any provider',
      expectCreateEmployee: false,
      expectCreateBookingCue: false,
      expectFirstAvailable: true,
    },
  ] as const;

/** True create_employee controls — must still match hire-staff. */
export const E2E286_CREATE_EMPLOYEE_CONTROLS = [
  {
    id: 'ctrl-add-stylist-anna',
    prompt: 'Add stylist Anna',
    expectCreateEmployee: true,
  },
  {
    id: 'ctrl-create-employee-maria',
    prompt: 'Create employee Maria with massage services',
    expectCreateEmployee: true,
  },
  {
    id: 'ctrl-hire-provider-jake',
    prompt: 'Hire provider Jake',
    expectCreateEmployee: true,
  },
  {
    id: 'ctrl-onboard-new-therapist',
    prompt: 'Onboard a new therapist named Sara',
    expectCreateEmployee: true,
  },
] as const;

/** Rescue remaps when classifier already said create_employee. */
export const E2E286_RESCUE_FROM_CREATE_EMPLOYEE = [
  {
    id: 'rescue-canonical-from-create-employee',
    prompt:
      'Create a booking for the first available massage slot on Monday for any provider',
    fromAction: 'create_employee' as const,
    expectedAction: 'create_booking' as const,
    expectBookingFirstAvailable: true,
    expectAllProviders: true,
  },
  {
    id: 'rescue-canonical-from-unknown',
    prompt:
      'Create a booking for the first available massage slot on Monday for any provider',
    fromAction: 'unknown' as const,
    expectedAction: 'create_booking' as const,
    expectBookingFirstAvailable: true,
    expectAllProviders: true,
  },
  {
    id: 'rescue-book-verb-still-create-booking',
    prompt: 'Book first available massage tomorrow evening on any provider',
    fromAction: 'create_booking' as const,
    expectedAction: 'create_booking' as const,
    expectBookingFirstAvailable: true,
    expectAllProviders: true,
  },
] as const;

export const E2E286_LIVE_CASES = [
  {
    id: 'live-canonical-create-booking-first-available',
    prompt:
      'Create a booking for the first available massage slot on Monday for any provider',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee', 'invite_staff_member'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-create-booking-first-available-short',
    prompt: 'Create a booking for the first available massage slot',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-create-booking-soonest-any',
    prompt:
      'Create a booking for the soonest massage slot tomorrow for any provider',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-create-an-appointment-first-available',
    prompt:
      'Create an appointment for the first available facial slot next Monday for any provider',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-make-a-booking-first-available',
    prompt:
      'Make a booking for the first available massage on Monday for any provider',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-book-verb-control',
    prompt: 'Book first available massage tomorrow evening on any provider',
    expectedActions: ['create_booking', 'book_nearest_slot'] as const,
    forbidActions: ['create_employee'] as const,
    expectBookingFirstAvailable: true,
  },
  {
    id: 'live-ctrl-add-stylist',
    prompt: 'Add stylist Anna',
    expectedActions: ['create_employee'] as const,
    forbidActions: ['create_booking'] as const,
    expectBookingFirstAvailable: false,
  },
  {
    id: 'live-ctrl-create-employee-maria',
    prompt: 'Create employee Maria with massage services',
    expectedActions: ['create_employee'] as const,
    forbidActions: ['create_booking'] as const,
    expectBookingFirstAvailable: false,
  },
] as const;
