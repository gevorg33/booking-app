import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { IntentCandidate } from './command-understanding.types.js';

export type MergeRerankScenario = {
  id: string;
  heuristics: IntentCandidate[];
  classifier: ClassifiedIntent | null;
  semantic: IntentCandidate | null;
  expectedWinnerSource: IntentCandidate['source'];
  expectedAction: string;
  expectAmbiguous?: boolean;
};

const heuristic = (
  action: string,
  confidence: number,
  paramHints?: Record<string, unknown>,
): IntentCandidate => ({
  action,
  confidence,
  source: 'fast_heuristic',
  paramHints,
  reasoning: 'heuristic fixture',
});

const semantic = (
  action: string,
  confidence: number,
  paramHints?: Record<string, unknown>,
): IntentCandidate => ({
  action,
  confidence,
  source: 'semantic_match',
  paramHints,
  anchorId: `anchor-${action}`,
  reasoning: 'semantic fixture',
  rescueReason: 'semantic_match',
});

/** Three-source merge scenarios for pipe-1.4.5. */
export const MERGE_RERANK_SCENARIOS: MergeRerankScenario[] = [
  {
    id: 'semantic-wins-over-unknown-classifier',
    heuristics: [heuristic('show_appointments', 0.93)],
    classifier: {
      action: 'unknown',
      params: {},
      reasoning: 'classify',
      confidence: 0.2,
    },
    semantic: semantic('create_booking', 0.88, { bookingFirstAvailable: true }),
    expectedWinnerSource: 'semantic_match',
    expectedAction: 'create_booking',
  },
  {
    id: 'classifier-beats-lower-semantic',
    heuristics: [],
    classifier: {
      action: 'create_booking',
      params: {},
      reasoning: 'classify',
      confidence: 0.95,
    },
    semantic: semantic('check_providers_for_service', 0.72),
    expectedWinnerSource: 'classifier',
    expectedAction: 'create_booking',
  },
  {
    id: 'phase1-defers-heuristic-when-classifier-resolved',
    heuristics: [heuristic('show_appointments', 0.94)],
    classifier: {
      action: 'create_booking',
      params: {},
      reasoning: 'classify',
      confidence: 0.91,
    },
    semantic: semantic('create_booking', 0.89, { bookingFirstAvailable: true }),
    expectedWinnerSource: 'classifier',
    expectedAction: 'create_booking',
  },
  {
    id: 'ambiguous-classifier-vs-semantic-within-margin',
    heuristics: [],
    classifier: {
      action: 'create_booking',
      params: {},
      reasoning: 'classify',
      confidence: 0.7,
    },
    semantic: semantic('check_providers_for_service', 0.68),
    expectedWinnerSource: 'classifier',
    expectedAction: 'create_booking',
    expectAmbiguous: true,
  },
  {
    id: 'heuristic-wins-when-only-unknown-classifier',
    heuristics: [
      heuristic('check_providers_for_service', 0.93, { allProviders: true }),
    ],
    classifier: {
      action: 'unknown',
      params: {},
      reasoning: 'classify',
      confidence: 0.15,
    },
    semantic: null,
    expectedWinnerSource: 'fast_heuristic',
    expectedAction: 'check_providers_for_service',
  },
];
