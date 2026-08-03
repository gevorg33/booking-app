/** e2e-bug.137 / e2e-bug.142 — list/view active promo codes (dashboard). */

export const LIST_PROMO_CODES_INTENTS = ['list_promo_codes'] as const;

export type ListPromoCodesIntent = (typeof LIST_PROMO_CODES_INTENTS)[number];

export function isListPromoCodesIntent(
  action: string,
): action is ListPromoCodesIntent {
  return (LIST_PROMO_CODES_INTENTS as readonly string[]).includes(action);
}

export function isListPromoCodesPrompt(prompt: string): boolean {
  if (/\b(create|add|issue|generate|deactivate|disable|remove)\b/i.test(prompt)) {
    return false;
  }
  // "Why wasn't my promo code applied?" is promo_code_help, not list (my + promo code).
  if (
    /\b(how\s+do|help|apply(?:ed)?|checkout|why|wasn'?t|didn'?t)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\b(promo|discount|coupon)\s+codes?\b/i.test(prompt) &&
    /\b(list|show|active|currently|what|which|all|my)\b/i.test(prompt)
  );
}

export function rescueListPromoCodesIntent(
  prompt: string,
  action: string,
): { action: ListPromoCodesIntent; rescueReason: string } | null {
  if (isListPromoCodesIntent(action)) return null;
  if (!isListPromoCodesPrompt(prompt)) return null;
  return { action: 'list_promo_codes', rescueReason: 'list_promo_codes' };
}
