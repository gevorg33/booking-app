import {
  E2E233_LOYALTY_REFERRAL_MUST_NOT_GUIDE,
  E2E233_STILL_GUIDE_PROMPTS,
} from './ai-e2e233-loyalty-vs-guide.fixtures.js';
import { resolveAssistantMode } from './ai-assistant-mode.util.js';
import {
  classifyPromptIntentBucket,
  isProductGuidePrompt,
  isRewardsLoyaltyReferralDomainPrompt,
  resolveProductGuideDisambiguation,
  resolveProductGuidePromptMatch,
} from './ai-product-guide.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { isExplainLoyaltyPointsPrompt } from './ai-explain-loyalty-points.util.js';
import { isLoyaltyPointsBalancePrompt } from './ai-marketing-growth.util.js';
import { isClaimReferralCodePrompt } from './ai-rewards-and-referral-claim.util.js';

describe('e2e-bug.233 loyalty/referral must not become guide_user_flow', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E233_LOYALTY_REFERRAL_MUST_NOT_GUIDE.map((row) => [row.id, row] as const),
  )(
    '$id: domain prompt; product-guide match off (omitted / guide / act)',
    (_id, row) => {
      expect(isRewardsLoyaltyReferralDomainPrompt(row.prompt)).toBe(true);
      expect(classifyPromptIntentBucket(row.prompt)).toBe('action');
      expect(isProductGuidePrompt(row.prompt)).toBe(false);
      expect(
        resolveProductGuidePromptMatch(row.prompt, { surface: 'customer' })
          .matched,
      ).toBe(false);
      expect(
        resolveProductGuidePromptMatch(row.prompt, {
          surface: 'customer',
          assistantMode: 'guide',
        }).matched,
      ).toBe(false);
      expect(
        resolveProductGuidePromptMatch(row.prompt, {
          surface: 'customer',
          assistantMode: 'act',
        }).matched,
      ).toBe(false);
      expect(
        resolveProductGuideDisambiguation(row.prompt, row.expectedAction, {
          surface: 'customer',
        }),
      ).toBeNull();
      expect(
        resolveProductGuideDisambiguation(row.prompt, row.expectedAction, {
          surface: 'customer',
          assistantMode: 'guide',
        }),
      ).toBeNull();
    },
  );

  it.each(
    E2E233_LOYALTY_REFERRAL_MUST_NOT_GUIDE.map((row) => [row.id, row] as const),
  )(
    '$id: omitted assistantMode resolves to act (not guide inference)',
    (_id, row) => {
      expect(
        resolveAssistantMode({
          prompt: row.prompt,
          surface: 'customer',
        }),
      ).toBe('act');
    },
  );

  it.each(
    E2E233_LOYALTY_REFERRAL_MUST_NOT_GUIDE.map((row) => [row.id, row] as const),
  )(
    '$id: AiIntentRescueService does not remap to guide_user_flow',
    (_id, row) => {
      for (const surface of ['customer', 'public'] as const) {
        for (const fromAction of [
          row.expectedAction,
          'unknown',
          'guide_user_flow',
        ] as const) {
          const result = rescue.rescue({
            prompt: row.prompt,
            action: fromAction,
            params: {},
            surface,
            assistantMode: undefined,
          });
          if (result?.rescued) {
            expect(result.action).not.toBe('guide_user_flow');
            expect(result.action).not.toBe('explain_app_feature');
            expect(result.action).not.toBe('explain_current_screen');
          }
        }
      }
    },
  );

  it('domain detectors cover the bug prompts', () => {
    expect(isExplainLoyaltyPointsPrompt('How do loyalty points work?')).toBe(
      true,
    );
    expect(
      isLoyaltyPointsBalancePrompt("What's my loyalty points balance?"),
    ).toBe(true);
    expect(isClaimReferralCodePrompt('Redeem referral code FRIEND10')).toBe(
      true,
    );
  });

  it.each(E2E233_STILL_GUIDE_PROMPTS.map((row) => [row.id, row] as const))(
    '$id: real UI-guide prompts still match product guide',
    (_id, row) => {
      expect(isRewardsLoyaltyReferralDomainPrompt(row.prompt)).toBe(false);
      expect(
        resolveProductGuidePromptMatch(row.prompt, { surface: 'customer' })
          .matched,
      ).toBe(true);
      expect(
        resolveAssistantMode({
          prompt: row.prompt,
          surface: 'customer',
        }),
      ).toBe('guide');
    },
  );
});
