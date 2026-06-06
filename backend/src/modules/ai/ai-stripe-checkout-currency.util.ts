import {
  hasDashboardStripeSettingsContext,
  hasStripeOnlineSupportListContext,
  isExplainStripeCurrencyWarningPrompt,
} from './ai-stripe-currency-warning.util.js';
import { hasStripeCheckoutFailureContext } from './ai-stripe-checkout-failure.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

export const STRIPE_CHECKOUT_CURRENCY_INTENTS = [
  'explain_stripe_checkout_currency',
] as const;

export type StripeCheckoutCurrencyIntent =
  (typeof STRIPE_CHECKOUT_CURRENCY_INTENTS)[number];

export function isStripeCheckoutCurrencyIntent(
  action: string,
): action is StripeCheckoutCurrencyIntent {
  return (STRIPE_CHECKOUT_CURRENCY_INTENTS as readonly string[]).includes(
    action,
  );
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasCurrencyCue(prompt: string): boolean {
  return (
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars|charged?)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt)
  );
}

function hasProviderPosPaymentContext(prompt: string): boolean {
  return (
    /\b(pos|payment\s+breakdown|grand\s+total|collect\s+cash|provider\s+app|appointment\s+payment|booking\s+breakdown|retail\s+add|касс|разбивк|կասս)\b/i.test(
      prompt,
    ) ||
    (/\b(collect|breakdown|total)\b/i.test(prompt) &&
      /\b(cash|pos|appointment|retail)\b/i.test(prompt))
  );
}

export function hasStripeCheckoutCurrencyContext(prompt: string): boolean {
  if (
    hasProviderPosPaymentContext(prompt) &&
    !/\b(stripe\s+checkout|pay\s+online|online\s+checkout|charged?\s+on)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  return (
    /\b(stripe\s+checkout|online\s+(?:card\s+)?checkout|pay\s+online|card\s+(?:was\s+)?charg(?:ed|e)|charged\s+on|online\s+payment|checkout\s+session)\b/i.test(
      prompt,
    ) ||
    (/\b(stripe|online)\b/i.test(prompt) &&
      /\b(checkout|pay|charg(?:ed|e)|card\s+payment)\b/i.test(prompt)) ||
    (/\b(pay\s+online|pay\s+with\s+card)\b/i.test(prompt) &&
      /\b(currency|€|֏|₽|\$|AMD|EUR|USD|RUB)\b/i.test(prompt)) ||
    (/\b(cash|pay-at-venue|pay\s+at\s+(?:the\s+)?venue)\b/i.test(prompt) &&
      /\b(stripe|online\s+card|online\s+checkout)\b/i.test(prompt)) ||
    (/(?:stripe|առցանց)/i.test(prompt) && /(?:վճար|քարտ|գանձում)/i.test(prompt)) ||
    (/(?:stripe|онлайн|списал)/i.test(prompt) &&
      /(?:оплат|карт|валют)/i.test(prompt))
  );
}

export function hasCustomerStripeChargeContext(prompt: string): boolean {
  return (
    /\b(charged?|charge(?:\s+d|\s+for)?|my\s+(?:card|booking)|pay\s+online|booking\s+page|this\s+currency|doesn'?t\s+support)\b/i.test(
      prompt,
    ) || /(?:գանձում|վճար|առցանց|списал)/i.test(prompt)
  );
}

function hasStripeTaxChargeExplainContext(prompt: string): boolean {
  if (!/\bstripe\b/i.test(prompt)) return false;
  if (
    /\b(tax|vat|gst|pst|hst|inclusive|exclusive|metadata\.pricing|amountdue|netamount)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\bwhy\b/i.test(prompt) &&
    /\b(charged|charge)\b/i.test(prompt) &&
    /\bbooking\b/i.test(prompt)
  );
}

export function isExplainStripeCheckoutCurrencyPrompt(prompt: string): boolean {
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (hasStripeTaxChargeExplainContext(prompt)) return false;
  if (isExplainStripeCurrencyWarningPrompt(prompt)) return false;
  if (hasStripeCheckoutFailureContext(prompt)) return false;
  if (hasDashboardStripeSettingsContext(prompt)) return false;
  if (
    hasStripeOnlineSupportListContext(prompt) &&
    !hasCustomerStripeChargeContext(prompt)
  ) {
    return false;
  }
  if (
    /\b(why|explain)\b/i.test(prompt) &&
    /\b(stripe|online\s+payment)\b/i.test(prompt) &&
    /\b(required|must|only|have\s+to|mandatory)\b/i.test(prompt) &&
    !hasCurrencyCue(prompt)
  ) {
    return false;
  }
  if (!hasStripeCheckoutCurrencyContext(prompt)) return false;

  const hasCurrencyCueFlag = hasCurrencyCue(prompt);

  if (
    /\bwhy\b.+\b(charged?|charge|checkout|pay\s+online|stripe|currency|card)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\bwhat currency\b/i.test(prompt)) {
    return true;
  }

  if (
    /\b(why|what|which|can|explain)\b/i.test(prompt) &&
    (hasCurrencyCueFlag ||
      /\b(stripe|online|checkout|cash|pay-at-venue|pay\s+at)\b/i.test(prompt))
  ) {
    return true;
  }

  if (
    /\b(currency|money)\b/i.test(prompt) &&
    /\b(stripe|online|checkout|pay\s+online|card|charged?)\b/i.test(prompt)
  ) {
    return /\b(why|what|which|explain|can't|cannot)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որն|որը|կարո|հնարավոր)/i.test(prompt) &&
      /(stripe|առցանց|վճար|քարտ|արժույթ|€|֏|₽|AMD|EUR|RUB|USD|կանխիկ)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|можно|объясни)/i.test(prompt) &&
      /(stripe|онлайн|оплат|карт|списал|валют|€|֏|₽|наличн)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueStripeCheckoutCurrencyIntent(
  prompt: string,
  action: string,
): { action: StripeCheckoutCurrencyIntent; rescueReason: string } | null {
  if (isStripeCheckoutCurrencyIntent(action)) return null;
  if (!isExplainStripeCheckoutCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_stripe_checkout_currency',
    rescueReason: 'explain_stripe_checkout_currency',
  };
}
