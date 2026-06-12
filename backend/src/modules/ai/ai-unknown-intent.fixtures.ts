/** pipe-1.6.2 — self-verify failure → targeted clarify scenarios. */
export const UNKNOWN_INTENT_PIPE_MARKER = 'pipe-1.6.2';

/** pipe-1.8.1 — block unknown from handler switch → clarify. */
export const UNKNOWN_INTENT_GUARD_PIPE_MARKER = 'pipe-1.8.1';

export type UnknownIntentGuardFixtureScenario = {
  id: string;
  prompt: string;
  action: string;
  surface?: 'dashboard' | 'provider' | 'customer' | 'public';
  expectBlockHandler: boolean;
  expectedSuggestionsMin?: number;
};

export const UNKNOWN_INTENT_GUARD_SCENARIOS: UnknownIntentGuardFixtureScenario[] =
  [
    {
      id: 'unknown-action-blocks-handler',
      prompt: 'maybe do something with the thing tomorrow',
      action: 'unknown',
      expectBlockHandler: true,
      expectedSuggestionsMin: 2,
    },
    {
      id: 'empty-action-blocks-handler',
      prompt: 'help',
      action: '',
      expectBlockHandler: true,
      expectedSuggestionsMin: 2,
    },
    {
      id: 'resolved-booking-continues',
      prompt: 'Book Anna for a haircut tomorrow at 3pm',
      action: 'create_booking',
      expectBlockHandler: false,
    },
    {
      id: 'resolved-clear-schedule-continues',
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'clear_schedule',
      expectBlockHandler: false,
    },
  ];

export type SelfVerifyClarifyFixtureScenario = {
  id: string;
  prompt: string;
  action: string;
  confidence: number;
  ruleId: 'booking_vs_clear_mismatch' | 'schedule_vocab_mismatch';
  reason: string;
  expectClarify: boolean;
  expectedClarifyFields: string[];
  expectedSuggestionsMin?: number;
};

export const SELF_VERIFY_CLARIFY_SCENARIOS: SelfVerifyClarifyFixtureScenario[] =
  [
    {
      id: 'ambiguous-block-schedule-low-confidence',
      prompt: 'Block Gevorg schedule tomorrow',
      action: 'create_booking',
      confidence: 0.42,
      ruleId: 'schedule_vocab_mismatch',
      reason: 'ambiguous_schedule_intent',
      expectClarify: true,
      expectedClarifyFields: ['intentChoice'],
      expectedSuggestionsMin: 2,
    },
    {
      id: 'ambiguous-fill-slot-low-confidence',
      prompt: 'Fill unused slots on Maria schedule Friday',
      action: 'create_booking',
      confidence: 0.38,
      ruleId: 'schedule_vocab_mismatch',
      reason: 'ambiguous_schedule_intent',
      expectClarify: true,
      expectedClarifyFields: ['intentChoice'],
      expectedSuggestionsMin: 2,
    },
    {
      id: 'uncorrectable-fail-high-confidence-no-clarify',
      prompt: 'Block Gevorg schedule tomorrow',
      action: 'create_booking',
      confidence: 0.72,
      ruleId: 'schedule_vocab_mismatch',
      reason: 'ambiguous_schedule_intent',
      expectClarify: false,
      expectedClarifyFields: [],
    },
    {
      id: 'correctable-fail-low-confidence-no-clarify',
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'create_booking',
      confidence: 0.4,
      ruleId: 'booking_vs_clear_mismatch',
      reason: 'booking_vs_clear_mismatch',
      expectClarify: false,
      expectedClarifyFields: [],
    },
  ];
