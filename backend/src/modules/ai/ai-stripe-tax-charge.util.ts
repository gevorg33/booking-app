import {
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
} from './ai-retail-finance.util.js';
import { isExplainStripeCheckoutCurrencyPrompt } from './ai-stripe-checkout-currency.util.js';

export const STRIPE_TAX_CHARGE_INTENTS = ['explain_stripe_tax_charge'] as const;

export type StripeTaxChargeIntent = (typeof STRIPE_TAX_CHARGE_INTENTS)[number];

export interface ParsedExplainStripeTaxCharge {
  bookingId?: string;
  customerName?: string;
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasStripeTaxChargeContext(prompt: string): boolean {
  if (!/\bstripe\b/i.test(prompt)) return false;

  if (
    /\b(tax|vat|gst|pst|hst|ндс|налог|հարկ)\b/i.test(prompt) ||
    /\b(inclusive|exclusive|net|gross|amountdue|metadata\.pricing)\b/i.test(
      prompt,
    ) ||
    /\b(charged|charge|payment|paid|spisal|գանձ)/i.test(prompt)
  ) {
    return true;
  }

  if (containsCyrillicScript(prompt)) {
    return /(налог|ндс|списал|оплат|сумм)/i.test(prompt);
  }
  if (containsArmenianScript(prompt)) {
    return /(հարկ|գանձ|վճար)/i.test(prompt);
  }

  return /\bwhy\b/i.test(prompt) && /\b(charged|charge)\b/i.test(prompt);
}

export function isExplainStripeTaxChargePrompt(prompt: string): boolean {
  if (isExplainStripeCheckoutCurrencyPrompt(prompt)) return false;
  if (!hasStripeTaxChargeContext(prompt)) return false;

  if (
    /\b(lookup|retrieve|pull|fetch|metadata\.pricing|tax\s+metadata|frozen|snapshot|dispute|receipt)\b/i.test(
      prompt,
    ) &&
    !/\bwhy\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(currency|currencies|iso)\b/i.test(prompt) &&
    !/\b(tax|vat|gst|pst|hst|inclusive|exclusive|metadata\.pricing|amountdue|netamount)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(?:charged in|charge currency|pay in)\b/i.test(prompt) &&
    /\b(eur|usd|amd|rub|euros?|dollars?|rubles?)\b/i.test(prompt) &&
    !/\b(tax|vat|gst|pst|inclusive|exclusive)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(checkout session|session creation|connect warning|currency mismatch)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const explainCue =
    /\b(?:why|what|which|explain|describe|show|how|break\s*down|inclusive|exclusive)\b/i.test(
      prompt,
    ) ||
    (containsCyrillicScript(prompt) &&
      /(почему|объясни|покажи|какой|налог)/i.test(prompt)) ||
    (containsArmenianScript(prompt) &&
      /(ինչու|բացատրիր|ցույց|ինչ)/i.test(prompt));

  return explainCue;
}

export function parseExplainStripeTaxChargeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainStripeTaxCharge | null {
  if (!isExplainStripeTaxChargePrompt(prompt)) return null;

  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined) ?? extractBookingIdFromPrompt(prompt) ?? undefined;
  const possessiveCustomer = prompt.match(
    /\bfor\s+([A-Za-z][\w]+)(?:'s)?\s+booking\b/i,
  );
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    possessiveCustomer?.[1]?.trim() ??
    extractCustomerNameFromPrompt(prompt) ??
    undefined;

  const parsed: ParsedExplainStripeTaxCharge = {};
  if (bookingId) parsed.bookingId = bookingId;
  if (customerName) parsed.customerName = customerName;
  return parsed;
}

export function rescueStripeTaxChargeIntent(
  prompt: string,
  action: string,
): { action: StripeTaxChargeIntent; rescueReason: string } | null {
  if ((STRIPE_TAX_CHARGE_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (!isExplainStripeTaxChargePrompt(prompt)) return null;
  return {
    action: 'explain_stripe_tax_charge',
    rescueReason: 'explain_stripe_tax_charge',
  };
}
