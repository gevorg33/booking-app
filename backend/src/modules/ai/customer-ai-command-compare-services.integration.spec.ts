import { COMPARE_SERVICES_PROMPTS } from './ai-compare-services.util.js';
import { rescueCompareServicesIntent } from './ai-compare-services.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';

describe('customer-ai-command compare_services integration (ai-cmd-customer-4.1.4)', () => {
  it.each(COMPARE_SERVICES_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues compare_services for $id',
    (_id, row) => {
      expect(rescueCompareServicesIntent(row.prompt, 'unknown')?.action).toBe(
        'compare_services',
      );
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'compare_services',
      );
    },
  );

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('compare_services')).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('compare_services', 'customer'),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('compare_services', 'public'),
    ).toBe(true);
  });
});
