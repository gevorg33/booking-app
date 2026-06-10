import {
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES,
  flexibleAvailabilityScenarioEligibleForEval,
  flexibleAvailabilityScenarioToEvalCase,
  flexibleAvailabilitySurfacesForScenario,
  mapFlexibleAvailabilityActionForSurface,
} from './ai-flexible-availability.eval.util.js';
import { SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS } from './ai-flexible-availability.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai flexible availability eval cases (avail-1.11)', () => {
  it('maps eligible fixture ids to public and customer eval rows', () => {
    const evalIds = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES.map(
      (entry) => entry.id,
    );

    for (const scenario of SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS) {
      for (const surface of flexibleAvailabilitySurfacesForScenario(scenario)) {
        if (!flexibleAvailabilityScenarioEligibleForEval(scenario, surface)) {
          continue;
        }
        const evalCase = flexibleAvailabilityScenarioToEvalCase(
          scenario,
          surface,
        );
        expect(evalIds).toContain(evalCase.id);
      }
    }
  });

  it('tags public and customer eval surfaces only', () => {
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.every(
        (entry) => entry.surface === 'public',
      ),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.every(
        (entry) => entry.surface === 'customer',
      ),
    ).toBe(true);
    expect(AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES.length).toBeGreaterThanOrEqual(
      16,
    );
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.length,
    ).toBeGreaterThanOrEqual(8);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.length,
    ).toBeGreaterThanOrEqual(8);
  });

  it('keeps public and customer eval parity for both-surface fixtures', () => {
    const publicIds = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map(
      (entry) => entry.id.replace('avail-public-', ''),
    );
    const customerIds = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map(
      (entry) => entry.id.replace('avail-customer-', ''),
    );
    expect(publicIds.sort()).toEqual(customerIds.sort());
  });

  it.each(AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES)(
    'passes deterministic eval $id',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it('maps customer check actions from public fixture verbs', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-or-tomorrow-friday-en',
    )!;
    expect(
      mapFlexibleAvailabilityActionForSurface(scenario, 'customer'),
    ).toBe('check_providers_for_service');
    expect(mapFlexibleAvailabilityActionForSurface(scenario, 'public')).toBe(
      'check_availability',
    );
  });

  it('maps budget OR compound to flexible availability recipe', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-check-then-book-or-en',
    )!;
    const evalCase = flexibleAvailabilityScenarioToEvalCase(scenario, 'public');
    expect(evalCase.expect.compoundRecipeId).toBe(
      'public_flexible_availability_budget_compound',
    );
    expect(evalCase.expect.compoundSteps).toEqual([
      'check_availability',
      'book_appointment',
    ]);
    expect(evalCase.expect.compoundStepParams?.[0]?.paramsPartial).toMatchObject({
      maxPrice: 50,
      serviceCategory: 'haircut',
    });
  });
});
