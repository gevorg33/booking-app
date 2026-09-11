import { validateCommand } from './command-completion.validator.js';
import { handleExplainMultiServicePaymentReturnLogic } from './ai-explain-multi-service-payment-return.logic.js';
import {
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS,
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_RESCUE_SCENARIOS,
} from './ai-explain-multi-service-payment-return.fixtures.js';
import { rescueExplainMultiServicePaymentReturnIntent } from './ai-explain-multi-service-payment-return.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai explain multi-service payment return integration (ai-cmd-customer-4.18.5)', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Glow Spa' }),
  };

  it.each(EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS)(
    'validates $id',
    ({ prompt }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_multi_service_payment_return',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainMultiServicePaymentReturnIntent(
          prompt,
          misclassifiedAction,
        )?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with pending multi checkout context', async () => {
    const result = await handleExplainMultiServicePaymentReturnLogic(
      { businessRepo },
      'biz-1',
      {
        cartServiceIds: ['svc-a', 'svc-b'],
        pendingMultiCheckoutSessionId: 'cs_test_123',
      },
      'Return from Stripe for spa day',
    );
    expect(result.action).toBe('explain_multi_service_payment_return');
    expect(result.success).toBe(true);
    expect(result.details?.pendingMultiCheckoutPayment).toMatchObject({
      sessionId: 'cs_test_123',
      serviceIds: ['svc-a', 'svc-b'],
    });
  });
});
