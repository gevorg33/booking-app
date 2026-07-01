import { handleConsumerDiagnoseStripeCheckoutFailureLogic } from './ai-diagnose-stripe-checkout-failure.logic.js';
import {
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS,
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_HANDLER_FIXTURES,
} from './ai-diagnose-stripe-checkout-failure.fixtures.js';

describe('ai-diagnose-stripe-checkout-failure.logic (ai-cmd-customer-4.18.1)', () => {
  const businessRepo = { findOne: jest.fn() };
  const deps = { businessRepo };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_HANDLER_FIXTURES)(
    'handles $id',
    async ({ acceptCashPayments, onlineEnabled, aspect }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments },
          integrations: onlineEnabled
            ? { stripe: { connectAccountId: 'acct_test' } }
            : {},
        },
      });

      const prompt =
        aspect === 'card_declined'
          ? 'Card declined at checkout'
          : aspect === 'session_error'
            ? "Stripe checkout didn't work"
            : 'Payment failed — what now?';

      const result = await handleConsumerDiagnoseStripeCheckoutFailureLogic(
        deps,
        'biz-1',
        {
          serviceId: 'svc-1',
          startTime: '2026-06-25T14:00:00.000Z',
        },
        prompt,
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('diagnose_stripe_checkout_failure');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.acceptCashPayments).toBe(acceptCashPayments);
      expect(result.details?.onlinePaymentsEnabled).toBe(onlineEnabled);
      if (acceptCashPayments) {
        expect(result.details?.navigate).toEqual(
          expect.objectContaining({ path: 'checkout' }),
        );
      }
    },
  );

  it.each(DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS.slice(0, 4))(
    'returns success for fixture $id',
    async ({ prompt }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments: true },
          integrations: { stripe: { connectAccountId: 'acct_test' } },
        },
      });

      const result = await handleConsumerDiagnoseStripeCheckoutFailureLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('diagnose_stripe_checkout_failure');
    },
  );

  it('clarifies when prompt does not match', async () => {
    const result = await handleConsumerDiagnoseStripeCheckoutFailureLogic(
      deps,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    const result = await handleConsumerDiagnoseStripeCheckoutFailureLogic(
      deps,
      'biz-1',
      {},
      'Payment failed — what now?',
    );
    expect(result.success).toBe(false);
  });
});
