import {
  APPLY_LOYALTY_AT_CHECKOUT_PROMPTS,
  APPLY_LOYALTY_AT_CHECKOUT_RESCUE_SCENARIOS,
  CUSTOMER_APPLY_LOYALTY_AT_CHECKOUT_CLASSIFIER_RULES,
} from './ai-apply-loyalty-at-checkout.fixtures.js';
import { APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-apply-loyalty-at-checkout-multilingual.fixtures.js';
import {
  buildApplyLoyaltyAtCheckoutNavigate,
  enrichApplyLoyaltyAtCheckoutParamsFromPrompt,
  extractLoyaltyPointsToRedeemFromPrompt,
  isApplyLoyaltyAtCheckoutIntent,
  isApplyLoyaltyAtCheckoutPrompt,
  parseApplyLoyaltyAtCheckoutFromPrompt,
  rescueApplyLoyaltyAtCheckoutIntent,
} from './ai-apply-loyalty-at-checkout.util.js';
import { isExplainLoyaltyPointsPrompt } from './ai-explain-loyalty-points.util.js';
import { isLoyaltyPointsBalancePrompt } from './ai-marketing-growth.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { AI_COMMAND_EVAL_APPLY_LOYALTY_AT_CHECKOUT_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-apply-loyalty-at-checkout.util (ai-cmd-customer-4.5.2)', () => {
  it('exports classifier rules for apply_loyalty_at_checkout', () => {
    expect(CUSTOMER_APPLY_LOYALTY_AT_CHECKOUT_CLASSIFIER_RULES).toContain(
      'apply_loyalty_at_checkout',
    );
  });

  it.each(
    APPLY_LOYALTY_AT_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects apply_loyalty_at_checkout for $id', (_id, row) => {
    expect(isApplyLoyaltyAtCheckoutPrompt(row.prompt)).toBe(true);
    expect(
      rescueApplyLoyaltyAtCheckoutIntent(row.prompt, 'unknown')?.action,
    ).toBe('apply_loyalty_at_checkout');
    expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
      'apply_loyalty_at_checkout',
    );
  });

  it.each(
    APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual apply_loyalty_at_checkout for $id', (_id, row) => {
    expect(isApplyLoyaltyAtCheckoutPrompt(row.prompt)).toBe(true);
  });

  it.each(
    APPLY_LOYALTY_AT_CHECKOUT_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueApplyLoyaltyAtCheckoutIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('apply_loyalty_at_checkout');
  });

  it('does not classify explain or balance prompts as apply mutate', () => {
    expect(isApplyLoyaltyAtCheckoutPrompt('How do I earn points?')).toBe(false);
    expect(isExplainLoyaltyPointsPrompt('How do I earn points?')).toBe(true);
    expect(isApplyLoyaltyAtCheckoutPrompt('How many points do I have?')).toBe(
      false,
    );
    expect(isLoyaltyPointsBalancePrompt('How many points do I have?')).toBe(
      true,
    );
    expect(
      isApplyLoyaltyAtCheckoutPrompt('Apply code SAVE10 at checkout'),
    ).toBe(false);
  });

  it('preserves existing params during enrichment and skips invalid rescue', () => {
    expect(
      enrichApplyLoyaltyAtCheckoutParamsFromPrompt(
        { loyaltyPointsToRedeem: 5 },
        'Apply 10 loyalty points to this booking',
      ).loyaltyPointsToRedeem,
    ).toBe(5);
    expect(
      rescueApplyLoyaltyAtCheckoutIntent('How do promo codes work?', 'unknown'),
    ).toBeNull();
  });

  it('enriches explicit loyaltyPointsToRedeem from prompt', () => {
    expect(
      enrichApplyLoyaltyAtCheckoutParamsFromPrompt(
        {},
        'Apply 10 loyalty points to this booking',
      ).loyaltyPointsToRedeem,
    ).toBe(10);
  });

  it('builds checkout navigate with loyaltyPointsToRedeem when service context exists', () => {
    expect(
      buildApplyLoyaltyAtCheckoutNavigate(
        {
          serviceId: 'svc-1',
          startTime: '2026-07-01T10:00:00.000Z',
          employeeId: 'emp-1',
        },
        25,
      ),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-07-01T10:00:00.000Z',
        employeeId: 'emp-1',
        loyaltyPointsToRedeem: '25',
      },
    });
  });

  it('parseApplyLoyaltyAtCheckoutFromPrompt returns null for explain prompts', () => {
    expect(
      parseApplyLoyaltyAtCheckoutFromPrompt('How can I use my points?'),
    ).toBeNull();
  });

  it('extracts max from generic apply cue when not in fixtures', () => {
    expect(
      extractLoyaltyPointsToRedeemFromPrompt(
        'Please use my reward points at checkout today',
      ),
    ).toBe('max');
  });

  it('extracts max and explicit amounts from generic phrasing', () => {
    expect(
      extractLoyaltyPointsToRedeemFromPrompt('Redeem max points on checkout'),
    ).toBe('max');
    expect(
      extractLoyaltyPointsToRedeemFromPrompt(
        'Apply 15 reward points at checkout',
      ),
    ).toBe(15);
  });

  it('reads loyaltyPointsToRedeem from params aliases', () => {
    expect(
      parseApplyLoyaltyAtCheckoutFromPrompt('Use my points on this booking', {
        loyaltyPoints: 20,
      }),
    ).toEqual({ loyaltyPointsToRedeem: 20 });
    expect(
      parseApplyLoyaltyAtCheckoutFromPrompt('Use my points on this booking', {
        loyaltyPointsToRedeem: 'max',
      }),
    ).toEqual({ loyaltyPointsToRedeem: 'max' });
    expect(
      parseApplyLoyaltyAtCheckoutFromPrompt('Use my points on this booking', {
        pointsToRedeem: '25',
      }),
    ).toEqual({ loyaltyPointsToRedeem: 25 });
  });

  it('builds package and service-only checkout navigate paths', () => {
    expect(
      buildApplyLoyaltyAtCheckoutNavigate(
        { packageId: 'pkg-1', startTime: '2026-07-01T10:00:00.000Z' },
        12,
      ),
    ).toEqual({
      path: 'checkout',
      query: {
        packageId: 'pkg-1',
        startTime: '2026-07-01T10:00:00.000Z',
        loyaltyPointsToRedeem: '12',
      },
    });
    expect(
      buildApplyLoyaltyAtCheckoutNavigate({ serviceId: 'svc-1' }, 8),
    ).toEqual({
      path: 'checkout',
      query: { serviceId: 'svc-1', loyaltyPointsToRedeem: '8' },
    });
    expect(buildApplyLoyaltyAtCheckoutNavigate({}, 5)).toBeNull();
  });

  it('returns null rescue when action is already apply_loyalty_at_checkout', () => {
    expect(
      rescueApplyLoyaltyAtCheckoutIntent(
        'Use my points on this booking',
        'apply_loyalty_at_checkout',
      ),
    ).toBeNull();
  });

  it('rejects empty prompts', () => {
    expect(isApplyLoyaltyAtCheckoutPrompt('   ')).toBe(false);
  });

  it('detects apply intent helper and multilingual regex fallback', () => {
    expect(isApplyLoyaltyAtCheckoutIntent('apply_loyalty_at_checkout')).toBe(
      true,
    );
    expect(isApplyLoyaltyAtCheckoutIntent('unknown')).toBe(false);
    expect(
      isApplyLoyaltyAtCheckoutPrompt(
        'использовать баллы loyalty на checkout этой записи',
      ),
    ).toBe(true);
  });

  it('maps every fixture to eval cases', () => {
    expect(APPLY_LOYALTY_AT_CHECKOUT_PROMPTS.length).toBeGreaterThanOrEqual(12);
    expect(
      AI_COMMAND_EVAL_APPLY_LOYALTY_AT_CHECKOUT_CASES.length,
    ).toBeGreaterThanOrEqual(
      APPLY_LOYALTY_AT_CHECKOUT_PROMPTS.length +
        APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS.length,
    );
  });
});
