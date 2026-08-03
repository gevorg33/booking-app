/**
 * e2e-bug.284 — Move/reschedule + then-book-another must decompose to
 * reschedule_booking → create_booking (not collapse to create_booking alone).
 */

export type E2e284CompoundCase = {
  id: string;
  prompt: string;
  expectCompound: boolean;
  orderedActions?: readonly string[];
  expectCreateCustomerName?: string;
  expectCreateServiceName?: string;
  note?: string;
};

export const E2E284_POSITIVE_CASES: readonly E2e284CompoundCase[] = [
  {
    id: 'e2e284-move-then-book-second-massage',
    prompt:
      "Move Gevorg's appointment to Friday; then book a second massage for Anna",
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Anna',
    expectCreateServiceName: 'massage',
  },
  {
    id: 'e2e284-move-then-book-no-semicolon',
    prompt:
      "Move Gevorg's appointment to Friday then book a second massage for Anna",
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Anna',
    expectCreateServiceName: 'massage',
  },
  {
    id: 'e2e284-reschedule-and-book-facial',
    prompt: 'Reschedule Sam to Monday; then book a facial for Maria',
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Maria',
    expectCreateServiceName: 'facial',
  },
  {
    id: 'e2e284-shift-also-book',
    prompt:
      "Shift Anna's visit to tomorrow; also book a haircut for Bob",
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Bob',
    expectCreateServiceName: 'haircut',
  },
  {
    id: 'e2e284-move-and-book-another',
    prompt:
      "Move Sam's appointment to Friday and book another massage for Anna",
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Anna',
    expectCreateServiceName: 'massage',
  },
  {
    id: 'e2e284-change-time-then-book',
    prompt:
      'Change time of the appointment to Friday; then book a massage for Anna',
    expectCompound: true,
    orderedActions: ['reschedule_booking', 'create_booking'],
    expectCreateCustomerName: 'Anna',
    expectCreateServiceName: 'massage',
  },
];

/** Must NOT match — single reschedule / other compounds. */
export const E2E284_NEGATIVE_CASES: readonly E2e284CompoundCase[] = [
  {
    id: 'e2e284-neg-put-it-nearest',
    prompt:
      "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
    expectCompound: false,
    note: 'e2e-bug.267 single reschedule continuation',
  },
  {
    id: 'e2e284-neg-move-nearest-only',
    prompt:
      "Move Gevorg's appointment on June 1 to June 2 nearest free time",
    expectCompound: false,
  },
  {
    id: 'e2e284-neg-create-only',
    prompt: 'Book a massage for Anna on Friday',
    expectCompound: false,
  },
  {
    id: 'e2e284-neg-cancel-waitlist',
    prompt: 'Cancel package visit; fill waitlist',
    expectCompound: false,
  },
  {
    id: 'e2e284-neg-reschedule-and-message',
    prompt:
      'Reschedule Anna appointment to tomorrow; also message her about the change',
    expectCompound: false,
  },
];

export const E2E284_RESCUE_FROM_ACTIONS = [
  'unknown',
  'create_booking',
  'reschedule_booking',
  'book_nearest_slot',
  'find_soonest_appointment',
] as const;
