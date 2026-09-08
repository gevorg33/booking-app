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
  SERVICE_RANK_EXTRACTION_SCENARIOS,
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

  it('maps rank-mid-range-en to price-sorted list without serviceRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-mid-range-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_mid_range_list');
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceCategory: 'color',
      limit: 3,
    });
  });

  it('maps rank-voice-premium-en to customer highest_price haircut', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-voice-premium-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      scenario,
      'customer',
    );
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_list_services');
      // e2e-bug.524 — 'Premium cut?' says "cut", never "haircut", and
      // RANK_SERVICE_CATEGORY_ALIASES deliberately does NOT alias bare
      // 'cut' -> 'haircut' (e2e-bug.323: pre-aliasing discards the raw token
      // before matchServicesByQuery runs, so its literal-substring-first
      // expansion can no longer prefer real rows named "Men's cut"). Only the
      // plural folds, 'cuts' -> 'cut'. This expectation predates that decision.
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceRank: 'highest_price',
      serviceCategory: 'cut',
    });
  });

  it('maps rank-voice-cheapest-en to customer lowest_price facial', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-voice-cheapest-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      scenario,
      'customer',
    );
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_list_services');
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceRank: 'lowest_price',
      serviceCategory: 'facial',
    });
  });

  it('maps rank-session-upgrade-t2-en extraction to highest_price rank switch', () => {
    expect(
      SERVICE_RANK_EXTRACTION_SCENARIOS.find(
        (entry) => entry.id === 'rank-session-upgrade-t2-en',
      )?.serviceRank,
    ).toBe('highest_price');
  });

  it('maps rank-recommend-not-provider-en to list_services with highest_price spa', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-recommend-not-provider-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_recommend_specialists');
    expect(evalCase.expect.rescueFromAction).toBe('recommend_specialists');
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceRank: 'highest_price',
      serviceCategory: 'spa',
    });
  });

  it('maps rank-most-popular-en to list_services with most_popular + haircut', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-most-popular-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_list_services');
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceRank: 'most_popular',
      serviceCategory: 'haircut',
    });
  });

  it('maps rank-tier-metadata-en to tier filter without serviceRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-tier-metadata-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      scenario,
      'customer',
    );
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_tier_filter');
    expect(evalCase.expect.paramsPartial).toEqual({
      serviceTier: 'premium',
      serviceCategory: 'color',
    });
  });

  it('maps package misroutes to public booking_help', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-package-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('booking_help');
    expect(evalCase.expect.rescueReason).toBe('discover_packages');
    expect(evalCase.expect.useSurfaceRankRescue).toBe(true);
  });

  it('maps package misroutes to customer discover_packages', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-package-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(
      scenario,
      'customer',
    );
    expect(evalCase.expect.rescuedAction).toBe('discover_packages');
    expect(evalCase.expect.rescueReason).toBe('discover_packages');
    expect(evalCase.expect.useSurfaceRankRescue).toBe(true);
  });

  it('rescues recommend_specialists misroutes to list_services with serviceRank', () => {
    const scenario = SIMILAR_SERVICE_RANK_PROMPTS.find(
      (entry) => entry.id === 'rank-not-specialist-en',
    )!;
    const evalCase = serviceRankDiscoveryScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.rescuedAction).toBe('list_services');
    expect(evalCase.expect.rescueReason).toBe('rank_recommend_specialists');
    expect(evalCase.expect.paramsPartial?.serviceRank).toBe('highest_price');
  });
});
