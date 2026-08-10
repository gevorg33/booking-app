import {
  GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS,
  GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS,
  GIFT_CARD_CHECKOUT_NEGATIVE_PROMPTS,
  GIFT_CARD_CHECKOUT_RESCUE_SCENARIOS,
} from './ai-gift-card-checkout-compound.fixtures.js';
import { GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-gift-card-checkout-compound-multilingual.fixtures.js';
import {
  buildGiftCardCheckoutCompoundParams,
  decomposeGiftCardCheckoutCompoundPrompt,
  hasGiftCardCheckoutBookCue,
  hasGiftCardCheckoutGiftCue,
  isBookFirstGiftCardCheckoutPrompt,
  isGiftCardCheckApplyBookCompoundPrompt,
  rescueGiftCardCheckoutCompoundIntent,
} from './ai-gift-card-checkout-compound.util.js';
import { isBookWithGiftCardPrompt } from './ai-book-with-gift-card.util.js';

describe('ai-gift-card-checkout-compound.util (ai-cmd-customer-4.8.4)', () => {
  it.each(GIFT_CARD_CHECKOUT_CUSTOMER_PROMPTS)(
    'isGiftCardCheckApplyBookCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isGiftCardCheckApplyBookCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(GIFT_CARD_CHECKOUT_COMPOUND_PROMPTS)(
    'decomposeGiftCardCheckoutCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeGiftCardCheckoutCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(3);
      if (expectedParams?.giftCardCode) {
        expect(steps[0].params.giftCardCode).toBe(expectedParams.giftCardCode);
        expect(steps[1].params.giftCardCode).toBe(expectedParams.giftCardCode);
      }
      if (expectedParams?.serviceName) {
        expect(steps[2].params.serviceName).toBe(expectedParams.serviceName);
      }
      if (expectedParams?.bookingFirstAvailable) {
        expect(steps[2].params.bookingFirstAvailable).toBe(true);
      }
    },
  );

  it.each(GIFT_CARD_CHECKOUT_MULTILINGUAL_SCENARIOS)(
    'decomposeGiftCardCheckoutCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeGiftCardCheckoutCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(GIFT_CARD_CHECKOUT_RESCUE_SCENARIOS)(
    'rescueGiftCardCheckoutCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueGiftCardCheckoutCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'gift_card_checkout_compound',
      });
    },
  );

  it.each(GIFT_CARD_CHECKOUT_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isGiftCardCheckApplyBookCompoundPrompt(prompt)).toBe(false);
      expect(decomposeGiftCardCheckoutCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('check-balance-only stays on check_gift_card_balance path', () => {
    const prompt = 'Check gift card GCM-ABCD1234 balance';
    expect(hasGiftCardCheckoutBookCue(prompt)).toBe(false);
    expect(isGiftCardCheckApplyBookCompoundPrompt(prompt)).toBe(false);
    expect(isBookWithGiftCardPrompt(prompt)).toBe(false);
  });

  it('buildGiftCardCheckoutCompoundParams extracts code and service', () => {
    const params = buildGiftCardCheckoutCompoundParams(
      'Use gift card GCM-ABCD1234 and book nearest haircut',
    );
    expect(params.giftCardCode).toBe('GCM-ABCD1234');
    expect(params.serviceName).toBe('haircut');
    expect(params.bookingFirstAvailable).toBe(true);
  });

  it('rescueGiftCardCheckoutCompoundIntent returns null for non-compound', () => {
    expect(
      rescueGiftCardCheckoutCompoundIntent(
        'Check gift card GCM-ABCD1234 balance',
        'check_gift_card_balance',
      ),
    ).toBeNull();
  });

  it('isBookFirstGiftCardCheckoutPrompt detects legacy book-first flow', () => {
    expect(
      isBookFirstGiftCardCheckoutPrompt(
        'Book nearest slot for massage and apply gift card GCM-ABCD1234',
      ),
    ).toBe(true);
  });

  it('detects heuristic use-code book without fixture id', () => {
    const prompt =
      'Use gift card GCM-HEUR99 and schedule the earliest available manicure';
    expect(isGiftCardCheckApplyBookCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeGiftCardCheckoutCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'check_gift_card_balance',
      'apply_gift_card_code',
      'book_nearest_slot',
    ]);
  });
});
