import { EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS } from './ai-explain-payment-options-for-service.util.js';
import { rescueExplainPaymentOptionsForServiceIntent } from './ai-explain-payment-options-for-service.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';

describe('customer-ai-command explain_payment_options_for_service integration (ai-cmd-customer-4.1.2)', () => {
  it.each(
    EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_payment_options_for_service for $id', (_id, row) => {
    expect(
      rescueExplainPaymentOptionsForServiceIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_payment_options_for_service');
    expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_payment_options_for_service',
    );
  });

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('explain_payment_options_for_service')).toBe(
      true,
    );
    expect(
      isAiPaymentsServiceIntentForSurface(
        'explain_payment_options_for_service',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface(
        'explain_payment_options_for_service',
        'public',
      ),
    ).toBe(true);
  });
});
