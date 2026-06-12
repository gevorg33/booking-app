import {
  METRIC_RESOLVER_SEMANTIC_SCENARIOS,
  type MetricResolverSemanticScenario,
} from './metric-resolvers.semantic.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function metricResolverSemanticEvalCaseId(
  scenario: Pick<MetricResolverSemanticScenario, 'id'>,
): string {
  return `metric-resolver-semantic-${scenario.id}`;
}

export function metricResolverScenarioToEvalCase(
  scenario: MetricResolverSemanticScenario,
): AiCommandEvalCase {
  return {
    id: metricResolverSemanticEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useMetricResolverSemanticDetect: true,
      metricResolverKind: scenario.kind,
      metricResolverSemantic: scenario.mustDetect,
      metricResolverExpected: scenario.expectedMetric,
    },
  };
}

export const AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES: AiCommandEvalCase[] =
  METRIC_RESOLVER_SEMANTIC_SCENARIOS.map(metricResolverScenarioToEvalCase);
