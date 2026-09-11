/**
 * e2e-bug.248 — move/reschedule + nearest/soonest free time must stay on
 * reschedule_booking (with bookingFirstAvailable), never find_soonest_appointment.
 */
export type E2e248RescheduleNearestScenario = {
  id: string;
  prompt: string;
  surface: 'dashboard' | 'customer' | 'public';
  /** Starting classifier action at rescue time. */
  fromAction:
    | 'unknown'
    | 'create_booking'
    | 'find_soonest_appointment'
    | 'optimize_schedule';
  expectedAction: 'reschedule_booking';
  expectBookingFirstAvailable?: boolean;
};

export const E2E248_RESCHEDULE_NEAREST_SCENARIOS: readonly E2e248RescheduleNearestScenario[] =
  [
    {
      id: 'move-gevorg-june1-to-june2-nearest',
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-gevorg-create-booking-misclass',
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      surface: 'dashboard',
      fromAction: 'create_booking',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-gevorg-soonest-misclass',
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      surface: 'dashboard',
      fromAction: 'find_soonest_appointment',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'reschedule-optimize-misclass',
      prompt: 'Reschedule Anna appointment to the soonest free slot tomorrow',
      surface: 'dashboard',
      fromAction: 'optimize_schedule',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-first-available-optimize-misclass',
      prompt: "Move Sam's appointment to the first available slot Monday",
      surface: 'dashboard',
      fromAction: 'optimize_schedule',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'reschedule-maria-nearest',
      prompt: 'Move to June 11 nearest free time for Maria',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'reschedule-appointment-soonest-slot',
      prompt: 'Reschedule Anna appointment to the soonest free slot tomorrow',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'shift-booking-earliest-opening',
      prompt: "Shift John's booking to the earliest free time on Friday",
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'change-time-nearest-free',
      prompt: 'Change time of the appointment to nearest free time next week',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-visit-asap',
      prompt: 'Move the visit to the soonest available time',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-appointment-first-available',
      prompt: "Move Sam's appointment to the first available slot Monday",
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'reschedule-semicolon-nearest',
      prompt:
        "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'move-jujo-possessive',
      prompt: "Move Jujo's appointment on June 10 to June 11 nearest free time",
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
    {
      id: 'reschedule-question-nearest',
      prompt:
        'Can you move that appointment to the nearest free time on June 2?',
      surface: 'dashboard',
      fromAction: 'unknown',
      expectedAction: 'reschedule_booking',
      expectBookingFirstAvailable: true,
    },
  ];

/** True soonest READ prompts that must NOT become reschedule. */
export const E2E248_SOONEST_NEGATIVE_SCENARIOS: readonly {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
}[] = [
  {
    id: 'neg-who-free-soonest',
    prompt: "Who's free soonest for a trim?",
    surface: 'customer',
  },
  {
    id: 'neg-earliest-slot-week',
    prompt: 'Earliest slot this week',
    surface: 'public',
  },
  {
    id: 'neg-nearest-opening-facial',
    prompt: 'What is the nearest opening for facial?',
    surface: 'customer',
  },
];
