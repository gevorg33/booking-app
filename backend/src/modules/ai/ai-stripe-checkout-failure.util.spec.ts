import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS } from './ai-stripe-checkout-failure.fixtures.js';
import {
  isDiagnoseStripeCheckoutFailurePrompt,
  isStripeCheckoutFailureIntent,
  rescueStripeCheckoutFailureIntent,
} from './ai-stripe-checkout-failure.util.js';
import { EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS } from './ai-stripe-currency-warning.fixtures.js';

describe('ai-stripe-checkout-failure.util (ai-cmd-curr-12)', () => {
  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS)(
    'detects diagnose stripe checkout failure prompt $id',
    ({ prompt }) => {
      expect(isDiagnoseStripeCheckoutFailurePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS)(
    'does not classify stripe currency warning prompt $id as checkout failure',
    ({ prompt }) => {
      expect(isDiagnoseStripeCheckoutFailurePrompt(prompt)).toBe(false);
    },
  );

  it('does not rescue when action is already diagnose_stripe_checkout_failure', () => {
    expect(
      rescueStripeCheckoutFailureIntent(
        'Why does Stripe checkout session creation fail?',
        'diagnose_stripe_checkout_failure',
      ),
    ).toBeNull();
  });

  it('rescues misclassified stripe checkout failure prompts', () => {
    expect(
      rescueStripeCheckoutFailureIntent(
        'Why does Stripe checkout session creation fail for our currency?',
        'unknown',
      ),
    ).toEqual({
      action: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    });
  });

  it('recognizes stripe checkout failure intent id', () => {
    expect(isStripeCheckoutFailureIntent('diagnose_stripe_checkout_failure')).toBe(
      true,
    );
  });
});
