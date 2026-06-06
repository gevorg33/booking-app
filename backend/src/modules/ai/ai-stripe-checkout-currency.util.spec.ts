import { EXPLAIN_STRIPE_CHECKOUT_CURRENCY_PROMPTS } from './ai-stripe-checkout-currency.fixtures.js';
import {
  isExplainStripeCheckoutCurrencyPrompt,
  isStripeCheckoutCurrencyIntent,
  rescueStripeCheckoutCurrencyIntent,
} from './ai-stripe-checkout-currency.util.js';

describe('ai-stripe-checkout-currency.util (ai-cmd-curr-11)', () => {
  it.each(EXPLAIN_STRIPE_CHECKOUT_CURRENCY_PROMPTS)(
    'detects explain stripe checkout currency prompt $id',
    ({ prompt }) => {
      expect(isExplainStripeCheckoutCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not steal explain_checkout_total breakdown prompts', () => {
    expect(
      isExplainStripeCheckoutCurrencyPrompt(
        'Explain the checkout total for my Stripe session',
      ),
    ).toBe(false);
  });

  it('does not steal catalog display currency prompts', () => {
    expect(
      isExplainStripeCheckoutCurrencyPrompt(
        'Why do prices show euros on the booking page?',
      ),
    ).toBe(false);
  });

  it('does not steal dashboard Settings Stripe warning prompts', () => {
    expect(
      isExplainStripeCheckoutCurrencyPrompt(
        'Why does Settings show a Stripe Connect warning for our currency?',
      ),
    ).toBe(false);
  });

  it('does not steal explain_why_stripe_required prompts', () => {
    expect(
      isExplainStripeCheckoutCurrencyPrompt('Why is Stripe required for checkout?'),
    ).toBe(false);
  });

  it('does not rescue when action is already explain_stripe_checkout_currency', () => {
    expect(
      rescueStripeCheckoutCurrencyIntent(
        'Why was I charged in euros on Stripe checkout?',
        'explain_stripe_checkout_currency',
      ),
    ).toBeNull();
  });

  it('rescues misclassified stripe checkout currency prompts', () => {
    expect(
      rescueStripeCheckoutCurrencyIntent(
        'Why was I charged in euros on Stripe checkout?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_stripe_checkout_currency',
      rescueReason: 'explain_stripe_checkout_currency',
    });
  });

  it('recognizes stripe checkout currency intent id', () => {
    expect(
      isStripeCheckoutCurrencyIntent('explain_stripe_checkout_currency'),
    ).toBe(true);
    expect(isStripeCheckoutCurrencyIntent('explain_checkout_currency')).toBe(
      false,
    );
  });
});
