import { PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS } from './ai-provider-same-day-multi-compound.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS } from './ai-provider-same-day-multi-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { PROVIDER_SAME_DAY_MULTI_RECIPE_ID } from './ai-provider-same-day-multi-compound.util.js';
import { isMultiServiceDayCompoundPrompt } from './ai-multi-service-day-compound.util.js';

describe('ai-provider-same-day-multi-compound integration (ai-cmd-customer-4.21.3)', () => {
  it('registers customer golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_provider_same_day_multi',
      )?.recipeId,
    ).toBe(PROVIDER_SAME_DAY_MULTI_RECIPE_ID);
  });

  it.each(PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, providerName }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(PROVIDER_SAME_DAY_MULTI_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps[0]?.params.providerName).toBe(providerName);
      expect(result?.steps[1]?.params.continueAfterProviderPick).toBe(true);
    },
  );

  it.each(PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(PROVIDER_SAME_DAY_MULTI_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('wins over multi_service_day when provider is named', () => {
    const prompt = 'Anna — massage and facial same afternoon';
    expect(isMultiServiceDayCompoundPrompt(prompt)).toBe(false);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).toBe(PROVIDER_SAME_DAY_MULTI_RECIPE_ID);
    expect(result?.steps).toHaveLength(3);
  });
});
