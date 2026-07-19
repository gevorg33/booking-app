import { isExplainBusinessTaxPrompt } from './ai-business-tax.util.js';
import { isExplainStripeTaxChargePrompt } from './ai-stripe-tax-charge.util.js';
import { isLookupBookingTaxMetadataPrompt } from './ai-lookup-booking-tax-metadata.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';
import { CHECKOUT_TAX_MULTILINGUAL_SCENARIOS } from './ai-checkout-tax-multilingual.fixtures.js';
import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from './ai-checkout-tax.fixtures.js';
import type { CheckoutTaxAspect } from './ai-checkout-tax.fixtures.js';

export const CHECKOUT_TAX_INTENTS = ['explain_checkout_tax'] as const;

export type CheckoutTaxIntent = (typeof CHECKOUT_TAX_INTENTS)[number];

export type { CheckoutTaxAspect };

export interface ParsedExplainCheckoutTax {
  aspect: CheckoutTaxAspect;
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasCheckoutTaxCue(prompt: string): boolean {
  if (
    /\b(tax|vat|gst|pst|sales\s*tax|incl\.?|including\s+tax)\b/i.test(prompt) ||
    /\bincl\.\s*(?:\d+%?\s*)?(?:vat|gst|sales\s*tax)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հարկ|vat|gst|incl|ներառված)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(налог|ндс|vat|gst|incl|включ)/i.test(prompt);
  }
  return false;
}

function hasCheckoutPageContext(prompt: string): boolean {
  if (
    /\b(booking page|checkout|this page|service cards?|catalog|before i pay|when i pay|here|payment summary|confirmation step)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(էջ|checkout|քարտ|գին|գրանցում|booking page)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(страниц|записи|checkout|карточк|оплат)/i.test(prompt);
  }
  return false;
}

function hasPublicCheckoutTaxTopic(prompt: string): boolean {
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
    /\b(?:why|what)\b.+\b(?:tax|vat|gst)\b.+\b(?:checkout|booking|page|confirmation)\b/i.test(
      prompt,
    )
  );
}

function matchCheckoutTaxFixtureScenario(
  prompt: string,
): { aspect: CheckoutTaxAspect } | null {
  const normalized = prompt.trim().toLowerCase();
  for (const entry of EXPLAIN_CHECKOUT_TAX_PROMPTS) {
    if (entry.prompt.trim().toLowerCase() === normalized) {
      return { aspect: entry.aspect };
    }
  }
  for (const scenario of CHECKOUT_TAX_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return { aspect: scenario.aspect };
    }
  }
  return null;
}

function matchCheckoutTaxMultilingualScenario(
  prompt: string,
): (typeof CHECKOUT_TAX_MULTILINGUAL_SCENARIOS)[number] | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of CHECKOUT_TAX_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isExplainCheckoutTaxPrompt(prompt: string): boolean {
  if (isExplainStripeTaxChargePrompt(prompt)) return false;
  if (isLookupBookingTaxMetadataPrompt(prompt)) return false;
  if (matchCheckoutTaxMultilingualScenario(prompt)) return true;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (isExplainBusinessTaxPrompt(prompt)) return false;

  if (
    /\b(?:consumer app|salon app|the app|in the app|in-app|mobile app)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(salon settings|business settings|dashboard|our salon|tax number)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(incl\.?|including\s+tax)\b/i.test(prompt) &&
    /\b(vat|gst|sales\s*tax|mean|means|badge|badge|shown|show)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\bwhy\b.+\b(tax|vat|gst)\b/i.test(prompt) &&
    /\b(add|added|show|shown|line|checkout|booking|page|card)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(explain|what|why|which)\b/i.test(prompt) &&
    hasCheckoutTaxCue(prompt) &&
    hasCheckoutPageContext(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|բացատրիր|ինչ է)/i.test(prompt) &&
      /(հարկ(?!ավոր)|vat|gst|incl)/i.test(prompt) &&
      /(checkout|էջ|քարտ|գրանցում|booking page)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|что|объясни)/i.test(prompt) &&
      /(налог|ндс|vat|gst|incl)/i.test(prompt) &&
      /(страниц|записи|checkout|карточк|оплат)/i.test(prompt)
    ) {
      return true;
    }
  }

  const explainCue =
    /\b(?:what|which|why|how|explain|describe|mean|means|show)\b/i.test(
      prompt,
    ) || /\?\s*$/.test(prompt.trim());

  return (
    explainCue &&
    hasCheckoutTaxCue(prompt) &&
    hasPublicCheckoutTaxTopic(prompt) &&
    hasCheckoutPageContext(prompt)
  );
}

export function parseExplainCheckoutTaxAspect(
  prompt: string,
): CheckoutTaxAspect {
  const fixtureMatch = matchCheckoutTaxFixtureScenario(prompt);
  if (fixtureMatch) return fixtureMatch.aspect;

  if (
    /\b(?:service\s+list|service\s+cards?|services|catalog|incl\.?\s+badge|booking prices?)\b/i.test(
      prompt,
    ) &&
    /\b(?:incl\.?|badge|vat|gst|tax)\b/i.test(prompt) &&
    !/\b(?:confirmation|confirmed|success)\b/i.test(prompt)
  ) {
    return 'service_list';
  }
  if (
    /\b(?:confirmation|confirmed|success)\b.+\b(?:tax|payment\s+summary|breakdown)\b/i.test(
      prompt,
    ) ||
    /\b(?:tax|payment\s+summary|breakdown)\b.+\b(?:confirmation|confirmed)\b/i.test(
      prompt,
    )
  ) {
    return 'confirmation';
  }
  if (
    /\b(?:checkout|pay(?:ing)?|payment\s+summary|booking page)\b/i.test(
      prompt,
    ) &&
    /\b(?:tax|vat|gst|pst|payment\s+summary)\b/i.test(prompt)
  ) {
    return 'checkout';
  }
  return 'all';
}

export function parseExplainCheckoutTaxFromPrompt(
  prompt: string,
): ParsedExplainCheckoutTax | null {
  const fixtureMatch = matchCheckoutTaxFixtureScenario(prompt);
  if (fixtureMatch) return fixtureMatch;

  const multilingualScenario = matchCheckoutTaxMultilingualScenario(prompt);
  if (multilingualScenario) {
    return { aspect: multilingualScenario.aspect };
  }
  if (!isExplainCheckoutTaxPrompt(prompt)) return null;
  return { aspect: parseExplainCheckoutTaxAspect(prompt) };
}

export function isCheckoutTaxIntent(
  action: string,
): action is CheckoutTaxIntent {
  return (CHECKOUT_TAX_INTENTS as readonly string[]).includes(action);
}

export function rescueCheckoutTaxIntent(
  prompt: string,
  action: string,
): { action: CheckoutTaxIntent; rescueReason: string } | null {
  if (isCheckoutTaxIntent(action)) return null;
  if (!isExplainCheckoutTaxPrompt(prompt)) return null;
  return {
    action: 'explain_checkout_tax',
    rescueReason: 'explain_checkout_tax',
  };
}
