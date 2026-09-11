import {
  E2E232_CLAIM_REFERRAL_PROMPTS,
  E2E232_NON_CLAIM_STILL_MATCHES,
} from './ai-e2e232-claim-referral-vs-promo.fixtures.js';
import {
  extractApplyPromoCodeFromPrompt,
  isApplyPromoCodeCheckoutPrompt,
  rescueApplyPromoCodeCheckoutIntent,
} from './ai-apply-promo-code-checkout.util.js';
import { isApplyGiftCardCodePrompt } from './ai-payments.util.js';
import {
  enrichClaimReferralCodeParamsFromPrompt,
  isClaimReferralCodePrompt,
  rescueClaimReferralCodeIntent,
} from './ai-rewards-and-referral-claim.util.js';
import { CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES } from './ai-apply-promo-code-checkout.util.js';
import { REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES } from './ai-rewards-and-referral-claim.fixtures.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isPromoCodeHelpPrompt,
  rescueMarketingGrowthIntent,
} from './ai-marketing-growth.util.js';
import {
  isMyProfilePrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import { disambiguateGiftCardPaymentsAction } from './ai-gift-card-payments-hints.util.js';

describe('e2e-bug.232 claim_referral_code must not be stolen by apply_promo_code_checkout', () => {
  const rescue = new AiIntentRescueService();

  it('classifier rules forbid promo steal of referral redeem/apply', () => {
    expect(
      CUSTOMER_PUBLIC_APPLY_PROMO_CODE_CHECKOUT_CLASSIFIER_RULES,
    ).toContain('NOT claim_referral_code');
    expect(REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES).toContain(
      'Redeem referral code FRIEND10',
    );
    expect(REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES).toContain(
      'NOT apply_promo_code_checkout',
    );
  });

  it.each(E2E232_CLAIM_REFERRAL_PROMPTS.map((row) => [row.id, row] as const))(
    '$id: promo detector off; claim referral wins + extracts code',
    (_id, row) => {
      expect(isClaimReferralCodePrompt(row.prompt)).toBe(true);
      expect(isApplyPromoCodeCheckoutPrompt(row.prompt)).toBe(false);
      expect(extractApplyPromoCodeFromPrompt(row.prompt)).not.toBe('referral');
      expect(extractApplyPromoCodeFromPrompt(row.prompt)).not.toBe('invite');
      expect(isPromoCodeHelpPrompt(row.prompt)).toBe(false);
      expect(rescueClaimReferralCodeIntent(row.prompt, 'unknown')?.action).toBe(
        row.expectedAction,
      );
      expect(
        rescueClaimReferralCodeIntent(row.prompt, row.stolenBy)?.action,
      ).toBe(row.expectedAction);
      expect(
        rescueApplyPromoCodeCheckoutIntent(row.prompt, 'unknown'),
      ).toBeNull();
      expect(
        rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action,
      ).not.toBe('apply_promo_code_checkout');
      expect(
        rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action,
      ).not.toBe('promo_code_help');
      expect(
        enrichClaimReferralCodeParamsFromPrompt(row.prompt).referralCode,
      ).toBe(row.expectedReferralCode);
    },
  );

  it.each(E2E232_CLAIM_REFERRAL_PROMPTS.map((row) => [row.id, row] as const))(
    '$id: AiIntentRescueService remaps promo/gift steals on public + customer',
    (_id, row) => {
      for (const surface of ['public', 'customer'] as const) {
        for (const fromAction of [
          'apply_promo_code_checkout',
          'promo_code_help',
          'apply_gift_card_code',
          'my_profile',
          'unknown',
        ] as const) {
          const result = rescue.rescue({
            prompt: row.prompt,
            action: fromAction,
            params: {},
            surface,
          });
          expect(result?.action).toBe(row.expectedAction);
          expect(result?.params?.referralCode).toBe(row.expectedReferralCode);
        }
        // Correct classification must not be stolen later by CRM my_profile.
        const alreadyClaim = rescue.rescue({
          prompt: row.prompt,
          action: 'claim_referral_code',
          params: { referralCode: row.expectedReferralCode },
          surface,
        });
        expect(alreadyClaim?.action ?? 'claim_referral_code').toBe(
          row.expectedAction,
        );
      }
    },
  );

  it.each(E2E232_NON_CLAIM_STILL_MATCHES.map((row) => [row.id, row] as const))(
    '$id: real promo/gift prompts still match',
    (_id, row) => {
      expect(isClaimReferralCodePrompt(row.prompt)).toBe(false);
      if (row.kind === 'promo') {
        expect(isApplyPromoCodeCheckoutPrompt(row.prompt)).toBe(true);
        expect(extractApplyPromoCodeFromPrompt(row.prompt)).toBe(
          row.expectedPromoCode,
        );
      } else {
        expect(isApplyGiftCardCodePrompt(row.prompt)).toBe(true);
      }
    },
  );

  it('does not treat the word referral as a promo code token', () => {
    expect(
      extractApplyPromoCodeFromPrompt('Redeem referral code FRIEND10'),
    ).toBeNull();
    expect(
      extractApplyPromoCodeFromPrompt('Apply referral code SAVE20'),
    ).toBeNull();
  });

  it('does not let my_profile / CRM steal attach-referral-to-my-account', () => {
    const prompt = 'Attach referral code SAVE20 to my account';
    expect(isMyProfilePrompt(prompt)).toBe(false);
    expect(rescueCustomerCrmIntent(prompt, 'claim_referral_code')).toBeNull();
    expect(rescueCustomerCrmIntent(prompt, 'unknown')?.action).not.toBe(
      'my_profile',
    );
    expect(
      rescue.rescue({
        prompt,
        action: 'claim_referral_code',
        params: {},
        surface: 'customer',
      })?.action ?? 'claim_referral_code',
    ).toBe('claim_referral_code');
  });

  it('does not let gift-card disambiguation steal bare promo apply/redeem', () => {
    for (const prompt of [
      'Apply code SAVE10 at checkout',
      'Redeem discount code SPRING15',
    ]) {
      expect(isApplyGiftCardCodePrompt(prompt)).toBe(false);
      expect(
        disambiguateGiftCardPaymentsAction(prompt, 'unknown')?.action,
      ).not.toBe('apply_gift_card_code');
      expect(
        rescue.rescue({
          prompt,
          action: 'unknown',
          params: {},
          surface: 'customer',
        })?.action,
      ).toBe('apply_promo_code_checkout');
    }
  });
});
