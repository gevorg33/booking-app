import {
  CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES,
  MULTI_SERVICE_PAYMENT_RETURN_HINT,
  buildExplainMultiServicePaymentReturnNavigate,
  buildMultiServicePaymentReturnExplanation,
  isExplainMultiServicePaymentReturnPrompt,
  parseExplainMultiServicePaymentReturnFromPrompt,
  parseMultiServicePaymentReturnAspect,
  parsePendingMultiCheckoutPaymentFromParams,
  rescueExplainMultiServicePaymentReturnIntent,
} from './ai-explain-multi-service-payment-return.util.js';
import {
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS,
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_RESCUE_SCENARIOS,
} from './ai-explain-multi-service-payment-return.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-payment-return-multilingual.fixtures.js';
import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';
import { isExplainMultiServiceCartPrompt } from './ai-explain-multi-service-cart.util.js';

describe('ai-explain-multi-service-payment-return.util', () => {
  it('exports classifier rules and consumer copy hint', () => {
    expect(
      CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES,
    ).toContain('explain_multi_service_payment_return');
    expect(MULTI_SERVICE_PAYMENT_RETURN_HINT).toContain('browser');
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'detects explain multi-service payment return prompt for $id',
    (_id, row) => {
      expect(isExplainMultiServicePaymentReturnPrompt(row.prompt)).toBe(true);
      expect(
        parseExplainMultiServicePaymentReturnFromPrompt(row.prompt),
      ).toEqual({
        aspect: expect.any(String),
      });
      expect(
        rescueExplainMultiServicePaymentReturnIntent(row.prompt, 'unknown'),
      ).toEqual({
        action: 'explain_multi_service_payment_return',
        rescueReason: 'explain_multi_service_payment_return',
      });
    },
  );

  it.each(
    EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isExplainMultiServicePaymentReturnPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainMultiServicePaymentReturnIntent(row.prompt, 'unknown')
        ?.action,
    ).toBe('explain_multi_service_payment_return');
  });

  it.each(
    EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueExplainMultiServicePaymentReturnIntent(
        row.prompt,
        row.misclassifiedAction,
      ),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'explain_multi_service_payment_return',
    });
  });

  it('steals from payment failure and cart-only prompts', () => {
    expect(
      isConsumerDiagnoseStripeCheckoutFailurePrompt(
        'Payment failed — what now?',
      ),
    ).toBe(true);
    expect(
      isExplainMultiServicePaymentReturnPrompt('Payment failed — what now?'),
    ).toBe(false);
    expect(isResumePendingPaymentPrompt('Continue my payment')).toBe(true);
    expect(isExplainMultiServiceCartPrompt("What's in my cart?")).toBe(true);
    expect(isExplainMultiServicePaymentReturnPrompt("What's in my cart?")).toBe(
      false,
    );
  });

  it('parses pending multi checkout params and navigate payload', () => {
    expect(
      parsePendingMultiCheckoutPaymentFromParams({
        pendingMultiCheckoutPayment: {
          sessionId: 'cs_test_123',
          serviceIds: ['svc-a', 'svc-b'],
          slug: 'glow-nails',
        },
      }),
    ).toEqual({
      sessionId: 'cs_test_123',
      serviceIds: ['svc-a', 'svc-b'],
      slug: 'glow-nails',
    });
    expect(
      buildExplainMultiServicePaymentReturnNavigate({
        cartServiceIds: ['svc-a', 'svc-b'],
        pendingMultiCheckoutSessionId: 'cs_test_123',
      }),
    ).toEqual({
      path: 'multi/checkout',
      query: {
        services: 'svc-a,svc-b',
        confirmPaymentReturn: '1',
        session_id: 'cs_test_123',
      },
    });
  });

  it('builds aspect-specific explanation copy', () => {
    const explanation =
      buildMultiServicePaymentReturnExplanation('paid_not_confirmed');
    expect(explanation.summaryParts.join(' ')).toContain(
      MULTI_SERVICE_PAYMENT_RETURN_HINT,
    );
    expect(
      parseMultiServicePaymentReturnAspect('Return from Stripe for spa day'),
    ).toBe('return_from_stripe');
  });
});
