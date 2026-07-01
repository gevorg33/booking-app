import { extractServiceNameFromPrompt } from './ai-payments.util.js';

function isNamedServiceExtract(extracted: string): boolean {
  const normalized = extracted.trim().toLowerCase();
  if (!normalized) return false;
  if (/^(with\s+my\s+)?(subscription|membership|plan)\b/.test(normalized)) {
    return false;
  }
  if (/^(this\s+)?(booking|visit|appointment)\b/.test(normalized)) {
    return false;
  }
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
