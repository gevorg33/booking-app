import { FILTER_SERVICES_NO_PREPAYMENT_PROMPTS } from './ai-filter-services-no-prepayment.util.js';
import { rescueFilterServicesNoPrepaymentIntent } from './ai-filter-services-no-prepayment.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';
import { isListServicesPaymentFilterPrompt } from './ai-list-services-payment-filters.util.js';

describe('customer-ai-command filter_services_no_prepayment integration (ai-cmd-customer-4.1.7)', () => {
  it.each(
    FILTER_SERVICES_NO_PREPAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues filter_services_no_prepayment for $id', (_id, row) => {
    expect(
      rescueFilterServicesNoPrepaymentIntent(row.prompt, 'unknown')?.action,
    ).toBe('filter_services_no_prepayment');
    expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
      'filter_services_no_prepayment',
    );
    expect(isListServicesPaymentFilterPrompt(row.prompt)).toBe(false);
  });

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('filter_services_no_prepayment')).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface(
        'filter_services_no_prepayment',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface(
        'filter_services_no_prepayment',
        'public',
      ),
    ).toBe(true);
  });
});
