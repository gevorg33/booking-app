import { APPLY_LOYALTY_AT_CHECKOUT_PROMPTS } from './ai-apply-loyalty-at-checkout.fixtures.js';
import { rescueApplyLoyaltyAtCheckoutIntent } from './ai-apply-loyalty-at-checkout.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('customer-ai-command apply_loyalty_at_checkout integration (ai-cmd-customer-4.5.2)', () => {
  it.each(
    APPLY_LOYALTY_AT_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues apply_loyalty_at_checkout for $id', (_id, row) => {
    expect(
      rescueApplyLoyaltyAtCheckoutIntent(row.prompt, 'unknown')?.action,
    ).toBe('apply_loyalty_at_checkout');
    expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
      'apply_loyalty_at_checkout',
    );
  });
});
