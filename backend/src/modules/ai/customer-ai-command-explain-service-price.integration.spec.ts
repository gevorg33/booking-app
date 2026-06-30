import { EXPLAIN_SERVICE_PRICE_PROMPTS } from './ai-explain-service-price.util.js';
import { rescueExplainServicePriceIntent } from './ai-explain-service-price.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';

describe('customer-ai-command explain_service_price integration (ai-cmd-customer-4.1.1)', () => {
  it.each(EXPLAIN_SERVICE_PRICE_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain_service_price for $id',
    (_id, row) => {
      expect(rescueExplainServicePriceIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_service_price',
      );
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_service_price',
      );
    },
  );

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('explain_service_price')).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('explain_service_price', 'customer'),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('explain_service_price', 'public'),
    ).toBe(true);
  });
});
