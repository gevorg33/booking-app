import {
  CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES,
  PROMO_CODE_HELP_PROMPTS,
  detectPromoCodeHelpCustomerPublicAction,
  enrichPromoCodeHelpParamsFromPrompt,
  extractPromoCodeFromPrompt,
  isPromoCodeHelpPrompt,
  rescuePromoCodeHelpCustomerPublicIntent,
} from './ai-promo-code-help-customer-public.util.js';
import { AI_COMMAND_EVAL_PROMO_CODE_HELP_CUSTOMER_PUBLIC_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('ai-promo-code-help-customer-public.util (ai-cmd-customer-4.0 P1)', () => {
  it('exports classifier rules for promo code help', () => {
    expect(CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES).toContain(
      'promo_code_help',
    );
  });

  it.each(PROMO_CODE_HELP_PROMPTS.map((row) => [row.id, row] as const))(
    'detects promo-code-help prompt $id',
    (_id, row) => {
      expect(isPromoCodeHelpPrompt(row.prompt)).toBe(true);
      expect(detectPromoCodeHelpCustomerPublicAction(row.prompt)).toBe(
        row.expectedAction,
      );
    },
  );

  it.each(PROMO_CODE_HELP_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues promo-code-help prompt $id from unknown',
    (_id, row) => {
      const rescued = rescuePromoCodeHelpCustomerPublicIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
      expect(rescued?.rescueReason).toBe(row.rescueReason);
      expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
        'promo_code_help',
      );
    },
  );

  it('extracts promo codes from checkout phrasing', () => {
    expect(extractPromoCodeFromPrompt('Validate SAVE10')).toBe('SAVE10');
    expect(extractPromoCodeFromPrompt('Is SAVE10 valid?')).toBe('SAVE10');
    expect(extractPromoCodeFromPrompt('Apply code WELCOME at checkout')).toBe(
      'WELCOME',
    );
    expect(
      enrichPromoCodeHelpParamsFromPrompt({}, 'Help with discount code VIP20')
        .promoCode,
    ).toBe('VIP20');
  });

  it('does not steal admin create or referral prompts', () => {
    expect(isPromoCodeHelpPrompt('Create promo code SAVE10 for 20% off')).toBe(
      false,
    );
    expect(isPromoCodeHelpPrompt('Refer a friend for a bonus')).toBe(false);
    expect(
      detectPromoCodeHelpCustomerPublicAction(
        'List haircut services under $50 with code SAVE10',
      ),
    ).toBeNull();
  });

  it('maps promo-code-help fixtures to passing eval golden cases', () => {
    expect(
      PROMO_CODE_HELP_PROMPTS.filter((row) => row.surface === 'customer').length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      PROMO_CODE_HELP_PROMPTS.filter((row) => row.surface === 'public').length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_PROMO_CODE_HELP_CUSTOMER_PUBLIC_CASES.length).toBe(
      PROMO_CODE_HELP_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_PROMO_CODE_HELP_CUSTOMER_PUBLIC_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
