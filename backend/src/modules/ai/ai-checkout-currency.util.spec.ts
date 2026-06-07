import { EXPLAIN_CHECKOUT_CURRENCY_PROMPTS } from './ai-checkout-currency.fixtures.js';
import {
  isCheckoutCurrencyIntent,
  isExplainCheckoutCurrencyPrompt,
  rescueCheckoutCurrencyIntent,
} from './ai-checkout-currency.util.js';

describe('ai-checkout-currency.util (ai-cmd-curr-5)', () => {
  it.each(EXPLAIN_CHECKOUT_CURRENCY_PROMPTS)(
    'detects explain checkout currency prompt $id',
    ({ prompt }) => {
      expect(isExplainCheckoutCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal explain_checkout_total breakdown prompts', () => {
    expect(
      isExplainCheckoutCurrencyPrompt('Explain the checkout total for my cart'),
    ).toBe(false);
    expect(
      rescueCheckoutCurrencyIntent(
        'Explain the checkout total for my cart',
        'unknown',
      ),
    ).toBeNull();
  });

  it('does not rescue when action is already explain_checkout_currency', () => {
    expect(
      rescueCheckoutCurrencyIntent(
        'Why do prices show euros on the booking page?',
        'explain_checkout_currency',
      ),
    ).toBeNull();
  });

  it('rescues misclassified booking-page currency prompts', () => {
    expect(
      rescueCheckoutCurrencyIntent(
        'Why do prices show euros on the booking page?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_checkout_currency',
      rescueReason: 'explain_checkout_currency',
    });
  });

  it('recognizes checkout currency intent id', () => {
    expect(isCheckoutCurrencyIntent('explain_checkout_currency')).toBe(true);
    expect(isCheckoutCurrencyIntent('explain_business_currency')).toBe(false);
  });

  it('does not steal stripe online checkout currency prompts', () => {
    expect(
      isExplainCheckoutCurrencyPrompt(
        'Why was I charged in euros on Stripe checkout?',
      ),
    ).toBe(false);
  });

  it('does not steal package or gift-card currency prompts', () => {
    expect(
      isExplainCheckoutCurrencyPrompt(
        'Why is the spa package total in dollars?',
      ),
    ).toBe(false);
    expect(
      isExplainCheckoutCurrencyPrompt(
        'Why does the gift card total show euros?',
      ),
    ).toBe(false);
  });

  it('does not steal dashboard business currency explain prompts', () => {
    expect(
      isExplainCheckoutCurrencyPrompt('Which currency does the salon use?'),
    ).toBe(false);
    expect(
      isExplainCheckoutCurrencyPrompt('What is our default currency?'),
    ).toBe(false);
    expect(
      rescueCheckoutCurrencyIntent(
        'Which currency does the salon use?',
        'unknown',
      ),
    ).toBeNull();
  });
});
