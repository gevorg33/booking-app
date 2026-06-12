import type { CoreSemanticIntentAction } from './intent-anchor.bank.util.js';

export type IntentAnchorEnFirstScenario = {
  id: string;
  action: CoreSemanticIntentAction;
  expectedCanonicalEnAnchorId: string;
};

/** Canonical EN anchor id per core semantic intent (pipe-1.4.1). */
export const INTENT_ANCHOR_EN_FIRST_SCENARIOS: IntentAnchorEnFirstScenario[] = [
  {
    id: 'create-booking-en-first',
    action: 'create_booking',
    expectedCanonicalEnAnchorId: 'en-book-first-available',
  },
  {
    id: 'book-nearest-slot-en-first',
    action: 'book_nearest_slot',
    expectedCanonicalEnAnchorId: 'en-book-nearest-slot',
  },
  {
    id: 'check-providers-en-first',
    action: 'check_providers_for_service',
    expectedCanonicalEnAnchorId: 'en-check-who-free',
  },
  {
    id: 'create-direct-schedule-en-first',
    action: 'create_direct_schedule',
    expectedCanonicalEnAnchorId: 'en-set-work-hours',
  },
];
