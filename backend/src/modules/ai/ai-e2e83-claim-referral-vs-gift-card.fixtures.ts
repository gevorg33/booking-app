/**
 * e2e-bug.83 — "redeem referral code X" was stolen by apply_gift_card_code
 * because isApplyGiftCardCodePrompt matched redeem + bare "code".
 */
export const E2E83_CLAIM_REFERRAL_PROMPTS = [
  {
    id: 'e2e83-redeem-referral-code-abc123',
    prompt: 'I want to redeem referral code ABC123',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'ABC123',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-claim-referral-code',
    prompt: 'Claim referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'FRIEND10',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-apply-referral-code',
    prompt: 'Apply referral code SAVE20',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'SAVE20',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-redeem-invite-code',
    prompt: "Redeem my friend's invite code HELLO1",
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'HELLO1',
    stolenBy: 'apply_gift_card_code',
  },
] as const;

export const E2E83_GIFT_CARD_STILL_MATCHES = [
  {
    id: 'e2e83-apply-gift-card-checkout',
    prompt: 'Apply my gift card at checkout',
  },
  {
    id: 'e2e83-redeem-gift-card-code',
    prompt: 'Redeem gift card code GCM-ABCD1234 at checkout',
  },
] as const;
