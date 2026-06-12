import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { IntentCandidate } from './command-understanding.types.js';

export type FastHeuristicRerankScenario = {
  id: string;
  heuristic: IntentCandidate;
  classifier: ClassifiedIntent;
  expectedWinnerSource: IntentCandidate['source'];
  expectedAction: string;
};

const fast = (
  action: string,
  confidence: number,
  paramHints?: Record<string, unknown>,
): IntentCandidate => ({
  action,
  confidence,
  source: 'fast_heuristic',
  paramHints,
  reasoning: 'fast heuristic fixture',
});

export const FAST_HEURISTIC_RERANK_SCENARIOS: FastHeuristicRerankScenario[] = [
  {
    id: 'phase1-classifier-beats-heuristic',
    heuristic: fast('show_appointments', 0.93),
    classifier: {
      action: 'create_booking',
      params: {},
      reasoning: 'classify',
      confidence: 0.95,
    },
    expectedWinnerSource: 'classifier',
    expectedAction: 'create_booking',
  },
  {
    id: 'phase1-heuristic-wins-when-classifier-unknown',
    heuristic: fast('check_providers_for_service', 0.93, {
      allProviders: true,
    }),
    classifier: {
      action: 'unknown',
      params: {},
      reasoning: 'classify',
      confidence: 0.2,
    },
    expectedWinnerSource: 'fast_heuristic',
    expectedAction: 'check_providers_for_service',
  },
  {
    id: 'low-confidence-heuristic-excluded-from-rerank',
    heuristic: fast('unknown', 0.85, { complexityTier: 'read_only' }),
    classifier: {
      action: 'unknown',
      params: {},
      reasoning: 'classify',
      confidence: 0.2,
    },
    expectedWinnerSource: 'classifier',
    expectedAction: 'unknown',
  },
];
