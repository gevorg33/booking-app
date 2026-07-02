import {
  BUDGET_DISAMBIGUATION_SCENARIOS,
  SIMILAR_BUDGET_SERVICE_PROMPTS,
} from './ai-budget-service-discovery.fixtures.js';
import {
  buildBudgetCompoundSharedParams,
  decomposeBudgetServiceDiscoveryCompoundPrompt,
  isBudgetServiceDiscoveryCompoundPrompt,
} from './ai-budget-service-discovery-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';

const COMPOUND_SCENARIOS = SIMILAR_BUDGET_SERVICE_PROMPTS.filter(
  (scenario) =>
    scenario.publicCompoundSteps?.length ||
    scenario.customerCompoundSteps?.length,
);

describe('ai-budget-service-discovery-compound.util (budget-1.7)', () => {
  it.each(COMPOUND_SCENARIOS)(
    'detects budget compound prompt $id',
    ({ prompt }) => {
      expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(BUDGET_DISAMBIGUATION_SCENARIOS)(
    'does not treat disambiguation prompt $id as budget compound',
    ({ prompt }) => {
      expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(false);
    },
  );

  it.each(
    COMPOUND_SCENARIOS.filter(
      (scenario) => scenario.publicCompoundSteps?.length,
    ),
  )('decomposes public budget compound $id', (scenario) => {
    const steps = decomposeBudgetServiceDiscoveryCompoundPrompt(
      scenario.prompt,
      'public',
    );
    expect(steps.map((step) => step.action)).toEqual(
      scenario.publicCompoundSteps,
    );
    expect(steps[0]?.params.maxPrice).toBe(scenario.expectedParams?.maxPrice);
    expect(steps.at(-1)?.params.bookingFirstAvailable).toBe(true);
  });

  it.each(
    COMPOUND_SCENARIOS.filter(
      (scenario) => scenario.customerCompoundSteps?.length,
    ),
  )('decomposes customer budget compound $id', (scenario) => {
    const steps = decomposeBudgetServiceDiscoveryCompoundPrompt(
      scenario.prompt,
      'customer',
    );
    expect(steps.map((step) => step.action)).toEqual(
      scenario.customerCompoundSteps,
    );
    expect(steps[0]?.params.maxPrice).toBe(scenario.expectedParams?.maxPrice);
  });

  it('buildBudgetCompoundSharedParams extracts maxPrice and booking hints', () => {
    const params = buildBudgetCompoundSharedParams(
      'Book a haircut under $50 tomorrow, nearest slot',
      'public',
    );
    expect(params.maxPrice).toBe(50);
    expect(params.bookingFirstAvailable).toBe(true);
    expect(params.serviceCategory ?? params.serviceName).toBeTruthy();
  });

  it.each(COMPOUND_SCENARIOS)(
    'golden deterministic decomposition for public $id',
    (scenario) => {
      if (!scenario.publicCompoundSteps?.length) return;
      const result = decomposeDeterministicForSurface(
        'public',
        scenario.prompt,
      );
      expect(result?.steps.map((step) => step.action)).toEqual(
        scenario.publicCompoundSteps,
      );
      expect(result?.source).toBe('golden');
    },
  );

  it.each(COMPOUND_SCENARIOS)(
    'golden deterministic decomposition for customer $id',
    (scenario) => {
      if (!scenario.customerCompoundSteps?.length) return;
      const result = decomposeDeterministicForSurface(
        'customer',
        scenario.prompt,
      );
      expect(result?.steps.map((step) => step.action)).toEqual(
        scenario.customerCompoundSteps,
      );
      expect(result?.source).toBe('golden');
    },
  );
});
