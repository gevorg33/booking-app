import { MULTI_SERVICE_DAY_CUSTOMER_PROMPTS } from './ai-multi-service-day-compound.fixtures.js';
import { MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS } from './ai-multi-service-day-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { MULTI_SERVICE_DAY_RECIPE_ID } from './ai-multi-service-day-compound.util.js';

describe('AiMultiServiceDayCompound integration (ai-cmd-customer-4.8.5)', () => {
  it('registers customer_multi_service_day golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_multi_service_day',
      )?.recipeId,
    ).toBe(MULTI_SERVICE_DAY_RECIPE_ID);
  });

  it.each(MULTI_SERVICE_DAY_CUSTOMER_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(MULTI_SERVICE_DAY_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.serviceNames) {
        expect(result?.steps[0].params.serviceNames).toEqual(
          expect.arrayContaining(expectedParams.serviceNames as string[]),
        );
      }
    },
  );

  it.each(MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface multilingual $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(MULTI_SERVICE_DAY_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('book-only does not route to multi_service_day', () => {
    const result = decomposeDeterministicForSurface(
      'customer',
      'Book massage and facial together',
    );
    expect(result?.recipeId).not.toBe(MULTI_SERVICE_DAY_RECIPE_ID);
  });

  it.each(MULTI_SERVICE_DAY_CUSTOMER_PROMPTS.slice(0, 2))(
    'isCompoundPrompt routes $id',
    ({ prompt }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(MULTI_SERVICE_DAY_RECIPE_ID);
    },
  );
});
