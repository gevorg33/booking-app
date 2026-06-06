import { isExplainBusinessTaxPrompt } from './ai-business-tax.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

export const CHECKOUT_TAX_INTENTS = ['explain_checkout_tax'] as const;

export type CheckoutTaxIntent = (typeof CHECKOUT_TAX_INTENTS)[number];

export function isCheckoutTaxIntent(action: string): action is CheckoutTaxIntent {
  return (CHECKOUT_TAX_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasCheckoutTaxCue(prompt: string): boolean {
  if (
    /\b(tax|vat|gst|sales\s*tax|incl\.?|including\s+tax)\b/i.test(prompt) ||
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
    /\b(booking page|checkout|this page|service cards?|catalog|before i pay|when i pay|here)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(էջ|checkout|քարտ|գին|գրանցում)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(страниц|записи|checkout|карточк|оплат)/i.test(prompt);
  }
  return false;
}

export function isExplainCheckoutTaxPrompt(prompt: string): boolean {
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
      /(հարկ|vat|gst|incl)/i.test(prompt) &&
      /(checkout|էջ|քարտ|գրանցում)/i.test(prompt)
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

  return false;
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
