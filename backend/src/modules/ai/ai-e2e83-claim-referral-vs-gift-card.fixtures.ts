/**
 * e2e-bug.83 — "redeem referral code X" was stolen by apply_gift_card_code
 * because isApplyGiftCardCodePrompt matched redeem + bare "code".
 * Residual promo/my_profile steals tracked as e2e-bug.232 (Fixed).
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
  {
    id: 'e2e83-redeem-referral-promo-stealer',
    prompt: 'Redeem referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'FRIEND10',
    stolenBy: 'apply_promo_code_checkout',
  },
  {
    id: 'e2e83-use-referral-code',
    prompt: 'Use referral code WELCOME1',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'WELCOME1',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-enter-invite-code',
    prompt: 'Enter invite code PARTY99',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'PARTY99',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-attach-referral-my-account',
    prompt: 'Attach referral code SAVE20 to my account',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'SAVE20',
    stolenBy: 'my_profile',
  },
  {
    id: 'e2e83-casual-redeem-referral',
    prompt: 'can i redeem referral code XYZ999 please',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'XYZ999',
    stolenBy: 'apply_gift_card_code',
  },
  {
    id: 'e2e83-apply-invite-code',
    prompt: 'Apply invite code JOINME',
    expectedAction: 'claim_referral_code' as const,
    expectedReferralCode: 'JOINME',
    stolenBy: 'apply_gift_card_code',
  },
] as const;

/** Real gift-card apply prompts must still match apply_gift_card_code. */
export const E2E83_GIFT_CARD_STILL_MATCHES = [
  {
    id: 'e2e83-apply-gift-card-checkout',
    prompt: 'Apply my gift card at checkout',
  },
  {
    id: 'e2e83-redeem-gift-card-code',
    prompt: 'Redeem gift card code GCM-ABCD1234 at checkout',
  },
  {
    id: 'e2e83-use-gcm-at-checkout',
    prompt: 'Use code GCM-ABCD1234 at checkout',
  },
] as const;

/**
 * e2e-bug.256 — found during e2e-bug.83 live QA: GCM-/GCB-/GCS- without the
 * words "gift card" was stolen by promo_code_help.
 */
export const E2E256_GCM_NOT_PROMO_HELP = [
  {
    id: 'e2e256-use-gcm-at-checkout',
    prompt: 'Use code GCM-ABCD1234 at checkout',
    expectedAction: 'apply_gift_card_code' as const,
  },
  {
    id: 'e2e256-apply-gcb-at-checkout',
    prompt: 'Apply code GCB-BUNDLE99 at checkout',
    expectedAction: 'apply_gift_card_code' as const,
  },
  {
    id: 'e2e256-redeem-gcs-at-checkout',
    prompt: 'Redeem GCS-SERVICE01 at checkout',
    expectedAction: 'apply_gift_card_code' as const,
  },
] as const;

/** Must not become claim_referral_code (promo / refer-a-friend controls). */
export const E2E83_NON_CLAIM_CONTROLS = [
  {
    id: 'e2e83-still-apply-promo-save10',
    prompt: 'Apply code SAVE10 at checkout',
    forbidAction: 'claim_referral_code' as const,
    allowActions: ['apply_promo_code_checkout'] as const,
  },
  {
    id: 'e2e83-still-redeem-discount',
    prompt: 'Redeem discount code SPRING15',
    forbidAction: 'claim_referral_code' as const,
    allowActions: ['apply_promo_code_checkout'] as const,
  },
  {
    id: 'e2e83-still-refer-a-friend',
    prompt: 'How do I refer a friend and get my referral code?',
    forbidAction: 'claim_referral_code' as const,
    allowActions: ['refer_a_friend'] as const,
  },
] as const;

export const E2E83_LIVE_CASES = [
  {
    id: 'claim-referral-not-gift-card',
    description:
      'Redeem/claim/apply/use/enter/attach + referral|invite → claim_referral_code (never apply_gift_card_code)',
  },
  {
    id: 'claim-referral-not-promo',
    description:
      'Redeem/apply referral not stolen by apply_promo_code_checkout / promo_code_help',
  },
  {
    id: 'gift-card-apply-still-works',
    description:
      'Real gift-card apply prompts still route to apply_gift_card_code',
  },
  {
    id: 'promo-and-refer-controls',
    description:
      'Bare promo apply + refer-a-friend stay off claim_referral_code',
  },
] as const;
