import { extractCustomerNameFromPrompt } from './ai-customer-crm.util.js';
import { isExplainAppointmentTaxPrompt } from './ai-appointment-tax.util.js';

export const SUMMARIZE_CUSTOMER_TAX_PAID_INTENTS = [
  'summarize_customer_tax_paid',
] as const;

export type SummarizeCustomerTaxPaidIntent =
  (typeof SUMMARIZE_CUSTOMER_TAX_PAID_INTENTS)[number];

export interface ParsedSummarizeCustomerTaxPaid {
  customerName: string;
}

function extractSummarizeCustomerName(prompt: string): string | null {
  const fromCrm = extractCustomerNameFromPrompt(prompt);
  if (fromCrm) return fromCrm;

  const paidMatch = prompt.match(
    /\b(?:how\s+much|what)\s+(?:tax|vat|gst)\s+(?:has|did)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+paid\b/i,
  );
  if (paidMatch?.[1]) return paidMatch[1].trim();

  const historyMatch = prompt.match(
    /\b(?:what|how\s+much)\s+tax\s+did\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+pay\b/i,
  );
  if (historyMatch?.[1]) return historyMatch[1].trim();

  return null;
}

export function hasSummarizeCustomerTaxPaidContext(prompt: string): boolean {
  if (
    /\b(?:customer|client)\b/i.test(prompt) &&
    /\b(?:tax\s+paid|paid\s+tax|total\s+tax|tax\s+history|tax\s+across)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:how\s+much|total|sum|what)\b/i.test(prompt) &&
    /\b(?:tax|vat|gst)\b/i.test(prompt) &&
    /\b(?:paid|collected|appointments?|history|profile|pay)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:summarize|show|total)\b/i.test(prompt) &&
    /\b(?:tax\s+paid|tax\s+from)\b/i.test(prompt)
  ) {
    return true;
  }

  const possessiveTax = prompt.match(
    /\b([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)'s\s+(?:total\s+)?tax\b/i,
  );
  if (possessiveTax) return true;

  return false;
}

export function isSummarizeCustomerTaxPaidPrompt(prompt: string): boolean {
  if (isExplainAppointmentTaxPrompt(prompt)) return false;
  if (!hasSummarizeCustomerTaxPaidContext(prompt)) return false;

  if (
    /\b(?:payment\s+breakdown|we\s+collected|marked\s+paid)\b/i.test(
      prompt,
    ) &&
    !/\b(?:across|history|profile|customer)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:lookup|last\s+visit|segment|vip|email|phone)\b/i.test(prompt) &&
    !/\b(?:tax\s+paid|total\s+tax|tax\s+history|tax\s+across|summarize)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(?:appointment|booking)\s+history\b/i.test(prompt) &&
    /\b(?:tax|vat|gst)\b/i.test(prompt) &&
    /\b(?:paid|pay|collected)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:top|most|rank|which\s+customer|at[\s-]?risk|overview)\b/i.test(
      prompt,
    ) &&
    !/\b(?:tax\s+paid|total\s+tax)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(metadata|stripe|dispute|receipt|booking\s+metadata)\b/i.test(prompt) &&
    !/\b(?:history|appointments?|profile|paid\s+across)\b/i.test(prompt)
  ) {
    return false;
  }

  const summarizeCue =
    /\b(?:how\s+much|total|sum|summarize|show|what)\b/i.test(prompt) ||
    /\b(?:tax\s+paid|paid\s+tax|tax\s+history|tax\s+across)\b/i.test(prompt);

  return summarizeCue;
}

export function parseSummarizeCustomerTaxPaidFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSummarizeCustomerTaxPaid | null {
  if (!isSummarizeCustomerTaxPaidPrompt(prompt)) return null;

  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractSummarizeCustomerName(prompt) ??
    undefined;

  if (!customerName) return null;
  return { customerName };
}

export function rescueSummarizeCustomerTaxPaidIntent(
  prompt: string,
  action: string,
): { action: SummarizeCustomerTaxPaidIntent; rescueReason: string } | null {
  if (
    (SUMMARIZE_CUSTOMER_TAX_PAID_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }

  if (!isSummarizeCustomerTaxPaidPrompt(prompt)) return null;
  return {
    action: 'summarize_customer_tax_paid',
    rescueReason: 'summarize_customer_tax_paid',
  };
}
