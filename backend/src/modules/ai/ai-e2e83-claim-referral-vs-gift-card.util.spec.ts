import {
  E2E83_CLAIM_REFERRAL_PROMPTS,
  E2E83_GIFT_CARD_STILL_MATCHES,
} from './ai-e2e83-claim-referral-vs-gift-card.fixtures.js';
import { isReferAFriendPrompt } from './ai-growth-loops-customer.util.js';
import { isApplyGiftCardCodePrompt } from './ai-payments.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  enrichClaimReferralCodeParamsFromPrompt,
  isClaimReferralCodePrompt,
  rescueClaimReferralCodeIntent,
} from './ai-rewards-and-referral-claim.util.js';

describe('e2e-bug.83 claim_referral_code must not be stolen by apply_gift_card_code', () => {
  it.each(E2E83_CLAIM_REFERRAL_PROMPTS)(
    '$id: gift-card detector stays off; claim referral wins',
    ({ prompt, expectedAction, expectedReferralCode }) => {
      expect(isApplyGiftCardCodePrompt(prompt)).toBe(false);
      expect(isClaimReferralCodePrompt(prompt)).toBe(true);
      expect(isReferAFriendPrompt(prompt)).toBe(false);
      expect(rescueClaimReferralCodeIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      expect(rescueClaimReferralCodeIntent(prompt, 'apply_gift_card_code')?.action).toBe(
        expectedAction,
      );
      expect(rescuePaymentsIntent(prompt, 'unknown')?.action).not.toBe(
        'apply_gift_card_code',
      );
      expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      expect(
        enrichClaimReferralCodeParamsFromPrompt(prompt).referralCode,
      ).toBe(expectedReferralCode);
    },
  );

  it.each(E2E83_GIFT_CARD_STILL_MATCHES)(
    '$id: real gift-card apply prompts still match',
    ({ prompt }) => {
      expect(isApplyGiftCardCodePrompt(prompt)).toBe(true);
      expect(isClaimReferralCodePrompt(prompt)).toBe(false);
    },
  );
});
