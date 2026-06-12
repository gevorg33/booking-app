import type { IntentCandidate } from './command-understanding.types.js';

export type SemanticRescueParamHintsScenario = {
  id: string;
  candidates: IntentCandidate[];
  expectedHints: Record<string, unknown>;
};

export const SEMANTIC_RESCUE_PARAM_HINTS_SCENARIOS: SemanticRescueParamHintsScenario[] =
  [
    {
      id: 'semantic-winner-booking-first-available',
      candidates: [
        {
          action: 'unknown',
          confidence: 0.2,
          source: 'classifier',
          params: {},
        },
        {
          action: 'create_booking',
          confidence: 0.88,
          source: 'semantic_match',
          paramHints: { bookingFirstAvailable: true },
          anchorId: 'en-implied-trim',
        },
        {
          action: 'show_appointments',
          confidence: 0.72,
          source: 'fast_heuristic',
          paramHints: { complexityTier: 'read_only' },
        },
      ],
      expectedHints: { bookingFirstAvailable: true },
    },
    {
      id: 'semantic-winner-picks-highest-confidence',
      candidates: [
        {
          action: 'create_booking',
          confidence: 0.75,
          source: 'semantic_match',
          paramHints: { bookingFirstAvailable: false },
          anchorId: 'low-conf',
        },
        {
          action: 'check_providers_for_service',
          confidence: 0.91,
          source: 'semantic_match',
          paramHints: { bookingFirstAvailable: true, allProviders: true },
          anchorId: 'high-conf',
        },
      ],
      expectedHints: { bookingFirstAvailable: true, allProviders: true },
    },
    {
      id: 'no-semantic-candidate',
      candidates: [
        {
          action: 'unknown',
          confidence: 0.2,
          source: 'classifier',
          params: {},
        },
      ],
      expectedHints: {},
    },
    {
      id: 'semantic-without-param-hints',
      candidates: [
        {
          action: 'create_booking',
          confidence: 0.9,
          source: 'semantic_match',
          anchorId: 'no-hints',
        },
      ],
      expectedHints: {},
    },
  ];
