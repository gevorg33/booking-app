import { rescueExplainMultiServicePaymentReturnIntent } from './ai-explain-multi-service-payment-return.util.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS } from './ai-explain-multi-service-payment-return.fixtures.js';

describe('customer-ai-command explain_multi_service_payment_return integration (ai-cmd-customer-4.18.5)', () => {
  it.each(EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS)(
    'rescues explain_multi_service_payment_return for $id',
    (row) => {
      expect(
        rescueExplainMultiServicePaymentReturnIntent(row.prompt, 'unknown')
          ?.action,
      ).toBe('explain_multi_service_payment_return');
    },
  );
});
