import { rescueConsumerDiagnoseStripeCheckoutFailureIntent } from './ai-diagnose-stripe-checkout-failure.util.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS } from './ai-diagnose-stripe-checkout-failure.fixtures.js';

describe('customer-ai-command diagnose_stripe_checkout_failure integration (ai-cmd-customer-4.18.1)', () => {
  it.each(
    DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )('rescues diagnose_stripe_checkout_failure for $id', (row) => {
    expect(
      rescueConsumerDiagnoseStripeCheckoutFailureIntent(row.prompt, 'unknown')
        ?.action,
    ).toBe('diagnose_stripe_checkout_failure');
  });
});
