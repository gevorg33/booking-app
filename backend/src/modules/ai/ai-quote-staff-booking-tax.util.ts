import { isConfigureStackedTaxRulesPrompt } from './ai-stacked-tax.util.js';

function hasBusinessTaxContext(prompt: string): boolean {
  return /\b(tax|vat|gst|sales\s*tax|tax[- ]?inclusive|tax[- ]?exclusive|tax[- ]?exempt)\b/i.test(
    prompt,
  );
}

function isMutateServiceTaxPrompt(prompt: string): boolean {
  if (!hasBusinessTaxContext(prompt)) return false;
  if (/\b(?:preview|quote|estimate|before\s+creat)\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(?:how\s+much|what)\s+tax\b/i.test(prompt) ||
    /\b(?:rules?\s+apply|does\s+the\s+service)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(?:make|apply|set|assign|use)\b/i.test(prompt) &&
    /\b(?:tax[- ]?exempt|only|override|\d+\s*%?\s*tax)\b/i.test(prompt)
  );
}

export const QUOTE_STAFF_BOOKING_TAX_INTENTS = [
  'quote_staff_booking_tax',
] as const;

export type QuoteStaffBookingTaxIntent =
  (typeof QUOTE_STAFF_BOOKING_TAX_INTENTS)[number];

export interface ParsedQuoteStaffBookingTax {
  serviceQuery: string;
  samplePrice?: number;
}

const SERVICE_SCOPE_CUE =
  /\b(?:service|services|massage|consultation|consultations|treatment|treatments|facial|facials|haircut|spa|catalog)\b/i;

function cleanServiceQuery(value: string): string {
  return value
    .trim()
    .replace(/[?.!]+$/, '')
    .replace(/\bservices?\s*$/i, '')
    .trim();
}

function extractQuoteServiceQuery(
  prompt: string,
  params: Record<string, unknown> = {},
): string | undefined {
  if (typeof params.serviceQuery === 'string' && params.serviceQuery.trim()) {
    return cleanServiceQuery(params.serviceQuery);
  }
  if (typeof params.serviceName === 'string' && params.serviceName.trim()) {
    return cleanServiceQuery(params.serviceName);
  }

  const patterns = [
    /\bquote\s+(?:gst|pst|vat|tax).+?\bon\s+(?:a\s+)?(?:\$?\d+(?:\.\d+)?\s+)?(.+?)(?:\s+for\s+staff|\s+booking|\s+service|$)/i,
    /\b(?:preview|quote|estimate)\s+(?:the\s+)?(?:tax|vat|gst)\s+(?:on|for)\s+(?:a\s+)?(?:\$?\d+(?:\.\d+)?\s+)?(.+?)(?:\s+before|\s+when|\s+for\s+staff|\s+service|[—?-]|$)/i,
    /\b(?:what\s+tax|how\s+much\s+tax)\s+(?:on|for|would\s+apply\s+to|applies?\s+to)\s+(?:the\s+)?(.+?)(?:\s+service)?(?:\s+before|\s+when|[—?-]|$)/i,
    /\bhow\s+much\s+tax\s+on\s+(.+?)(?:\s+[—-]|\s+does|\?|$)/i,
    /\btax\s+(?:on|for)\s+(?:a\s+)?(?:\$?\d+(?:\.\d+)?\s+)?(.+?)(?:\s+before\s+creat|\s+service|\s+booking|[—?-]|$)/i,
    /\b(?:staff|before\s+creat(?:ing)?)\s+(?:a\s+)?booking\s+(?:for\s+)?(.+?)(?:\s+service)?(?:\s+—|-|\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const query = cleanServiceQuery(match[1]);
      if (query.length >= 3) return query;
    }
  }

  return undefined;
}

function extractQuoteSamplePrice(
  prompt: string,
  params: Record<string, unknown> = {},
): number | undefined {
  const fromParams = normalizeQuotePrice(params.samplePrice ?? params.price);
  if (fromParams != null) return fromParams;

  const match = prompt.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (match?.[1]) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function normalizeQuotePrice(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function hasQuoteStaffBookingTaxContext(prompt: string): boolean {
  if (!hasBusinessTaxContext(prompt)) return false;

  if (
    /\b(?:preview|quote|estimate|before\s+(?:i\s+)?creat(?:e|ing)?|staff\s+booking|new\s+booking)\b/i.test(
      prompt,
    ) &&
    /\b(?:tax|vat|gst|pst|stacked|override)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:what\s+tax|how\s+much\s+tax)\s+(?:on|for|applies?)\b/i.test(prompt) &&
    SERVICE_SCOPE_CUE.test(prompt)
  ) {
    return true;
  }

  if (
    /\bhow\s+much\s+tax\s+on\b/i.test(prompt) &&
    /\b(?:override|stacked|service)\b/i.test(prompt)
  ) {
    return true;
  }

  if (/\btax[- ]?exempt\b/i.test(prompt) && SERVICE_SCOPE_CUE.test(prompt)) {
    return true;
  }

  return false;
}

export function isQuoteStaffBookingTaxPrompt(prompt: string): boolean {
  if (!hasQuoteStaffBookingTaxContext(prompt)) return false;
  if (isMutateServiceTaxPrompt(prompt)) return false;
  if (isConfigureStackedTaxRulesPrompt(prompt)) return false;

  if (
    /\b(?:our|salon|business)\s+(?:tax\s+)?settings\b/i.test(prompt) &&
    !SERVICE_SCOPE_CUE.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:explain|list|show)\s+our\s+(?:stacked\s+)?tax\s+rules\b/i.test(
      prompt,
    ) &&
    !/\b(?:preview|quote|before\s+creat|service|massage|consultation)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const quoteCue =
    /\b(?:preview|quote|estimate|before\s+(?:i\s+)?creat(?:e|ing)?|staff\s+booking|what\s+tax|how\s+much\s+tax|would\s+apply|applies?\s+to|tax[- ]?exempt|override|stacked)\b/i.test(
      prompt,
    );

  return (
    quoteCue &&
    (SERVICE_SCOPE_CUE.test(prompt) || extractQuoteServiceQuery(prompt) != null)
  );
}

export function parseQuoteStaffBookingTaxFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedQuoteStaffBookingTax | null {
  if (!isQuoteStaffBookingTaxPrompt(prompt)) return null;

  const serviceQuery = extractQuoteServiceQuery(prompt, params);
  if (!serviceQuery) return null;

  const parsed: ParsedQuoteStaffBookingTax = { serviceQuery };
  const samplePrice = extractQuoteSamplePrice(prompt, params);
  if (samplePrice != null) parsed.samplePrice = samplePrice;
  return parsed;
}

export function rescueQuoteStaffBookingTaxIntent(
  prompt: string,
  action: string,
): { action: QuoteStaffBookingTaxIntent; rescueReason: string } | null {
  if ((QUOTE_STAFF_BOOKING_TAX_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (!isQuoteStaffBookingTaxPrompt(prompt)) return null;
  return {
    action: 'quote_staff_booking_tax',
    rescueReason: 'quote_staff_booking_tax',
  };
}
