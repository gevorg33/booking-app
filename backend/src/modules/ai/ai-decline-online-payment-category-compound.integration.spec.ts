import { DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS } from './ai-decline-online-payment-category-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID } from './ai-decline-online-payment-category-compound.util.js';

describe('AiDeclineOnlinePaymentCategoryCompound integration (ai-cmd-ext-4.7)', () => {
  it('registers dashboard_decline_online_payment_category golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_decline_online_payment_category',
    );
    expect(pattern?.recipeId).toBe(DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID);
  });

  it.each(DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface $id',
    ({ prompt, orderedActions, categorySteps }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps).toHaveLength(categorySteps.length);
    },
  );
});
