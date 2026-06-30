import { SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS } from './ai-setup-salon-checkout-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID } from './ai-setup-salon-checkout-compound.util.js';

describe('AiSetupSalonCheckoutCompound integration (ai-cmd-ext-4.5)', () => {
  it('registers dashboard_setup_salon_checkout golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_setup_salon_checkout',
    );
    expect(pattern?.recipeId).toBe(SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID);
  });

  it.each(SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.startOnboarding === false) {
        expect(result?.steps[0].params.startOnboarding).toBe(false);
      }
      if (expectedParams?.acceptCashPayments === true) {
        expect(result?.steps[1].params.acceptCashPayments).toBe(true);
      }
      if (expectedParams?.depositPercent === 50) {
        expect(result?.steps[2].params.depositPercent).toBe(50);
      }
    },
  );
});
