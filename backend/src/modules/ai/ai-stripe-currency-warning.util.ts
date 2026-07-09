import {
  isBulkUpdateServiceCurrencyPrompt,
  isConfigureBusinessCurrencyPrompt,
} from './ai-business-currency.util.js';
import { isExplainWhyStripeRequiredPrompt } from './ai-payments.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';
import { isConfigureStripeConnectPrompt } from './ai-stripe-connect.util.js';

export const STRIPE_CURRENCY_WARNING_INTENTS = [
  'explain_stripe_currency_warning',
] as const;

export type StripeCurrencyWarningIntent =
  (typeof STRIPE_CURRENCY_WARNING_INTENTS)[number];

export function isStripeCurrencyWarningIntent(
  action: string,
): action is StripeCurrencyWarningIntent {
  return (STRIPE_CURRENCY_WARNING_INTENTS as readonly string[]).includes(
    action,
  );
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasDashboardStripeSettingsContext(prompt: string): boolean {
  return (
    (/\b(settings?|business\s+currency\s+settings?|currency\s+settings?)\b/i.test(
      prompt,
    ) &&
      /\b(stripe|connect|warning|warn|online\s+card|card\s+payment)\b/i.test(
        prompt,
      )) ||
    /\b(stripe\s+connect|connect\s+account)\b/i.test(prompt) ||
    (/\b(stripe|connect)\b/i.test(prompt) &&
      /\b(warning|warn|alert|caution)\b/i.test(prompt)) ||
    (/\b(warning|warn|alert)\b/i.test(prompt) &&
      /\b(stripe|connect)\b/i.test(prompt)) ||
    (/(?:կարգավորում|նախազգուշացում)/i.test(prompt) &&
      /(?:stripe|նախազգուշացում)/i.test(prompt)) ||
    (/(?:настройк|предупрежден)/i.test(prompt) &&
      /(?:stripe|connect|предупрежден)/i.test(prompt))
  );
}

export function hasStripeOnlineSupportListContext(prompt: string): boolean {
  if (
    /\b(which|what|list)\b.+\b(iso|currency|currencies)\b.+\b(stripe|online\s+card|card\s+payment)/i.test(
      prompt,
    ) ||
    /\b(online\s+card|card\s+payment).*\b(support(?:ed)?|accept(?:s|ed)?)\b.+\b(currency|currencies|iso)/i.test(
      prompt,
    ) ||
    /\b(currencies)\b.+\b(stripe)\b.+\b(online|card|accept)/i.test(prompt) ||
    /\b(stripe)\b.+\b(accept(?:s|ed)?)\b.+\b(online|card)/i.test(prompt)
  ) {
    return true;
  }

  if (containsCyrillicScript(prompt)) {
    return (
      /(какие|какая|список)/i.test(prompt) &&
      /(stripe|оплат|карт|онлайн)/i.test(prompt) &&
      /валют/i.test(prompt)
    );
  }

  if (containsArmenianScript(prompt)) {
    return (
      /(որ|ինչ|ցուցակ)/i.test(prompt) &&
      /(stripe|վճար|քարտ|առցանց)/i.test(prompt) &&
      /արժույթ/i.test(prompt)
    );
  }

  return false;
}

function hasCashPayAtVenueContrast(prompt: string): boolean {
  return (
    hasDashboardStripeSettingsContext(prompt) &&
    /\b(cash|pay-at-venue|pay\s+at\s+(?:the\s+)?venue)\b/i.test(prompt) &&
    /\b(stripe|online|card)\b/i.test(prompt)
  );
}

function hasStripeOnlineCurrencyQuestion(prompt: string): boolean {
  return (
    /\b(why|what|which|explain|can'?t|cannot|list|mean)\b/i.test(prompt) &&
    /\b(stripe|online\s+card|card\s+payment|charge\s+cards?)\b/i.test(prompt) &&
    /\b(currency|currencies|iso)\b/i.test(prompt)
  );
}

function hasCustomerStripeChargeContext(prompt: string): boolean {
  return /\b(charged|charge\s+for|my\s+(?:card|booking)|pay\s+online|booking\s+page|doesn'?t\s+support)\b/i.test(
    prompt,
  );
}

function shouldExcludeCustomerStripeRequiredPrompt(prompt: string): boolean {
  return (
    isExplainWhyStripeRequiredPrompt(prompt) &&
    !hasDashboardStripeSettingsContext(prompt) &&
    !hasStripeOnlineSupportListContext(prompt) &&
    !hasStripeOnlineCurrencyQuestion(prompt) &&
    !hasCashPayAtVenueContrast(prompt)
  );
}

function hasStripeCheckoutFailureTroubleshootContext(prompt: string): boolean {
  if (
    (/\b(diagnose|troubleshoot|debug|fix)\b/i.test(prompt) &&
      /\b(stripe\s+checkout|checkout\s+session|checkout\s+fail)/i.test(
        prompt,
      )) ||
    (/\b(checkout\s+session|session\s+creation|online\s+payment\s+checkout)\b/i.test(
      prompt,
    ) &&
      /\b(fail(?:ed|ure|s|ing)?|error|broken|keeps?\s+failing)\b/i.test(prompt))
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    return (
      /(չստեղծ|սխալ|չի\s+աշխատ|խափան)/i.test(prompt) &&
      /(stripe|checkout|session)/i.test(prompt)
    );
  }

  if (containsCyrillicScript(prompt)) {
    return (
      /(не\s+созда|ошибк|сбой|не\s+работ)/i.test(prompt) &&
      /(stripe|checkout|сесси)/i.test(prompt)
    );
  }

  return false;
}

export function isExplainStripeCurrencyWarningPrompt(prompt: string): boolean {
  if (isConfigureBusinessCurrencyPrompt(prompt)) return false;
  if (
    isConfigureStripeConnectPrompt(prompt) &&
    !/\b(currency|currencies|warning|mean|means)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    isExplainServiceOnlinePaymentSetupPrompt(prompt) &&
    !/\b(currency|currencies|warning)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isBulkUpdateServiceCurrencyPrompt(prompt)) return false;
  if (hasStripeCheckoutFailureTroubleshootContext(prompt)) return false;
  if (hasCustomerStripeChargeContext(prompt)) return false;
  if (shouldExcludeCustomerStripeRequiredPrompt(prompt)) return false;

  const hasContext =
    hasDashboardStripeSettingsContext(prompt) ||
    hasStripeOnlineSupportListContext(prompt) ||
    hasCashPayAtVenueContrast(prompt) ||
    hasStripeOnlineCurrencyQuestion(prompt);

  if (!hasContext) return false;

  if (
    /\b(why|what|which|explain|list|mean)\b/i.test(prompt) ||
    /\b(warning|warn|support(?:ed)?|accept(?:s|ed)?|vs)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|բացատր|ցուցադր|ցուցակ)/i.test(prompt) &&
      /(stripe|նախազգուշացում|settings)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какие|объясни|список)/i.test(prompt) &&
      /(stripe|предупрежден|connect)/i.test(prompt) &&
      /(валют|оплат|карт|настройк)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueStripeCurrencyWarningIntent(
  prompt: string,
  action: string,
): { action: StripeCurrencyWarningIntent; rescueReason: string } | null {
  if (isStripeCurrencyWarningIntent(action)) return null;
  if (!isExplainStripeCurrencyWarningPrompt(prompt)) return null;
  return {
    action: 'explain_stripe_currency_warning',
    rescueReason: 'explain_stripe_currency_warning',
  };
}
