import {
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_DASHBOARD_CASES,
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

  it('maps dashboard parity fixture to dashboard eval row', () => {
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_DASHBOARD_CASES.map(
        (entry) => entry.id,
      ),
    ).toContain('avail-dashboard-avail-dashboard-parity-en');
    const evalCase = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_DASHBOARD_CASES.find(
      (entry) => entry.id === 'avail-dashboard-avail-dashboard-parity-en',
    )!;
    expect(evalCase.surface).toBe('dashboard');
    expect(evalCase.expect.enrichedAction).toBe('check_providers_for_service');
    expect(evalCase.expect.paramsPartial).toMatchObject({
      serviceCategory: 'massage',
      allProviders: true,
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
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
    const bothSurfaceIds = new Set(
      SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.filter(
        (scenario) =>
          scenario.surface === 'both' || scenario.surface === undefined,
      )
        .filter((scenario) =>
          flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
        )
        .map((scenario) => scenario.id),
    );
    const publicIds = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map(
      (entry) => entry.id.replace('avail-public-', ''),
    ).filter((id) => bothSurfaceIds.has(id));
    const customerIds = AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map(
      (entry) => entry.id.replace('avail-customer-', ''),
    ).filter((id) => bothSurfaceIds.has(id));
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

  it('maps section J ASAP to public and customer book eval rows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-voice-asap-or-en',
    )!;
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
    ).toBe(true);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'customer'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map((entry) => entry.id),
    ).toContain('avail-public-avail-voice-asap-or-en');
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map((entry) => entry.id),
    ).toContain('avail-customer-avail-voice-asap-or-en');
  });

  it('maps section L any-provider to public and customer eval rows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-or-any-provider-en',
    )!;
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
    ).toBe(true);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'customer'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map((entry) => entry.id),
    ).toContain('avail-public-avail-or-any-provider-en');
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map((entry) => entry.id),
    ).toContain('avail-customer-avail-or-any-provider-en');
  });

  it('maps section L named-fallback to public and customer eval rows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-or-named-fallback-en',
    )!;
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
    ).toBe(true);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'customer'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map((entry) => entry.id),
    ).toContain('avail-public-avail-or-named-fallback-en');
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map((entry) => entry.id),
    ).toContain('avail-customer-avail-or-named-fallback-en');
  });

  it('maps section J imperative to public and customer eval rows', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-imperative-en',
    )!;
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
    ).toBe(true);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'customer'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map((entry) => entry.id),
    ).toContain('avail-public-avail-imperative-en');
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map((entry) => entry.id),
    ).toContain('avail-customer-avail-imperative-en');
  });

  it('maps section J consumer chip to customer-only eval row', () => {
    const scenario = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (entry) => entry.id === 'avail-voice-chip-en',
    )!;
    expect(flexibleAvailabilitySurfacesForScenario(scenario)).toEqual([
      'customer',
    ]);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'public'),
    ).toBe(false);
    expect(
      flexibleAvailabilityScenarioEligibleForEval(scenario, 'customer'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES.map((entry) => entry.id),
    ).toContain('avail-customer-avail-voice-chip-en');
    expect(
      AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES.map((entry) => entry.id),
    ).not.toContain('avail-public-avail-voice-chip-en');
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
