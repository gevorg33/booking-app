import { GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS } from './ai-gift-card-checkout-compound.fixtures.js';
import { GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-gift-card-checkout-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { GIFT_CARD_CHECKOUT_RECIPE_ID } from './ai-gift-card-checkout-compound.util.js';

describe('AiGiftCardCheckoutCompound integration (ai-cmd-customer-4.8.4)', () => {
  it('registers customer_gift_card_checkout golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_gift_card_checkout',
      )?.recipeId,
    ).toBe(GIFT_CARD_CHECKOUT_RECIPE_ID);
  });

  it.each(GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GIFT_CARD_CHECKOUT_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.giftCardCode) {
        expect(result?.steps[0].params.giftCardCode).toBe(
          expectedParams.giftCardCode,
        );
      }
      if (expectedParams?.serviceName) {
        expect(result?.steps[2].params.serviceName).toBe(
          expectedParams.serviceName,
        );
      }
    },
  );

  it.each(GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface multilingual $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GIFT_CARD_CHECKOUT_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('legacy book-apply-choose-payment does not route to gift_card_checkout', () => {
    const result = decomposeDeterministicForSurface(
      'customer',
      'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234 and choose payment method',
    );
    expect(result?.recipeId).not.toBe(GIFT_CARD_CHECKOUT_RECIPE_ID);
  });

  it.each(GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS.slice(0, 2))(
    'isCompoundPrompt routes $id',
    ({ prompt }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GIFT_CARD_CHECKOUT_RECIPE_ID);
    },
  );
});
