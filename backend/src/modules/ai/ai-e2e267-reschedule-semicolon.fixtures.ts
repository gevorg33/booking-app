/**
 * e2e-bug.267 — semicolon / "then put it" move+nearest must stay a single
 * reschedule_booking (not compound_intent → fill_slot_from_waitlist).
 */

export type E2e267RescheduleSemicolonCase = {
  id: string;
  prompt: string;
  /** Must NOT be treated as a multi-step compound. */
  expectCompound: boolean;
  /** When false, isSingleRescheduleNearestContinuationPrompt must be true. */
  expectSingleRescheduleContinuation: boolean;
  /** When true, AiIntentRescueService must return reschedule_booking. */
  expectRescue?: boolean;
};

/** Single-intent move/reschedule with destination restated after ; / then. */
export const E2E267_SINGLE_RESCHEDULE_CASES: readonly E2e267RescheduleSemicolonCase[] =
  [
    {
      id: 'e2e267-semicolon-put-it-nearest',
      prompt:
        "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
      expectCompound: false,
      expectSingleRescheduleContinuation: true,
      expectRescue: true,
    },
    {
      id: 'e2e267-then-put-it-nearest',
      prompt:
        "Move Gevorg's appointment on June 1 then put it June 2 nearest free time",
      expectCompound: false,
      expectSingleRescheduleContinuation: true,
      expectRescue: true,
    },
    {
      id: 'e2e267-semicolon-put-it-soonest-slot',
      prompt:
        'Reschedule Anna appointment; put it on the soonest free slot tomorrow',
      expectCompound: false,
      expectSingleRescheduleContinuation: true,
      expectRescue: true,
    },
    {
      id: 'e2e267-semicolon-put-that-first-available',
      prompt:
        "Shift Sam's booking on Monday; put that on the first available free slot Tuesday",
      expectCompound: false,
      expectSingleRescheduleContinuation: true,
      // Residual: after compound gate, rescue may still steal to lookup_customer.
      expectRescue: false,
    },
    {
      id: 'e2e267-then-move-it-nearest',
      prompt:
        'Change time of the appointment then move it to the nearest free time next week',
      expectCompound: false,
      expectSingleRescheduleContinuation: true,
      expectRescue: true,
    },
    {
      id: 'e2e267-no-semicolon-still-single',
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      expectCompound: false,
      expectSingleRescheduleContinuation: false,
      expectRescue: true,
    },
  ];

/** Genuine compounds that must keep splitting (regression guards). */
export const E2E267_TRUE_COMPOUND_CASES: readonly E2e267RescheduleSemicolonCase[] =
  [
    {
      id: 'e2e267-neg-cancel-fill-waitlist',
      prompt: 'Cancel package visit; fill waitlist',
      expectCompound: true,
      expectSingleRescheduleContinuation: false,
    },
    {
      id: 'e2e267-neg-cancel-notify-waitlist',
      prompt: 'Cancel the visit and notify waitlist',
      expectCompound: true,
      expectSingleRescheduleContinuation: false,
    },
    {
      id: 'e2e267-neg-move-then-book-other',
      prompt:
        "Move Gevorg's appointment to Friday; then book a second massage for Anna",
      expectCompound: true,
      expectSingleRescheduleContinuation: false,
    },
    {
      id: 'e2e267-neg-reschedule-and-message',
      prompt:
        'Reschedule Anna appointment to tomorrow; also message her about the change',
      expectCompound: true,
      expectSingleRescheduleContinuation: false,
    },
  ];
