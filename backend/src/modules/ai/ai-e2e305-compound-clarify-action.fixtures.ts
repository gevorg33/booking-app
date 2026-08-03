/**
 * e2e-bug.305 — mid-step compound clarify must expose action=compound_intent
 * (not the clarifying step alone). Step stays in details.compoundStep.
 */

export type E2e305ActionCase = {
  id: string;
  /** Simulated clarify before attach. */
  clarifyAction: string;
  stepIndex: number;
  compoundActions: string[];
  compoundStep: string;
  expectTopAction: 'compound_intent';
  expectCompoundStep: string;
};

export const E2E305_MIDSTEP_ACTION_CASES: readonly E2e305ActionCase[] = [
  {
    id: 'ai-e2e305-reschedule-then-create',
    clarifyAction: 'create_booking',
    stepIndex: 1,
    compoundActions: ['reschedule_booking', 'create_booking'],
    compoundStep: 'create_booking',
    expectTopAction: 'compound_intent',
    expectCompoundStep: 'create_booking',
  },
  {
    id: 'ai-e2e305-cancel-then-waitlist',
    clarifyAction: 'fill_slot_from_waitlist',
    stepIndex: 1,
    compoundActions: ['cancel_package_visit', 'fill_slot_from_waitlist'],
    compoundStep: 'fill_slot_from_waitlist',
    expectTopAction: 'compound_intent',
    expectCompoundStep: 'fill_slot_from_waitlist',
  },
  {
    id: 'ai-e2e305-check-then-book',
    clarifyAction: 'create_booking',
    stepIndex: 1,
    compoundActions: ['check_providers_for_service', 'create_booking'],
    compoundStep: 'create_booking',
    expectTopAction: 'compound_intent',
    expectCompoundStep: 'create_booking',
  },
] as const;

/** Live prompts expected to mid-step clarify (or full compound). */
export const E2E305_LIVE_COMPOUND_PROMPTS = [
  {
    id: 'live-move-then-book',
    prompt:
      "Move Gevorg's appointment to Friday; then book a second massage for Anna",
    expectActions: ['reschedule_booking', 'create_booking'],
  },
  {
    id: 'live-reschedule-then-facial',
    prompt: 'Reschedule Sam to Monday; then book a facial for Maria',
    expectActions: ['reschedule_booking', 'create_booking'],
  },
  {
    id: 'live-shift-also-book',
    prompt: "Shift Anna's visit to tomorrow; also book a haircut for Bob",
    expectActions: ['reschedule_booking', 'create_booking'],
  },
] as const;
