export const REWARDS_AND_REFERRAL_CLAIM_INTENTS = [
  'explain_rewards_wallet',
  'claim_referral_code',
  'claim_share_reward',
] as const;

export type RewardsAndReferralClaimIntent =
  (typeof REWARDS_AND_REFERRAL_CLAIM_INTENTS)[number];

export const REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES = `- explain_rewards_wallet: READ — signed-in customer: show combined rewards wallet (loyalty points balance + active promotions) in one view. Triggers: my rewards, what's in my rewards wallet, do I have any points or promos. NOT loyalty_points_balance (points only, no promos), NOT explain_loyalty_points (how points work, not the balance), NOT list_public_promotions (catalog promos, not personal wallet).
- claim_referral_code: MUTATE — signed-in customer redeems a referral code they received from a friend, attaching it to their account. Triggers: claim referral code ABC123, redeem my friend's invite code, apply referral code. Requires referralCode. NOT refer_a_friend (get MY OWN code to share), NOT promo_code_help|apply_promo_code_checkout (checkout promo code, unrelated).
- claim_share_reward: MUTATE — signed-in customer claims the reward earned for sharing their booking or the salon link. Triggers: claim my share reward, I shared my booking give me my points, claim reward for sharing. Set channel to booking or salon depending on what was shared. NOT explain_share_reward (policy explainer only), NOT share_my_booking|share_salon_link (the act of sharing itself, not claiming the reward after).`;
