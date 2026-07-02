import {
  APPLY_PROMO_CODE_CHECKOUT_PROMPTS,
  CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES,
  buildApplyPromoCodeCheckoutNavigate,
  enrichApplyPromoCodeCheckoutParamsFromPrompt,
  isApplyPromoCodeCheckoutPrompt,
  parseApplyPromoCodeCheckoutFromPrompt,
  rescueApplyPromoCodeCheckoutIntent,
} from './ai-apply-promo-code-checkout.util.js';
import { isPromoCodeHelpPrompt } from './ai-marketing-growth.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { AI_COMMAND_EVAL_APPLY_PROMO_CODE_CHECKOUT_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-apply-promo-code-checkout.util (ai-cmd-customer-4.2.5)', () => {
  it('exports classifier rules for apply_promo_code_checkout', () => {
    expect(
      CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES,
    ).toContain('apply_promo_code_checkout');
  });

  it.each(
    APPLY_PROMO_CODE_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects apply_promo_code_checkout for $id', (_id, row) => {
    expect(isApplyPromoCodeCheckoutPrompt(row.prompt)).toBe(true);
    expect(
      rescueApplyPromoCodeCheckoutIntent(row.prompt, 'unknown')?.action,
    ).toBe('apply_promo_code_checkout');
    expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
      'apply_promo_code_checkout',
    );
  });

  it.each(
    APPLY_PROMO_CODE_CHECKOUT_PROMPTS.filter((row) => row.promoCode).map(
      (row) => [row.id, row] as const,
    ),
  )('enriches promoCode from prompt for $id', (_id, row) => {
    expect(
      enrichApplyPromoCodeCheckoutParamsFromPrompt({}, row.prompt).promoCode,
    ).toBe(row.promoCode);
  });

  it('does not classify promo help prompts as apply mutate', () => {
    expect(isApplyPromoCodeCheckoutPrompt('How do promo codes work?')).toBe(
      false,
    );
    expect(isPromoCodeHelpPrompt('How do promo codes work?')).toBe(true);
    expect(
      isApplyPromoCodeCheckoutPrompt("Why didn't my discount apply?"),
    ).toBe(false);
  });

  it('builds checkout navigate with promoCode when service context exists', () => {
    expect(
      buildApplyPromoCodeCheckoutNavigate(
        {
          serviceId: 'svc-1',
          startTime: '2026-07-01T10:00:00.000Z',
          employeeId: 'emp-1',
        },
        'SAVE10',
      ),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-07-01T10:00:00.000Z',
        employeeId: 'emp-1',
        promoCode: 'SAVE10',
      },
    });
  });

  it('parseApplyPromoCodeCheckoutFromPrompt returns null for help prompts', () => {
    expect(
      parseApplyPromoCodeCheckoutFromPrompt('Where do I enter a promo code?'),
    ).toBeNull();
  });

  it('maps every fixture to eval cases', () => {
    expect(
      APPLY_PROMO_CODE_CHECKOUT_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      APPLY_PROMO_CODE_CHECKOUT_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      AI_COMMAND_EVAL_APPLY_PROMO_CODE_CHECKOUT_CASES.length,
    ).toBeGreaterThan(APPLY_PROMO_CODE_CHECKOUT_PROMPTS.length);
  });
});
