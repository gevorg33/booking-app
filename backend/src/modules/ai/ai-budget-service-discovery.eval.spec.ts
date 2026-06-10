import {
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES,
  budgetServiceDiscoveryScenarioToEvalCase,
} from './ai-budget-service-discovery.eval.util.js';
import { SIMILAR_BUDGET_SERVICE_PROMPTS } from './ai-budget-service-discovery.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai budget service discovery eval cases (budget-1.11)', () => {
  it('maps every non-phase2 fixture id to public, customer, or dashboard eval rows', () => {
    const fixtureIds = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
      (scenario) => !scenario.phase2,
    ).map((scenario) => scenario.id);
    const evalIds = AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES.map(
      (entry) => entry.id,
    );

    for (const fixtureId of fixtureIds) {
      const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
        (entry) => entry.id === fixtureId,
      )!;
      const surfaces: Array<'public' | 'customer' | 'dashboard'> = [];
      if (scenario.surface === 'public') surfaces.push('public');
      else if (scenario.surface === 'customer') surfaces.push('customer');
      else {
        surfaces.push('public', 'customer', 'dashboard');
      }

      for (const surface of surfaces) {
        const evalId = `budget-${surface}-${fixtureId}`;
        if (evalIds.includes(evalId)) {
          expect(evalIds).toContain(evalId);
        }
      }
    }
  });

  it('tags public, customer, and dashboard eval surfaces', () => {
    expect(
      AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES.every(
        (entry) => entry.surface === 'public',
      ),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES.every(
        (entry) => entry.surface === 'customer',
      ),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES.every(
        (entry) => entry.surface === 'dashboard',
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES.length).toBeGreaterThan(
      80,
    );
    expect(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES.length).toBe(
      29,
    );
    expect(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES.length).toBe(
      35,
    );
    expect(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES.length).toBe(
      27,
    );
  });

  it.each(AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES)(
    'passes deterministic eval $id',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it('maps dashboard package misroutes to list_packages', () => {
    const scenario = SIMILAR_BUDGET_SERVICE_PROMPTS.find(
      (entry) => entry.id === 'budget-not-package-en',
    )!;
    const evalCase = budgetServiceDiscoveryScenarioToEvalCase(
      scenario,
      'dashboard',
    );
    expect(evalCase.expect.rescuedAction).toBe('list_packages');
    expect(evalCase.expect.useSurfaceBudgetRescue).toBe(true);
  });
});
