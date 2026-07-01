import {
  AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES,
  metricResolverSemanticEvalCaseId,
} from './metric-resolvers.semantic.eval.util.js';
import { METRIC_RESOLVER_SEMANTIC_SCENARIOS } from './metric-resolvers.semantic.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('metric-resolvers semantic eval (acc-3.14)', () => {
  it('maps every semantic scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES.length).toBe(
      METRIC_RESOLVER_SEMANTIC_SCENARIOS.length,
    );
    for (const scenario of METRIC_RESOLVER_SEMANTIC_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === metricResolverSemanticEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES.map((row) => [row.id, row]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
