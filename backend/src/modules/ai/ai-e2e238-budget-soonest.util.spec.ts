import {
  enrichListServicesParamsFromPrompt,
  extractServiceTypeKeywordFromListPrompt,
  sanitizeListServicesFilterValue,
} from './ai-orchestration.helpers.js';

/**
 * e2e-bug.238 — budget/flex compound must not treat "soonest"/"nearest" as a
 * list_services catalog filter. Compound util imports are exercised via dist to
 * avoid the pre-existing payments→fixtures circular init in Jest.
 */
const E2E238_BUDGET_SOONEST_SCENARIOS = [
  {
    id: 'e2e238-show-evening-massage-soonest',
    prompt: 'Show me evening massage options under $100 then book the soonest',
    expectedCategory: 'massage',
    maxPrice: 100,
  },
  {
    id: 'e2e238-show-evening-massage-nearest',
    prompt: 'Show me evening massage options under $100 then book the nearest',
    expectedCategory: 'massage',
    maxPrice: 100,
  },
  {
    id: 'e2e238-list-massage-soonest-available',
    prompt: 'list massage under $100 then book the soonest available',
    expectedCategory: 'massage',
    maxPrice: 100,
  },
  {
    id: 'e2e238-show-facial-options-soonest',
    prompt: 'Show me facial options under $60 then book the soonest',
    expectedCategory: 'facial',
    maxPrice: 60,
  },
] as const;

describe('e2e-bug.238 budget soonest vs list_services filter', () => {
  it.each(['soonest', 'nearest', 'next available', 'soonest available'] as const)(
    'sanitize drops availability filler %s',
    (filler) => {
      expect(sanitizeListServicesFilterValue(filler)).toBeNull();
    },
  );

  it.each(E2E238_BUDGET_SOONEST_SCENARIOS.map((row) => [row.id, row] as const))(
    'extracts real category for $id',
    (_id, row) => {
      expect(extractServiceTypeKeywordFromListPrompt(row.prompt)).toBe(
        row.expectedCategory,
      );
      expect(
        enrichListServicesParamsFromPrompt(row.prompt, {
          serviceCategory: 'soonest',
        }),
      ).toEqual({ serviceCategory: row.expectedCategory });
    },
  );

  it.each(E2E238_BUDGET_SOONEST_SCENARIOS.map((row) => [row.id, row] as const))(
    'compound shared params keep $id category (dist)',
    (_id, row) => {
      const {
        buildBudgetCompoundSharedParams,
        decomposeBudgetServiceDiscoveryCompoundPrompt,
        isBudgetServiceDiscoveryCompoundPrompt,
      } = require(
        `${process.cwd()}/dist/modules/ai/ai-budget-service-discovery-compound.util.js`,
      ) as typeof import('./ai-budget-service-discovery-compound.util.js');

      expect(isBudgetServiceDiscoveryCompoundPrompt(row.prompt)).toBe(true);
      const params = buildBudgetCompoundSharedParams(row.prompt, 'customer');
      expect(params.maxPrice).toBe(row.maxPrice);
      expect(params.serviceCategory).toBe(row.expectedCategory);
      expect(String(params.serviceCategory)).not.toMatch(
        /soonest|nearest|available/i,
      );
      const steps = decomposeBudgetServiceDiscoveryCompoundPrompt(
        row.prompt,
        'customer',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'list_services',
        'book_nearest_slot',
      ]);
      expect(steps[0]?.params.serviceCategory).toBe(row.expectedCategory);
    },
  );

  it('bare book-the-soonest does not invent a service filter (dist)', () => {
    const { buildBudgetCompoundSharedParams } = require(
      `${process.cwd()}/dist/modules/ai/ai-budget-service-discovery-compound.util.js`,
    ) as typeof import('./ai-budget-service-discovery-compound.util.js');
    const params = buildBudgetCompoundSharedParams(
      'Show options under $80 then book the soonest',
      'customer',
    );
    expect(params.maxPrice).toBe(80);
    expect(params.serviceCategory).toBeFalsy();
    expect(params.serviceName).toBeFalsy();
  });
});
