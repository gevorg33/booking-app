import { EXPLAIN_AMOUNT_DUE_NOW_PROMPTS } from './ai-explain-amount-due-now.util.js';
import { rescueExplainAmountDueNowIntent } from './ai-explain-amount-due-now.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { paymentsDispatchMapHas } from './ai-payments-dispatch.util.js';
import { isAiPaymentsServiceIntentForSurface } from './ai-payments-dispatch.util.js';

describe('customer-ai-command explain_amount_due_now integration (ai-cmd-customer-4.2.1)', () => {
  it.each(EXPLAIN_AMOUNT_DUE_NOW_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain_amount_due_now for $id',
    (_id, row) => {
      expect(
        rescueExplainAmountDueNowIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_amount_due_now');
      expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_amount_due_now',
      );
    },
  );

  it('is registered on customer and public payments dispatch', () => {
    expect(paymentsDispatchMapHas('explain_amount_due_now')).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('explain_amount_due_now', 'customer'),
    ).toBe(true);
    expect(
      isAiPaymentsServiceIntentForSurface('explain_amount_due_now', 'public'),
    ).toBe(true);
  });
});
