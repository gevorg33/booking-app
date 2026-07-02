import { validateCommand } from './command-completion.validator.js';
import { handleConsumerDiagnoseStripeCheckoutFailureLogic } from './ai-diagnose-stripe-checkout-failure.logic.js';
import {
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS,
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_RESCUE_SCENARIOS,
} from './ai-diagnose-stripe-checkout-failure.fixtures.js';
import { rescueConsumerDiagnoseStripeCheckoutFailureIntent } from './ai-diagnose-stripe-checkout-failure.util.js';

describe('ai diagnose stripe checkout failure integration (ai-cmd-customer-4.18.1)', () => {
  const businessRepo = { findOne: jest.fn() };
  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        publicBooking: { acceptCashPayments: true },
        integrations: { stripe: { connectAccountId: 'acct_test' } },
      },
    });
  });

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS)(
    'validates $id',
    ({ prompt }) => {
      const validation = validateCommand({
        action: 'diagnose_stripe_checkout_failure',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueConsumerDiagnoseStripeCheckoutFailureIntent(
          prompt,
          misclassifiedAction,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler for card declined', async () => {
    const result = await handleConsumerDiagnoseStripeCheckoutFailureLogic(
      deps,
      'biz-1',
      {},
      'Card declined at checkout',
    );
    expect(result.action).toBe('diagnose_stripe_checkout_failure');
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('card_declined');
  });
});
