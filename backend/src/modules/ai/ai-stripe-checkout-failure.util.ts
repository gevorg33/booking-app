import {
  isBulkUpdateServiceCurrencyPrompt,
  isConfigureBusinessCurrencyPrompt,
  isExplainBusinessCurrencyPrompt,
} from './ai-business-currency.util.js';
import {
  hasDashboardStripeSettingsContext,
  hasStripeOnlineSupportListContext,
} from './ai-stripe-currency-warning.util.js';

export const STRIPE_CHECKOUT_FAILURE_INTENTS = [
  'diagnose_stripe_checkout_failure',
] as const;

export type StripeCheckoutFailureIntent =
  (typeof STRIPE_CHECKOUT_FAILURE_INTENTS)[number];

export function isStripeCheckoutFailureIntent(
  action: string,
): action is StripeCheckoutFailureIntent {
  return (STRIPE_CHECKOUT_FAILURE_INTENTS as readonly string[]).includes(
    action,
  );
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasStripeCheckoutFailureContext(prompt: string): boolean {
  if (
    /\b(diagnose|troubleshoot|debug|fix)\b/i.test(prompt) &&
    /\b(stripe\s+checkout|checkout\s+session|checkout\s+fail)/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(checkout\s+session|session\s+creation|create\s+(?:a\s+)?checkout|online\s+payment\s+checkout|payment\s+checkout)\b/i.test(
      prompt,
    ) &&
    /\b(fail(?:ed|ure|s|ing)?|error|broken|not\s+work(?:ing)?|can'?t|cannot|won'?t|doesn'?t|keeps?\s+failing)\b/i.test(
      prompt,
    ) &&
    /\b(stripe|connect|online\s+(?:card\s+)?payment|checkout)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(customers?|clients?|guests?|bookings?)\b/i.test(prompt) &&
    /\b(can'?t|cannot|won'?t|doesn'?t|not\s+able)\b/i.test(prompt) &&
    /\b(pay\s+online|checkout|stripe)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(stripe\s+checkout|checkout\s+session|online\s+payment\s+checkout)\b/i.test(
      prompt,
    ) &&
    /\b(currency\s+mismatch|wrong\s+currency|unsupported|tenant\s+currency|mismatch)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(не\s+созда|ошибк|не\s+работ|не\s+могут|сбой|диагност)/i.test(prompt) &&
      /(stripe|checkout|сесси|онлайн|оплат)/i.test(prompt) &&
      /(валют|сесси|checkout)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(չստեղծ|սխալ|չի\s+աշխատ|չեն\s+կարող|խափան|որոշ)/i.test(prompt) &&
      /(stripe|checkout|session|առցանց|վճար)/i.test(prompt) &&
      /(արժույթ|session|checkout)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function isDiagnoseStripeCheckoutFailurePrompt(prompt: string): boolean {
  if (isConfigureBusinessCurrencyPrompt(prompt)) return false;
  if (isBulkUpdateServiceCurrencyPrompt(prompt)) return false;
  if (
    isExplainBusinessCurrencyPrompt(prompt) &&
    !hasStripeCheckoutFailureContext(prompt)
  ) {
    return false;
  }
  if (
    hasStripeOnlineSupportListContext(prompt) &&
    !hasStripeCheckoutFailureContext(prompt)
  ) {
    return false;
  }
  if (
    hasDashboardStripeSettingsContext(prompt) &&
    !hasStripeCheckoutFailureContext(prompt)
  ) {
    return false;
  }
  if (
    /\b(charged|my\s+(?:card|booking)|pay\s+online|booking\s+page)\b/i.test(
      prompt,
    ) &&
    !hasStripeCheckoutFailureContext(prompt)
  ) {
    return false;
  }
  if (!hasStripeCheckoutFailureContext(prompt)) return false;

  if (
    /\b(why|what|how|diagnose|troubleshoot|debug|fix|explain|check)\b/i.test(
      prompt,
    ) ||
    /\b(fail(?:ed|ure|s|ing)?|error|broken|mismatch|keeps?\s+failing)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որո|ինչպես|որոշ|խափան)/i.test(prompt) &&
      /(stripe|checkout|session|առցանց)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|что|как|диагност|ошибк|сбой)/i.test(prompt) &&
      /(stripe|checkout|сесси|онлайн)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueStripeCheckoutFailureIntent(
  prompt: string,
  action: string,
): { action: StripeCheckoutFailureIntent; rescueReason: string } | null {
  if (isStripeCheckoutFailureIntent(action)) return null;
  if (!isDiagnoseStripeCheckoutFailurePrompt(prompt)) return null;
  return {
    action: 'diagnose_stripe_checkout_failure',
    rescueReason: 'diagnose_stripe_checkout_failure',
  };
}
