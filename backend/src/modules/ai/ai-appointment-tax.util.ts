import { isExplainPaymentStatusPrompt } from './ai-payments.util.js';
import { isExplainProviderPaymentCurrencyPrompt } from './ai-provider-payment-currency.util.js';
import {
  parseBookingTaxQueryFromPrompt,
  type ParsedBookingTaxQuery,
} from './ai-booking-tax-query.util.js';

export const APPOINTMENT_TAX_INTENTS = ['explain_appointment_tax'] as const;

export type AppointmentTaxIntent = (typeof APPOINTMENT_TAX_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

export function hasAppointmentTaxContext(prompt: string): boolean {
  if (
    containsArmenianScript(prompt) &&
    /ԱԱՀ/i.test(prompt) &&
    /(հաշվարկ|ներառյալ|առանց|վճար)/i.test(prompt) &&
    !/(կարգավիճակ|թիմ|հարկում)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(налог|ндс)/i.test(prompt) &&
    /почему/i.test(prompt) &&
    /(стоимост|визит|запис)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(налог|ндс)/i.test(prompt) &&
    /включ[её]н/i.test(prompt) &&
    /или/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(appointment|booking)\b/i.test(prompt) &&
    /\b(tax|vat|gst|pst|hst|inclusive|exclusive)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(payment\s+breakdown|tax\s+lines?|tax\s+included|collected)\b/i.test(
      prompt,
    ) &&
    /\b(tax|vat|gst|inclusive|exclusive|amount)\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\bmark(?:ed)?\s+paid\b/i.test(prompt) && /\btax\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(inclusive)\b.{0,15}\b(vs\.?|or|versus)\b.{0,15}\b(exclusive)\b/i.test(
      prompt,
    ) &&
    /\b(tax|vat|gst|pst|hst)\b/i.test(prompt) &&
    !/\bbusiness\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bthis\s+breakdown\b/i.test(prompt) &&
    /\b(tax|vat|gst|pst|hst)\b/i.test(prompt) &&
    !/\bbusiness\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isExplainAppointmentTaxPrompt(prompt: string): boolean {
  if (!hasAppointmentTaxContext(prompt)) return false;
  if (isExplainProviderPaymentCurrencyPrompt(prompt)) return false;

  if (
    /\b(?:across|history|profile|customer)\b/i.test(prompt) &&
    /\b(?:tax|vat|gst)\b/i.test(prompt) &&
    /\b(?:paid|pay|summarize|total)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:booking page|public page|service cards?|this page|checkout page|booking prices?)\b/i.test(
      prompt,
    ) &&
    !/\b(?:provider|marked\s+paid|we\s+collected|payment\s+breakdown)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(?:shown|displayed)\s+on\b/i.test(prompt) &&
    /\b(?:booking|checkout|page|cards?|prices?|vat|gst|tax)\b/i.test(prompt) &&
    !/\b(?:provider|marked\s+paid|we\s+collected|payment\s+breakdown|collected)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(?:before\s+(?:i\s+)?creat(?:e|ing)?|preview|quote|estimate|staff\s+booking)\b/i.test(
      prompt,
    ) &&
    /\b(?:tax|vat|gst)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    isExplainPaymentStatusPrompt(prompt) &&
    !/\b(tax|vat|gst|inclusive|exclusive|breakdown)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(metadata|lookup|retrieve|dispute|receipt|support)\b/i.test(prompt) &&
    !/\b(breakdown|appointment|collected|mark\s+paid)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:tax\s+paid|paid\s+tax|booking\s+history|appointment\s+history|across\s+her|across\s+his)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const explainCue =
    /\b(?:what|which|explain|describe|show|how|why|is|included|exclusive|collected)\b/i.test(
      prompt,
    ) ||
    /\b(?:tax\s+lines?|payment\s+breakdown)\b/i.test(prompt) ||
    containsArmenianScript(prompt) ||
    containsCyrillicScript(prompt);

  return explainCue;
}

export function parseExplainAppointmentTaxFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookingTaxQuery | null {
  if (!isExplainAppointmentTaxPrompt(prompt)) return null;
  return parseBookingTaxQueryFromPrompt(prompt, params);
}

export function rescueAppointmentTaxIntent(
  prompt: string,
  action: string,
): { action: AppointmentTaxIntent; rescueReason: string } | null {
  if ((APPOINTMENT_TAX_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (!isExplainAppointmentTaxPrompt(prompt)) return null;
  return {
    action: 'explain_appointment_tax',
    rescueReason: 'explain_appointment_tax',
  };
}
