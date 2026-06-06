import { isExplainCheckoutTaxPrompt } from './ai-checkout-tax.util.js';
import { hasConsumerAppContext } from './ai-consumer-checkout-success.util.js';
import { isExplainConsumerCheckoutSuccessPrompt } from './ai-consumer-checkout-success.util.js';

export const CONSUMER_CHECKOUT_TAX_INTENTS = [
  'explain_consumer_checkout_tax',
] as const;

export type ConsumerCheckoutTaxIntent =
  (typeof CONSUMER_CHECKOUT_TAX_INTENTS)[number];

export type ConsumerCheckoutTaxAspect =
  | 'checkout'
  | 'confirmation'
  | 'service_list'
  | 'all';

export interface ParsedExplainConsumerCheckoutTax {
  aspect: ConsumerCheckoutTaxAspect;
}

function hasConsumerCheckoutTaxCue(prompt: string): boolean {
  if (
    /\b(tax|vat|gst|pst|sales\s*tax|incl\.?|including\s+tax)\b/i.test(prompt) ||
    /\bincl\.\s*(?:\d+%?\s*)?(?:vat|gst|sales\s*tax)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

function hasConsumerCheckoutTaxTopic(prompt: string): boolean {
  return (
    /\b(?:tax\s+line|tax\s+breakdown|payment\s+summary)\b/i.test(prompt) ||
    /\b(?:incl\.?|inclusive)\b.+\b(?:badge|label|service|card)\b/i.test(
      prompt,
    ) ||
    /\b(?:service\s+list|service\s+cards?|catalog)\b.+\b(?:tax|vat|gst|incl)\b/i.test(
      prompt,
    ) ||
    /\b(?:checkout|confirmation|confirm(?:ed)?)\b.+\b(?:tax|vat|gst)\b/i.test(
      prompt,
    ) ||
    /\b(?:why|what)\b.+\b(?:tax|vat|gst)\b.+\b(?:app|checkout|confirmation)\b/i.test(
      prompt,
    )
  );
}

export function isExplainConsumerCheckoutTaxPrompt(prompt: string): boolean {
  if (!hasConsumerCheckoutTaxCue(prompt)) return false;
  if (!hasConsumerAppContext(prompt)) return false;
  if (isExplainCheckoutTaxPrompt(prompt) && !hasConsumerAppContext(prompt)) {
    return false;
  }

  if (
    isExplainConsumerCheckoutSuccessPrompt(prompt) &&
    !/\b(tax|vat|gst|incl\.?|payment\s+summary|tax\s+line|tax\s+breakdown)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(booking page|this page|public page|website)\b/i.test(prompt) &&
    !/\b(?:consumer app|salon app|the app|in the app|in-app)\b/i.test(prompt)
  ) {
    return false;
  }

  const explainCue =
    /\b(?:what|which|why|how|explain|describe|mean|means|show)\b/i.test(
      prompt,
    ) || /\?\s*$/.test(prompt.trim());

  return explainCue && hasConsumerCheckoutTaxTopic(prompt);
}

export function parseExplainConsumerCheckoutTaxAspect(
  prompt: string,
): ConsumerCheckoutTaxAspect {
  if (
    /\b(?:service\s+list|service\s+cards?|services|catalog|incl\.?\s+badge)\b/i.test(
      prompt,
    ) &&
    /\b(?:incl\.?|badge|vat|gst|tax)\b/i.test(prompt) &&
    !/\b(?:confirmation|confirmed|success)\b/i.test(prompt)
  ) {
    return 'service_list';
  }
  if (
    /\b(?:confirmation|confirmed|success)\b.+\b(?:tax|payment\s+summary)\b/i.test(
      prompt,
    ) ||
    /\b(?:tax|payment\s+summary)\b.+\b(?:confirmation|success)\b/i.test(
      prompt,
    )
  ) {
    return 'confirmation';
  }
  if (
    /\b(?:checkout|pay(?:ing)?|payment\s+summary)\b/i.test(prompt) &&
    /\b(?:tax|vat|gst|pst|payment\s+summary)\b/i.test(prompt)
  ) {
    return 'checkout';
  }
  return 'all';
}

export function parseExplainConsumerCheckoutTaxFromPrompt(
  prompt: string,
): ParsedExplainConsumerCheckoutTax | null {
  if (!isExplainConsumerCheckoutTaxPrompt(prompt)) return null;
  return { aspect: parseExplainConsumerCheckoutTaxAspect(prompt) };
}

export function rescueExplainConsumerCheckoutTaxIntent(
  prompt: string,
  action: string,
): { action: ConsumerCheckoutTaxIntent; rescueReason: string } | null {
  if ((CONSUMER_CHECKOUT_TAX_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (!isExplainConsumerCheckoutTaxPrompt(prompt)) return null;
  return {
    action: 'explain_consumer_checkout_tax',
    rescueReason: 'explain_consumer_checkout_tax',
  };
}
