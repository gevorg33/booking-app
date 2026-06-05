import { COMPOUND_DECOMPOSITION_SCENARIOS } from '../intent-decomposition.fixtures.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';
import { ALL_DASHBOARD_OPS_SCENARIOS } from '../ai-dashboard-ops.fixtures.js';
import {
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_COMPOUND_CASES,
  AI_COMMAND_EVAL_DASHBOARD_OPS_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
  AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
  compoundScenarioToEvalCase,
} from './ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.cases (ai-cmd-0.4)', () => {
  it('maps golden customer scenario with promo param checks', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'customer_golden_book_package_promo',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.id).toBe('compound-customer_golden_book_package_promo');
    expect(evalCase.expect.compoundSource).toBe('golden');
    expect(evalCase.expect.compoundRecipeId).toBe(
      'customer_self_service_compound',
    );
    expect(evalCase.expect.compoundSteps).toEqual([
      'book_package',
      'promo_code_help',
    ]);
    expect(evalCase.expect.compoundStepParams).toEqual([
      { stepIndex: 1, paramsPartial: { promoCode: 'SPRING25' } },
    ]);
  });

  it('maps golden dashboard scenario with operational recipe id', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'dashboard_golden_cancel_notify_waitlist',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundRecipeId).toBe(
      'dashboard_operational_compound',
    );
    expect(evalCase.expect.compoundSource).toBe('golden');
    expect(evalCase.expect.routeTier).toBe('compound');
  });

  it('sets route tier only when compound markers are present', () => {
    const withoutMarkers = compoundScenarioToEvalCase({
      id: 'test_and_only_decompose',
      surface: 'dashboard',
      prompt: 'List gift card orders and print packing slip',
      minSteps: 2,
    });
    expect(
      isCompoundPrompt('List gift card orders and print packing slip'),
    ).toBe(false);
    expect(withoutMarkers.expect.routeTier).toBeUndefined();
    expect(withoutMarkers.expect.compoundMinSteps).toBe(2);

    const withCompound = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'dashboard_compound_then_split',
    )!;
    expect(compoundScenarioToEvalCase(withCompound).expect.routeTier).toBe(
      'compound',
    );
  });

  it('maps empty compound scenarios without route tier', () => {
    const scenario = COMPOUND_DECOMPOSITION_SCENARIOS.find(
      (entry) => entry.id === 'non_compound_short_prompt',
    )!;
    const evalCase = compoundScenarioToEvalCase(scenario);
    expect(evalCase.expect.compoundExpectEmpty).toBe(true);
    expect(evalCase.expect.routeTier).toBeUndefined();
  });

  it('maps param checks without explicit values', () => {
    const evalCase = compoundScenarioToEvalCase({
      id: 'test_param_key_only',
      surface: 'customer',
      prompt: 'Book spa day package and apply promo code WELCOME',
      orderedActions: ['book_package', 'promo_code_help'],
      paramChecks: [{ stepIndex: 0, key: 'packageId' }],
    });
    expect(evalCase.expect.compoundStepParams).toEqual([
      { stepIndex: 0, paramsPartial: undefined },
    ]);
  });

  it('keeps deterministic suite ids unique', () => {
    const ids = AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes compound, registry, and routing cases in deterministic suite', () => {
    expect(AI_COMMAND_EVAL_DETERMINISTIC_CASES.length).toBeGreaterThanOrEqual(
      AI_COMMAND_EVAL_CASES.length +
        AI_COMMAND_EVAL_COMPOUND_CASES.length +
        AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES.length +
        AI_COMMAND_EVAL_DASHBOARD_OPS_CASES.length,
    );
  });

  it('maps dashboard ops scenarios to eval golden cases', () => {
    expect(AI_COMMAND_EVAL_DASHBOARD_OPS_CASES).toHaveLength(
      ALL_DASHBOARD_OPS_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_DASHBOARD_OPS_CASES) {
      expect(evalCase.id).toMatch(/^dashboard-ops-/);
      expect(evalCase.expect.rescuedAction).toBeDefined();
    }
  });

  it('builds registry compound cases only from decomposable compound prompts', () => {
    for (const evalCase of AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES) {
      const surface = evalCase.expect.compoundSurface!;
      const result = decomposeDeterministicForSurface(surface, evalCase.prompt);
      expect(result?.steps.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(evalCase.id).toMatch(/^registry-compound-/);
    }
  });

  it('passes every compound scenario through eval runner', () => {
    for (const evalCase of AI_COMMAND_EVAL_COMPOUND_CASES) {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('documents LLM-only eval cases separately', () => {
    expect(AI_COMMAND_EVAL_LLM_CASES.every((entry) => entry.requiresLlm)).toBe(
      true,
    );
    expect(
      AI_COMMAND_EVAL_LLM_CASES.every((entry) => entry.expect.action),
    ).toBe(true);
  });
});
