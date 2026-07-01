import {
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS,
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_RESCUE_SCENARIOS,
} from './ai-diagnose-stripe-checkout-failure.fixtures.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_SCENARIOS } from './ai-diagnose-stripe-checkout-failure-multilingual.fixtures.js';
import {
  isConsumerDiagnoseStripeCheckoutFailurePrompt,
  parseConsumerCheckoutFailureAspect,
  parseConsumerDiagnoseStripeCheckoutFailureFromPrompt,
  rescueConsumerDiagnoseStripeCheckoutFailureIntent,
  buildConsumerDiagnoseStripeCheckoutFailureNavigate,
} from './ai-diagnose-stripe-checkout-failure.util.js';
import { isDiagnoseStripeCheckoutFailurePrompt } from './ai-stripe-checkout-failure.util.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';

describe('ai-diagnose-stripe-checkout-failure.util (ai-cmd-customer-4.18.1)', () => {
  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS)(
    'detects consumer prompt $id',
    ({ prompt, aspect }) => {
      expect(isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)).toBe(true);
      if (aspect) {
        expect(parseConsumerCheckoutFailureAspect(prompt)).toBe(aspect);
      }
    },
  );

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)).toBe(true);
    },
  );

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueConsumerDiagnoseStripeCheckoutFailureIntent(
          prompt,
          misclassifiedAction,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not rescue when action is already diagnose_stripe_checkout_failure', () => {
    expect(
      rescueConsumerDiagnoseStripeCheckoutFailureIntent(
        'Payment failed — what now?',
        'diagnose_stripe_checkout_failure',
      ),
    ).toBeNull();
  });

  it('does not steal resume_pending_payment prompts', () => {
    expect(
      isConsumerDiagnoseStripeCheckoutFailurePrompt('Continue my payment'),
    ).toBe(false);
    expect(isResumePendingPaymentPrompt('I closed the app mid-checkout')).toBe(
      true,
    );
  });

  it('does not steal explain_why_stripe_required policy prompts', () => {
    expect(
      isConsumerDiagnoseStripeCheckoutFailurePrompt(
        'Why do I need to pay with a card online?',
      ),
    ).toBe(false);
  });

  it('does not steal pay_online explicit prompts', () => {
    expect(isConsumerDiagnoseStripeCheckoutFailurePrompt('Pay online')).toBe(
      false,
    );
    expect(isConsumerDiagnoseStripeCheckoutFailurePrompt('Pay with card')).toBe(
      false,
    );
  });

  it('does not overlap dashboard admin diagnose prompts', () => {
    const adminPrompt =
      'Why does Stripe checkout session creation fail for our currency?';
    expect(isDiagnoseStripeCheckoutFailurePrompt(adminPrompt)).toBe(true);
    expect(isConsumerDiagnoseStripeCheckoutFailurePrompt(adminPrompt)).toBe(
      false,
    );
  });

  it('builds checkout navigate with cash fallback when slot context exists', () => {
    expect(
      buildConsumerDiagnoseStripeCheckoutFailureNavigate(
        {
          serviceId: 'svc-1',
          startTime: '2026-06-25T14:00:00.000Z',
        },
        { acceptCashPayments: true, aspect: 'card_declined' },
      ),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-06-25T14:00:00.000Z',
        payment: 'cash',
      },
    });
  });

  it('returns null navigate without slot context', () => {
    expect(
      buildConsumerDiagnoseStripeCheckoutFailureNavigate(
        {},
        { acceptCashPayments: true, aspect: 'generic' },
      ),
    ).toBeUndefined();
  });

  it('parseConsumerDiagnoseStripeCheckoutFailureFromPrompt returns aspect', () => {
    expect(
      parseConsumerDiagnoseStripeCheckoutFailureFromPrompt(
        'Card declined at checkout',
      ),
    ).toEqual({ aspect: 'card_declined' });
  });

  it('reads aspect from params and detects not_charged', () => {
    expect(
      parseConsumerCheckoutFailureAspect(
        "I wasn't charged but checkout failed",
        {
          aspect: 'all',
        },
      ),
    ).toBe('all');
    expect(
      parseConsumerCheckoutFailureAspect(
        "I wasn't charged but checkout failed",
      ),
    ).toBe('not_charged');
    expect(
      parseConsumerCheckoutFailureAspect('Checkout payment error on this site'),
    ).toBe('session_error');
  });

  it('returns null rescue for unrelated prompts', () => {
    expect(
      rescueConsumerDiagnoseStripeCheckoutFailureIntent(
        'Book a haircut',
        'unknown',
      ),
    ).toBeNull();
  });
});
