import {
  REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES,
  REWARDS_AND_REFERRAL_CLAIM_INTENTS,
  type RewardsAndReferralClaimIntent,
} from './ai-rewards-and-referral-claim.fixtures.js';

export {
  REWARDS_AND_REFERRAL_CLAIM_CLASSIFIER_RULES,
  REWARDS_AND_REFERRAL_CLAIM_INTENTS,
};
export type { RewardsAndReferralClaimIntent };

/**
 * e2e-bug.83 — redeem/claim/apply + referral|invite code (not gift-card checkout).
 */
const CLAIM_REFERRAL_CUE = new RegExp(
  String.raw`\b(redeem|claim|apply|use|enter|attach)\b[\s\S]{0,40}\b(referral|invite|friend(?:'s)?)\s*code\b|\b(referral|invite)\s*code\b[\s\S]{0,20}\b(redeem|claim|apply|use|enter)\b`,
  'iu',
);

export function isClaimReferralCodePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (/\bgift\s*card\b/i.test(text)) return false;
  return CLAIM_REFERRAL_CUE.test(text);
}

export function isRewardsAndReferralClaimIntent(
  action: string,
): action is RewardsAndReferralClaimIntent {
  return (REWARDS_AND_REFERRAL_CLAIM_INTENTS as readonly string[]).includes(
    action,
  );
}

export function rescueClaimReferralCodeIntent(
  prompt: string,
  action: string,
): { action: 'claim_referral_code'; rescueReason: string } | null {
  if (action === 'claim_referral_code') return null;
  if (!isClaimReferralCodePrompt(prompt)) return null;
  return {
    action: 'claim_referral_code',
    rescueReason: 'claim_referral_code',
  };
}

/** Extract a token after "referral/invite code" when present. */
export function extractReferralCodeFromPrompt(
  prompt: string,
): string | undefined {
  const match = prompt.match(
    /\b(?:referral|invite|friend(?:'s)?)\s*code\s*[:=]?\s*([A-Za-z0-9_-]{4,32})\b/i,
  );
  return match?.[1]?.trim() || undefined;
}

export function enrichClaimReferralCodeParamsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  if (
    typeof params.referralCode === 'string' &&
    params.referralCode.trim()
  ) {
    return params;
  }
  const referralCode = extractReferralCodeFromPrompt(prompt);
  return referralCode ? { ...params, referralCode } : params;
}
