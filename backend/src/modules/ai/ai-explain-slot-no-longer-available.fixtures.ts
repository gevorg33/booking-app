export type ExplainSlotNoLongerAvailablePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_slot_no_longer_available';
  rescueReason: 'explain_slot_no_longer_available';
};

export const CUSTOMER_PUBLIC_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CLASSIFIER_RULES = `- explain_slot_no_longer_available: READ — customer app or public booking web: explain why a previously selected time slot disappeared at checkout (someone else booked it, slot was never locked, or online checkout hold expired). Re-runs check_availability when serviceId + date are in session. Triggers: "That time disappeared", "Someone took my slot", "My slot is gone", "The time I picked isn't available anymore". NOT check_availability (fresh slot search without gone/taken cue), NOT explain_why_no_slots (why a day has zero openings), NOT find_soonest_appointment (earliest slot search), NOT switch_provider_same_time (keep time switch stylist), NOT book_appointment (create booking), NOT diagnose_stripe_checkout_failure (payment failure), NOT fix_checkout_validation_error (contact field errors).`;

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS: readonly ExplainSlotNoLongerAvailablePromptFixture[] =
  [
    {
      id: 'time-disappeared-customer',
      prompt: 'That time disappeared',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'someone-took-slot-customer',
      prompt: 'Someone took my slot',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-gone-customer',
      prompt: 'My slot is gone',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-not-available-customer',
      prompt: "The time I picked isn't available anymore",
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-no-longer-there-customer',
      prompt: 'The slot I selected is no longer there',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'lost-my-time-customer',
      prompt: 'I lost the appointment time I chose',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-vanished-checkout-customer',
      prompt: 'My checkout time vanished',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'someone-booked-slot-customer',
      prompt: 'Did someone else book my slot?',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'why-slot-gone-customer',
      prompt: 'Why did my time slot disappear?',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'cant-book-selected-time-customer',
      prompt: "Can't book the time I selected",
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-taken-while-checkout-customer',
      prompt: 'My slot was taken while I was checking out',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-unavailable-now-customer',
      prompt: 'That appointment time is unavailable now',
      surface: 'customer',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-disappeared-public',
      prompt: 'That time disappeared',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'someone-took-slot-public',
      prompt: 'Someone took my slot',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-gone-public',
      prompt: 'My slot is gone',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-not-available-public',
      prompt: "The time I picked isn't available anymore",
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-no-longer-there-public',
      prompt: 'The slot I selected is no longer there',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'lost-my-time-public',
      prompt: 'I lost the appointment time I chose',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-vanished-checkout-public',
      prompt: 'My checkout time vanished',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'someone-booked-slot-public',
      prompt: 'Did someone else book my slot?',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'why-slot-gone-public',
      prompt: 'Why did my time slot disappear?',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'cant-book-selected-time-public',
      prompt: "Can't book the time I selected",
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'slot-taken-while-checkout-public',
      prompt: 'My slot was taken while I was checking out',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'time-unavailable-now-public',
      prompt: 'That appointment time is unavailable now',
      surface: 'public',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
  ] as const;

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_HANDLER_FIXTURES = [
  {
    id: 'taken-by-someone',
    prompt: 'Someone took my slot',
    aspect: 'taken_by_someone',
    params: {},
  },
  {
    id: 'disappeared-with-refresh',
    prompt: 'That time disappeared',
    aspect: 'disappeared',
    params: {
      serviceId: 'svc-1',
      date: '2026-06-30',
      employeeId: 'emp-1',
      startTime: '14:00',
    },
  },
  {
    id: 'checkout-hold-expired',
    prompt: 'My checkout payment hold expired',
    aspect: 'checkout_hold_expired',
    params: {},
  },
] as const;

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-slot-gone',
    prompt: 'Someone took my slot',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_slot_no_longer_available',
  },
  {
    id: 'check-availability-to-slot-gone',
    prompt: 'That time disappeared',
    misclassifiedAction: 'check_availability',
    expectedAction: 'explain_slot_no_longer_available',
  },
  {
    id: 'book-appointment-to-slot-gone',
    prompt: 'My slot is gone',
    misclassifiedAction: 'book_appointment',
    expectedAction: 'explain_slot_no_longer_available',
  },
  {
    id: 'fix-validation-steal-guard',
    prompt: 'That time disappeared',
    misclassifiedAction: 'fix_checkout_validation_error',
    expectedAction: 'explain_slot_no_longer_available',
  },
] as const;
