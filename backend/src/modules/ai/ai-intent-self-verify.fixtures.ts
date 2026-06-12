/** pipe-1.6.1 — deterministic self-verify rule scenarios. */
export const SELF_VERIFY_PIPE_MARKER = 'pipe-1.6.1';

export type SelfVerifyFixtureScenario = {
  id: string;
  prompt: string;
  action: string;
  expectPassed: boolean;
  expectedRuleId?: string;
  expectedCorrectedAction?: string;
};

export type SelfVerifyVocabHelperScenario = {
  id: string;
  prompt: string;
  expectScheduleMutation: boolean;
  expectBookingAppointment: boolean;
  expectWorkTime?: boolean;
  expectDirectSchedule?: boolean;
};

export type ApplySelfVerifyCorrectionScenario = {
  id: string;
  prompt: string;
  workingAction: string;
  workingConfidence?: number;
  expectIntentAction: string;
  expectPassed: boolean;
  expectedCorrectedAction?: string;
};

export const SELF_VERIFY_VOCAB_HELPER_SCENARIOS: SelfVerifyVocabHelperScenario[] = [
  {
    id: 'clear-schedule-schedule-vocab',
    prompt: 'Clear Gevorg schedule for tomorrow',
    expectScheduleMutation: true,
    expectBookingAppointment: false,
    expectWorkTime: false,
    expectDirectSchedule: false,
  },
  {
    id: 'work-time-schedule-vocab',
    prompt: 'Create work time for Gevorg next week',
    expectScheduleMutation: true,
    expectBookingAppointment: false,
    expectWorkTime: true,
    expectDirectSchedule: false,
  },
  {
    id: 'direct-schedule-vocab',
    prompt: 'Set direct schedule for Maria next week',
    expectScheduleMutation: true,
    expectBookingAppointment: false,
    expectWorkTime: false,
    expectDirectSchedule: true,
  },
  {
    id: 'block-schedule-vocab',
    prompt: 'Block Gevorg schedule tomorrow',
    expectScheduleMutation: true,
    expectBookingAppointment: false,
  },
  {
    id: 'booking-vocab',
    prompt: 'Book Anna for a haircut tomorrow at 3pm',
    expectScheduleMutation: false,
    expectBookingAppointment: true,
  },
  {
    id: 'empty-prompt-no-vocab',
    prompt: '   ',
    expectScheduleMutation: false,
    expectBookingAppointment: false,
  },
  {
    id: 'generic-schedule-for-client',
    prompt: 'Schedule a massage for James tomorrow',
    expectScheduleMutation: false,
    expectBookingAppointment: true,
  },
];

export const APPLY_SELF_VERIFY_CORRECTION_SCENARIOS: ApplySelfVerifyCorrectionScenario[] =
  [
    {
      id: 'corrects-booking-to-clear',
      prompt: 'Clear Gevorg schedule for tomorrow',
      workingAction: 'create_booking',
      workingConfidence: 0.7,
      expectIntentAction: 'clear_schedule',
      expectPassed: false,
      expectedCorrectedAction: 'clear_schedule',
    },
    {
      id: 'corrects-booking-to-direct-schedule',
      prompt: 'Create work time for Gevorg next 5 days',
      workingAction: 'create_booking',
      workingConfidence: 0.65,
      expectIntentAction: 'create_direct_schedule',
      expectPassed: false,
      expectedCorrectedAction: 'create_direct_schedule',
    },
    {
      id: 'corrects-schedule-template-to-booking',
      prompt: 'Book Anna tomorrow at 3pm',
      workingAction: 'create_schedule_template',
      workingConfidence: 0.8,
      expectIntentAction: 'create_booking',
      expectPassed: false,
      expectedCorrectedAction: 'create_booking',
    },
    {
      id: 'uncorrectable-leaves-intent',
      prompt: 'Block Gevorg schedule tomorrow',
      workingAction: 'create_booking',
      workingConfidence: 0.42,
      expectIntentAction: 'create_booking',
      expectPassed: false,
      expectedCorrectedAction: undefined,
    },
    {
      id: 'aligned-no-change',
      prompt: 'Book Anna for a haircut tomorrow at 3pm',
      workingAction: 'create_booking',
      workingConfidence: 0.9,
      expectIntentAction: 'create_booking',
      expectPassed: true,
    },
    {
      id: 'unknown-skips-correction',
      prompt: 'something odd',
      workingAction: 'unknown',
      workingConfidence: 0.3,
      expectIntentAction: 'unknown',
      expectPassed: true,
    },
  ];

export const BOOKING_SELF_VERIFY_ACTION_SCENARIOS: SelfVerifyFixtureScenario[] = [
  {
    id: 'book_nearest_slot-on-clear',
    prompt: 'Clear Gevorg schedule for tomorrow',
    action: 'book_nearest_slot',
    expectPassed: false,
    expectedRuleId: 'booking_vs_clear_mismatch',
    expectedCorrectedAction: 'clear_schedule',
  },
  {
    id: 'reschedule_booking-on-clear',
    prompt: 'Clear Karo schedule Friday',
    action: 'reschedule_booking',
    expectPassed: false,
    expectedRuleId: 'booking_vs_clear_mismatch',
    expectedCorrectedAction: 'clear_schedule',
  },
  {
    id: 'book_appointment-on-work-time',
    prompt: 'Create work time for Gevorg next week',
    action: 'book_appointment',
    expectPassed: false,
    expectedRuleId: 'schedule_vocab_mismatch',
    expectedCorrectedAction: 'create_direct_schedule',
  },
];

export const SELF_VERIFY_PASS_SCENARIOS: SelfVerifyFixtureScenario[] = [
  {
    id: 'clear-schedule-aligned',
    prompt: 'Clear Gevorg schedule for tomorrow',
    action: 'clear_schedule',
    expectPassed: true,
  },
  {
    id: 'work-time-schedule-aligned',
    prompt: 'They need regular work time on the calendar next week',
    action: 'create_direct_schedule',
    expectPassed: true,
  },
  {
    id: 'booking-aligned',
    prompt: 'Book Anna for a haircut tomorrow at 3pm',
    action: 'create_booking',
    expectPassed: true,
  },
  {
    id: 'hide-calendar-aligned',
    prompt: 'Hide cancelled appointments from Gevorg calendar today',
    action: 'hide_appointments_from_calendar',
    expectPassed: true,
  },
];

export const SELF_VERIFY_BOOKING_VS_CLEAR_SCENARIOS: SelfVerifyFixtureScenario[] =
  [
    {
      id: 'booking-on-clear-prompt',
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'create_booking',
      expectPassed: false,
      expectedRuleId: 'booking_vs_clear_mismatch',
      expectedCorrectedAction: 'clear_schedule',
    },
    {
      id: 'clear-on-booking-prompt',
      prompt: 'Book Anna for a haircut tomorrow',
      action: 'clear_schedule',
      expectPassed: false,
      expectedRuleId: 'booking_vs_clear_mismatch',
      expectedCorrectedAction: 'create_booking',
    },
    {
      id: 'clear-mislabeled-hide',
      prompt: 'Clear Karo schedule Friday',
      action: 'hide_appointments_from_calendar',
      expectPassed: false,
      expectedRuleId: 'booking_vs_clear_mismatch',
      expectedCorrectedAction: 'clear_schedule',
    },
    {
      id: 'hide-mislabeled-clear',
      prompt: 'Hide done appointments from calendar this week',
      action: 'clear_schedule',
      expectPassed: false,
      expectedRuleId: 'booking_vs_clear_mismatch',
      expectedCorrectedAction: 'hide_appointments_from_calendar',
    },
  ];

export const SELF_VERIFY_SCHEDULE_VOCAB_SCENARIOS: SelfVerifyFixtureScenario[] =
  [
    {
      id: 'work-time-mislabeled-booking',
      prompt: 'Create work time for Gevorg next 5 days',
      action: 'create_booking',
      expectPassed: false,
      expectedRuleId: 'schedule_vocab_mismatch',
      expectedCorrectedAction: 'create_direct_schedule',
    },
    {
      id: 'direct-schedule-mislabeled-booking',
      prompt: 'Set direct schedule for Maria next week',
      action: 'create_booking',
      expectPassed: false,
      expectedRuleId: 'schedule_vocab_mismatch',
      expectedCorrectedAction: 'create_direct_schedule',
    },
    {
      id: 'schedule-template-mislabeled-booking',
      prompt: 'Create schedule template for next month',
      action: 'create_booking',
      expectPassed: false,
      expectedRuleId: 'schedule_vocab_mismatch',
      expectedCorrectedAction: 'create_schedule_template',
    },
    {
      id: 'booking-on-schedule-template',
      prompt: 'Book Anna tomorrow at 3pm',
      action: 'create_schedule_template',
      expectPassed: false,
      expectedRuleId: 'schedule_vocab_mismatch',
      expectedCorrectedAction: 'create_booking',
    },
    {
      id: 'ambiguous-block-schedule-uncorrectable',
      prompt: 'Block Gevorg schedule tomorrow',
      action: 'create_booking',
      expectPassed: false,
      expectedRuleId: 'schedule_vocab_mismatch',
      expectedCorrectedAction: undefined,
    },
  ];

export const SELF_VERIFY_SCENARIOS: SelfVerifyFixtureScenario[] = [
  ...SELF_VERIFY_PASS_SCENARIOS,
  ...SELF_VERIFY_BOOKING_VS_CLEAR_SCENARIOS,
  ...SELF_VERIFY_SCHEDULE_VOCAB_SCENARIOS,
  ...BOOKING_SELF_VERIFY_ACTION_SCENARIOS,
];
