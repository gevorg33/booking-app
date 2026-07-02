import { APPLY_PROMO_CODE_CHECKOUT_PROMPTS } from './ai-apply-promo-code-checkout.util.js';
import { rescueApplyPromoCodeCheckoutIntent } from './ai-apply-promo-code-checkout.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('customer-ai-command apply_promo_code_checkout integration (ai-cmd-customer-4.2.5)', () => {
  it.each(
    APPLY_PROMO_CODE_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues apply_promo_code_checkout for $id', (_id, row) => {
    expect(
      rescueApplyPromoCodeCheckoutIntent(row.prompt, 'unknown')?.action,
    ).toBe('apply_promo_code_checkout');
    expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
      'apply_promo_code_checkout',
    );
  });
});
