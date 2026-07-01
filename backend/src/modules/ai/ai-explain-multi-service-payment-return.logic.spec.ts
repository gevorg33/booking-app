import { handleExplainMultiServicePaymentReturnLogic } from './ai-explain-multi-service-payment-return.logic.js';
import {
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_HANDLER_FIXTURES,
  EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS,
} from './ai-explain-multi-service-payment-return.fixtures.js';
import { MULTI_SERVICE_PAYMENT_RETURN_HINT } from './ai-explain-multi-service-payment-return.util.js';

describe('ai-explain-multi-service-payment-return.logic', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'biz-1', name: 'Glow Spa' }),
  };

  beforeEach(() => {
    businessRepo.findOne.mockClear();
  });

  it.each(EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_HANDLER_FIXTURES)(
    'returns aspect-specific copy for $id',
    async ({ prompt, aspect, params }) => {
      const result = await handleExplainMultiServicePaymentReturnLogic(
        { businessRepo },
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_multi_service_payment_return');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.hint).toBe(MULTI_SERVICE_PAYMENT_RETURN_HINT);
      expect(result.summary).toContain('browser');
    },
  );

  it('includes navigate when cart has two or more services', async () => {
    const result = await handleExplainMultiServicePaymentReturnLogic(
      { businessRepo },
      'biz-1',
      {
        cartServiceIds: ['svc-massage', 'svc-facial'],
        pendingMultiCheckoutSessionId: 'cs_test_123',
      },
      'I paid but booking not confirmed',
    );
    expect(result.details?.navigate).toMatchObject({
      path: 'multi/checkout',
      query: expect.objectContaining({
        services: 'svc-massage,svc-facial',
        session_id: 'cs_test_123',
      }),
    });
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleExplainMultiServicePaymentReturnLogic(
      { businessRepo },
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleExplainMultiServicePaymentReturnLogic(
      { businessRepo },
      'biz-1',
      {},
      EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS[0].prompt,
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });
});
