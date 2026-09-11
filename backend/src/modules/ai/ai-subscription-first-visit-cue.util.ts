import { extractServiceNameFromPrompt } from './ai-payments.util.js';

/**
 * e2e-bug.426 — "using their membership" is not a service, and not a step.
 *
 * `extractServiceNameFromPrompt('book them using their membership')` returns
 * `"them using their membership"`: a pronoun with the payment clause glued on.
 * Nothing rejected it, so the subscription-first-visit cue fired and
 * `create_booking_subscription_credit`'s *own documented example* decomposed
 * into a compound — a prompt that names exactly one command.
 *
 * The narrowing is deliberately the smallest one that distinguishes the real
 * cases from the over-claim. Every genuine fixture extracts a clean service
 * name — "today's massage", "haircut", "manicure" — while the over-claims are
 * a bare pronoun once the payment clause is removed. So: strip a trailing
 * payment clause, and reject what is left only if it is a pronoun.
 *
 * `"her first massage"` is why the pronoun test cannot stand alone: it begins
 * with one and is a perfectly good service phrase. And `"haircut using their
 * membership"` still passes, because a real service survives the strip —
 * narrowing that too would be a second, unmeasured behaviour change.
 */
const TRAILING_PAYMENT_CLAUSE =
  /\s+(?:using|with|on|via)\s+(?:their|his|her|my|our|the|a|an)?\s*(?:membership|subscription|plan|credits?)\b.*$/i;

/** A pronoun, optionally with a filler particle ("book her **in** using…"). */
const PRONOUN_ONLY =
  /^(?:them|they|him|her|us|me|it|he|she|you)(?:\s+(?:in|up))?$/i;

function isNamedServiceExtract(extracted: string): boolean {
  const normalized = extracted.trim().toLowerCase();
  if (!normalized) return false;
  if (/^(with\s+my\s+)?(subscription|membership|plan)\b/.test(normalized)) {
    return false;
  }
  if (/^(this\s+)?(booking|visit|appointment)\b/.test(normalized)) {
    return false;
  }
  const withoutPaymentClause = normalized
    .replace(TRAILING_PAYMENT_CLAUSE, '')
    .trim();
  if (!withoutPaymentClause) return false;
  if (PRONOUN_ONLY.test(withoutPaymentClause)) return false;
  return true;
}

export function hasSubscriptionFirstVisitMembershipCue(
  prompt: string,
): boolean {
  if (/\b(?:one[-\s]?time|subscribe\s+and\s+save|vs\.?)\b/i.test(prompt)) {
    return false;
  }
  return (
    (/\b(use|apply|redeem)\b/i.test(prompt) &&
      /\b(?:membership|plan|my\s+subscription)\b/i.test(prompt)) ||
    (/\b(?:book|pay)\b/i.test(prompt) &&
      /\b(?:membership|subscription|plan)\b/i.test(prompt))
  );
}

export function hasSubscriptionFirstVisitBookCue(prompt: string): boolean {
  const extracted = extractServiceNameFromPrompt(prompt);
  if (extracted && isNamedServiceExtract(extracted)) return true;
  if (/\b(?:today's|tomorrow's)\s+[a-z]/i.test(prompt)) return true;
  if (
    /\b(?:book|schedule|reserve)\b/i.test(prompt) &&
    /\b(?:membership|subscription|plan)\b/i.test(prompt) &&
    /\b(?:massage|haircut|facial|color|manicure|blowdry)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}
