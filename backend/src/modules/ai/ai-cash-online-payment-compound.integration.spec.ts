import { CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS } from './ai-cash-online-payment-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID } from './ai-cash-online-payment-compound.util.js';
import { DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID } from './ai-decline-online-payment-category-compound.util.js';

const CASH_AND_ONLINE_ONLY_PROMPTS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (row) => row.compoundRecipeId === 'cash_and_online_payment',
  );

const CASH_AND_DECLINE_CATEGORY_PROMPTS =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (row) => row.compoundRecipeId === 'decline_online_payment_category',
  );

describe('AiCashAndOnlinePaymentCompound integration (ai-cmd-ext-5.6)', () => {
  it('registers dashboard_cash_and_online_payment golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_cash_and_online_payment',
    );
    expect(pattern?.recipeId).toBe(CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID);
  });

  it.each(CASH_AND_ONLINE_ONLY_PROMPTS)(
    'decomposeDeterministicForSurface cash_and_online $id',
    ({ prompt, orderedActions, paramChecks }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      paramChecks?.forEach((check) => {
        expect(result?.steps[check.stepIndex].params[check.key]).toBe(
          check.value,
        );
      });
    },
  );

  it.each(CASH_AND_DECLINE_CATEGORY_PROMPTS)(
    'decomposeDeterministicForSurface decline+cash $id',
    ({ prompt, orderedActions, paramChecks }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      paramChecks?.forEach((check) => {
        expect(result?.steps[check.stepIndex].params[check.key]).toBe(
          check.value,
        );
      });
    },
  );
});
