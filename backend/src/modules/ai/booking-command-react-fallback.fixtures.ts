import type { CommandResult } from './command-completion.types.js';
import type { ComplexityRoute } from './booking-command-graph.service.js';

/** pipe-1.9.2 — ReAct only after semantic + rescue still yields unknown. */
export const REACT_FALLBACK_PIPE_MARKER = 'pipe-1.9.2';

export type ReactFallbackFixtureScenario = {
  id: string;
  result: Pick<CommandResult, 'action' | 'success' | 'details'>;
  reactEnabled: boolean;
  complexityTier?: ComplexityRoute['tier'];
  expectFallback: boolean;
};

export const REACT_FALLBACK_SCENARIOS: ReactFallbackFixtureScenario[] = [
  {
    id: 'unknown-after-pipeline',
    result: {
      action: 'unknown',
      success: false,
      details: {
        needsClarification: true,
        pipelineStage: 'unknown_intent_clarify',
      },
    },
    reactEnabled: true,
    complexityTier: 'orchestration',
    expectFallback: true,
  },
  {
    id: 'resolved-booking-skips-react',
    result: {
      action: 'create_booking',
      success: true,
      details: {},
    },
    reactEnabled: true,
    complexityTier: 'orchestration',
    expectFallback: false,
  },
  {
    id: 'resolved-optimize-skips-react',
    result: {
      action: 'optimize_schedule',
      success: true,
      details: {},
    },
    reactEnabled: true,
    complexityTier: 'orchestration',
    expectFallback: false,
  },
  {
    id: 'unknown-react-disabled',
    result: { action: 'unknown', success: false, details: {} },
    reactEnabled: false,
    complexityTier: 'orchestration',
    expectFallback: false,
  },
  {
    id: 'unknown-compound-tier-skips-react',
    result: { action: 'unknown', success: false, details: {} },
    reactEnabled: true,
    complexityTier: 'compound',
    expectFallback: false,
  },
  {
    id: 'clarify-validation-skips-react',
    result: {
      action: 'create_booking',
      success: false,
      details: { needsClarification: true, pipelineStage: 'clarify' },
    },
    reactEnabled: true,
    complexityTier: 'simple_mutate',
    expectFallback: false,
  },
];
