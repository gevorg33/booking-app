import {
  E2E80_APPLY_CODE_STILL_MATCHES,
  E2E80_FOR_SOMEONE_STILL_MATCHES,
  E2E80_PURCHASE_AND_QUOTE_SCENARIOS,
} from './ai-e2e80-gift-card-purchase-funnel.fixtures.js';
import { isBuyGiftCardForSomeonePrompt } from './ai-buy-gift-card-for-someone.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isApplyGiftCardCodePrompt,
  isBuyGiftCardPhysicalPrompt,
  isBuyGiftCardPrompt,
  isGetGiftCardQuotePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { CUSTOMER_BUY_GIFT_CARD_CLASSIFIER_RULES } from './ai-gift-card-payments.fixtures.js';

describe('e2e-bug.80 gift-card purchase/quote funnel', () => {
  const rescue = new AiIntentRescueService();

  it('customer classifier schema includes dedicated buy_gift_card rules', () => {
    const schema = buildCustomerClassifierSchema();
    expect(CUSTOMER_BUY_GIFT_CARD_CLASSIFIER_RULES).toMatch(
      /buy_gift_card: MUTATE/,
    );
    expect(schema).toContain(CUSTOMER_BUY_GIFT_CARD_CLASSIFIER_RULES);
    expect(schema).toContain('for myself');
    expect(schema).toContain('physical gift card for 75 dollars');
  });

  it.each(E2E80_PURCHASE_AND_QUOTE_SCENARIOS)(
    '$id: detectors prefer $expectedAction over apply/for-someone',
    ({ prompt, expectedAction }) => {
      expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(false);
      expect(isApplyGiftCardCodePrompt(prompt)).toBe(false);
      if (expectedAction === 'get_gift_card_quote') {
        expect(isGetGiftCardQuotePrompt(prompt)).toBe(true);
        expect(isBuyGiftCardPrompt(prompt)).toBe(false);
      } else if (expectedAction === 'buy_gift_card_physical') {
        expect(isBuyGiftCardPhysicalPrompt(prompt)).toBe(true);
        expect(isBuyGiftCardPrompt(prompt)).toBe(false);
      } else {
        expect(isBuyGiftCardPrompt(prompt)).toBe(true);
      }
      expect(rescuePaymentsIntent(prompt, 'apply_gift_card_code')?.action).toBe(
        expectedAction,
      );
    },
  );

  it.each(E2E80_PURCHASE_AND_QUOTE_SCENARIOS)(
    '$id: AiIntentRescueService remaps misroutes',
    ({ prompt, expectedAction, misclassifiedActions, amount }) => {
      for (const fromAction of misclassifiedActions) {
        const result = rescue.rescue({
          prompt,
          action: fromAction,
          params: {},
          surface: 'customer',
        });
        expect(result?.action).toBe(expectedAction);
        expect(result?.action).not.toBe('apply_gift_card_code');
        expect(result?.action).not.toBe('buy_gift_card_for_someone');
        if (amount != null) {
          expect(result?.params?.amount).toBe(amount);
        }
      }
    },
  );

  it.each(E2E80_APPLY_CODE_STILL_MATCHES)(
    '$id: apply_gift_card_code still matches',
    ({ prompt }) => {
      expect(isApplyGiftCardCodePrompt(prompt)).toBe(true);
      expect(isBuyGiftCardPrompt(prompt)).toBe(false);
      expect(isGetGiftCardQuotePrompt(prompt)).toBe(false);
    },
  );

  it.each(E2E80_FOR_SOMEONE_STILL_MATCHES)(
    '$id: buy_gift_card_for_someone still matches',
    ({ prompt }) => {
      expect(isBuyGiftCardForSomeonePrompt(prompt)).toBe(true);
      expect(isBuyGiftCardPrompt(prompt)).toBe(false);
    },
  );
});
