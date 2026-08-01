/**
 * e2e-bug.232 — e2e-bug.83 residual: redeem/apply + referral was stolen by
 * apply_promo_code_checkout (promo extractor treated "referral" as promoCode).
 */
export const E2E232_CLAIM_REFERRAL_PROMPTS = [
  {
    id: 'e2e232-redeem-referral-friend10',
    prompt: 'Redeem referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'FRIEND10',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-apply-referral-save20',
    prompt: 'Apply referral code SAVE20',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'SAVE20',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-want-redeem-referral-abc123',
    prompt: 'I want to redeem referral code ABC123',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'ABC123',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-claim-referral-friend10',
    prompt: 'Claim referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'FRIEND10',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-redeem-invite-hello1',
    prompt: "Redeem my friend's invite code HELLO1",
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'HELLO1',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-use-referral-code',
    prompt: 'Use referral code WELCOME1',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'WELCOME1',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-enter-invite-code',
    prompt: 'Enter invite code PARTY99',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'PARTY99',
    stolenBy: 'apply_promo_code_checkout' as const,
  },
  {
    id: 'e2e232-attach-referral-my-account',
    prompt: 'Attach referral code SAVE20 to my account',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'SAVE20',
    stolenBy: 'my_profile' as const,
  },
] as const;

/** Real promo / gift-card controls — must not become claim_referral_code. */
export const E2E232_NON_CLAIM_STILL_MATCHES = [
  {
    id: 'e2e232-still-apply-promo-save10',
    prompt: 'Apply code SAVE10 at checkout',
    kind: 'promo' as const,
    expectedPromoCode: 'SAVE10',
  },
  {
    id: 'e2e232-still-redeem-discount',
    prompt: 'Redeem discount code SPRING15',
    kind: 'promo' as const,
    expectedPromoCode: 'SPRING15',
  },
  {
    id: 'e2e232-still-apply-gift-card',
    prompt: 'Apply gift card code GCM-ABCD1234 at checkout',
    kind: 'gift' as const,
  },
] as const;
