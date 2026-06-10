import {
  rankSurfacesForScenario,
  rankScenarioEligibleForEval,
  serviceRankDiscoveryScenarioToEvalCase,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES,
} from './ai-service-rank-discovery.eval.util.js';
import {
  SERVICE_RANK_COMPOUND_SCENARIOS,
  SIMILAR_SERVICE_RANK_PROMPTS,
} from './ai-service-rank-discovery.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai service rank discovery eval cases (rank-1.11)', () => {
  it('maps eligible fixture ids to public and customer eval rows', () => {
    const evalIds = AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES.map(
      (entry) => entry.id,
    );

    for (const scenario of SIMILAR_SERVICE_RANK_PROMPTS) {
      for (const surface of rankSurfacesForScenario(scenario)) {
        if (!rankScenarioEligibleForEval(scenario, surface)) continue;
        const evalCase = serviceRankDiscoveryScenarioToEvalCase(
          scenario,
          surface,
        );
        expect(evalIds).toContain(evalCase.id);
      }
    }

    for (const scenario of SERVICE_RANK_COMPOUND_SCENARIOS) {
      expect(evalIds).toContain(`rank-public-${scenario.id}`);
      expect(evalIds).toContain(`rank-customer-${scenario.id}`);
    }
  });

  it('tags public and customer eval surfaces only', () => {
    expect(
      AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES.every(
        (entry) => entry.surface === 'public',
      ),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES.every(
        (entry) => entry.surface === 'customer',
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES.length).toBeGreaterThan(
      50,
    );
  });

  it.each(AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES)(
    'passes deterministic eval $id',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it('maps package misroutes to public booking_help', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-package-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('booking_help');
    expect(evalCase.expect.useSurfaceRankRescue).toBe(true);
  });

  it('rescues recommend_specialists misroutes to list_services with serviceRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-specialist-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      scenario,
      'public',
    );
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_recommend_specialists');
    expect(evalCase.expect.paramsPartial?.serviceRank).toBe('highest_price');
  });
});
