/**
 * e2e-bug.233 — web home widget omits assistantMode; "How do…" loyalty/referral
 * was inferred as guide → guide_user_flow instead of domain intents.
 */
export const E2E233_LOYALTY_REFERRAL_MUST_NOT_GUIDE = [
  {
    id: 'e2e233-explain-loyalty-how-do',
    prompt: 'How do loyalty points work?',
    expectedAction: 'explain_loyalty_points' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-explain-loyalty-earn',
    prompt: 'How do I earn loyalty points?',
    expectedAction: 'explain_loyalty_points' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-loyalty-balance',
    prompt: "What's my loyalty points balance?",
    expectedAction: 'loyalty_points_balance' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-loyalty-balance-how-many',
    prompt: 'How many loyalty points do I have?',
    expectedAction: 'loyalty_points_balance' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-redeem-referral',
    prompt: 'Redeem referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-apply-referral',
    prompt: 'Apply referral code SAVE20',
    expectedAction: 'claim_referral_code' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-claim-referral',
    prompt: 'Claim referral code FRIEND10',
    expectedAction: 'claim_referral_code' as const,
    stolenBy: 'guide_user_flow' as const,
  },
  {
    id: 'e2e233-explain-rewards-wallet',
    prompt: 'Explain my rewards wallet',
    expectedAction: 'explain_loyalty_points' as const,
    stolenBy: 'guide_user_flow' as const,
  },
] as const;

/** Real UI-guide prompts — must still match product guide when mode omitted/guide. */
export const E2E233_STILL_GUIDE_PROMPTS = [
  {
    id: 'e2e233-still-how-book',
    prompt: 'How do I book an appointment?',
    expectedGuide: true,
  },
  {
    id: 'e2e233-still-walkthrough',
    prompt: 'Walk me through booking step by step',
    expectedGuide: true,
  },
  {
    id: 'e2e233-still-what-on-page',
    prompt: 'What can I do on this page?',
    expectedGuide: true,
  },
] as const;
