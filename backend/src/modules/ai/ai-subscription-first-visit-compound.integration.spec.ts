import { SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS } from './ai-subscription-first-visit-compound.fixtures.js';
import { SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS } from './ai-subscription-first-visit-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { SUBSCRIPTION_FIRST_VISIT_RECIPE_ID } from './ai-subscription-first-visit-compound.util.js';
import { isUseSubscriptionCreditPrompt } from './ai-self-service-booking.util.js';
import { isExplainMySubscriptionPrompt } from './ai-explain-my-subscription.util.js';

describe('AiSubscriptionFirstVisitCompound integration (ai-cmd-customer-4.21.4)', () => {
  it('registers customer_subscription_first_visit golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_subscription_first_visit',
      )?.recipeId,
    ).toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
  });

  it.each(SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, serviceName }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (serviceName) {
        expect(result?.steps[1].params.serviceName).toBe(serviceName);
      }
    },
  );

  it.each(SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('credit-only does not route to subscription_first_visit', () => {
    const prompt = 'Use subscription credit';
    expect(isUseSubscriptionCreditPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).not.toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
  });

  it.each(SUBSCRIPTION_FIRST_VISIT_COMPOUND_PROMPTS.slice(0, 2))(
    'wins over single use_subscription_credit when booking present $id',
    ({ prompt }) => {
      expect(isUseSubscriptionCreditPrompt(prompt)).toBe(false);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
      expect(result?.steps).toHaveLength(2);
    },
  );

  it('explain-only does not route to subscription_first_visit', () => {
    const prompt = 'How many visits left on my plan?';
    expect(isExplainMySubscriptionPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).not.toBe(SUBSCRIPTION_FIRST_VISIT_RECIPE_ID);
  });
});
