import { isSummarizeCustomerTaxPaidPrompt } from './ai-summarize-customer-tax-paid.util.js';
import {
  normalizeTaxPricingModel,
  normalizeTaxRatePercent,
  type TaxPricingModel,
} from '../../common/utils/business-tax.util.js';

import {
  STACKED_TAX_INTENTS,
  STACKED_TAX_MUTATE_INTENTS,
  isConfigureStackedTaxRulesPrompt,
  isExplainStackedTaxPrompt,
} from './ai-stacked-tax.util.js';
import { STRIPE_TAX_CHARGE_INTENTS } from './ai-stripe-tax-charge.util.js';
import { LOOKUP_BOOKING_TAX_METADATA_INTENTS } from './ai-lookup-booking-tax-metadata.util.js';
import { QUOTE_STAFF_BOOKING_TAX_INTENTS } from './ai-quote-staff-booking-tax.util.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_INTENTS } from './ai-summarize-customer-tax-paid.util.js';

export const BUSINESS_TAX_INTENTS = [
  'configure_business_tax',
  'set_service_tax_rate',
  'explain_business_tax',
  ...STACKED_TAX_INTENTS,
  ...QUOTE_STAFF_BOOKING_TAX_INTENTS,
  ...SUMMARIZE_CUSTOMER_TAX_PAID_INTENTS,
  ...LOOKUP_BOOKING_TAX_METADATA_INTENTS,
  ...STRIPE_TAX_CHARGE_INTENTS,
] as const;

export const BUSINESS_TAX_MUTATE_INTENTS = [
  'configure_business_tax',
  'set_service_tax_rate',
  ...STACKED_TAX_MUTATE_INTENTS,
] as const;

export type BusinessTaxIntent = (typeof BUSINESS_TAX_INTENTS)[number];

export interface ParsedConfigureBusinessTax {
  enabled?: boolean;
  rate?: number;
  name?: string;
  model?: TaxPricingModel;
}

export interface ParsedSetServiceTaxRate {
  serviceQuery: string;
  taxRatePercent: number;
  serviceIds?: string[];
}

const MUTATE_TAX_VERBS =
  /\b(set|switch|change|enable|disable|turn\s+on|turn\s+off|use|make|configure|activate|deactivate|apply|assign|переключить)\b/i;

const SERVICE_TAX_SCOPE_CUE =
  /\b(?:service|services|massage|consultation|consultations|treatment|treatments|facial|facials|dental|spa|catalog)\b/i;

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasBusinessTaxContext(prompt: string): boolean {
  if (
    /\b(tax|vat|gst|sales\s*tax|tax[- ]?inclusive|tax[- ]?exclusive|tax[- ]?exempt)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հարկ|vat|gst|ակցիզ)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(налог|ндс|vat|gst|налогов)/i.test(prompt);
  }
  return false;
}

function extractTaxName(prompt: string): string | undefined {
  if (/\bgst\b/i.test(prompt)) return 'GST';
  if (/\bvat\b/i.test(prompt)) return 'VAT';
  if (/\bsales\s*tax\b/i.test(prompt)) return 'Sales Tax';
  if (containsArmenianScript(prompt) && /(ակցիզ|vat)/i.test(prompt)) {
    return 'VAT';
  }
  if (containsCyrillicScript(prompt)) {
    if (/\bgst\b/i.test(prompt)) return 'GST';
    if (/(ндс|vat)/i.test(prompt)) return 'VAT';
  }
  return undefined;
}

function extractTaxRate(prompt: string): number | undefined {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%?\s*(?:vat|gst|sales\s*tax|tax|ндс|налог|հարկ|percent|per\s*cent)/i,
    /(?:vat|gst|sales\s*tax|tax|ндс|налог|հարկ)(?:\s+rate)?\s*(?:of|at|to)?\s*(\d+(?:\.\d+)?)\s*(?:%|percent|per\s*cent)?/i,
    /(\d+(?:\.\d+)?)\s*(?:%|percent|per\s*cent)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const rate = normalizeTaxRatePercent(match[1]);
      if (rate != null) return rate;
    }
  }
  return undefined;
}

function extractServiceTaxRate(
  prompt: string,
  params: Record<string, unknown> = {},
): number | undefined {
  const fromParams = normalizeTaxRatePercent(
    params.taxRatePercent ?? params.rate,
  );
  if (fromParams != null) return fromParams;

  if (/\b(?:tax[- ]?exempt|no\s+tax|zero\s+tax)\b/i.test(prompt)) {
    return 0;
  }
  if (containsArmenianScript(prompt) && /հարկից\s+ազատ/i.test(prompt)) {
    return 0;
  }
  if (containsCyrillicScript(prompt) && /без\s+налога/i.test(prompt)) {
    return 0;
  }

  const zeroPercent = prompt.match(/\b0\s*%?\s*tax\b/i);
  if (zeroPercent) return 0;

  return extractTaxRate(prompt);
}

function cleanServiceQuery(value: string): string {
  return value
    .trim()
    .replace(/[?.!]+$/, '')
    .replace(/\bservices?\s*$/i, '')
    .trim();
}

function extractServiceTaxQuery(
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
    /\bmake\s+(.+?)\s+services?\s+tax[- ]?exempt/i,
    /\b(?:apply|set|assign)\s+(?:\d+(?:\.\d+)?%?\s+)?(?:tax\s+)?(?:to|on)\s+(.+?)(?:\s+only)?[.?!]?$/i,
    /\bset\s+(.+?)\s+to\s+\d+(?:\.\d+)?%?\s*tax/i,
    /\bset\s+\d+(?:\.\d+)?%?\s*tax\s+on\s+(.+?)(?:\s+services?)?[.?!]?$/i,
    /\b(?:tax[- ]?exempt)\s+(?:for\s+)?(.+?)(?:\s+services?)?[.?!]?$/i,
    /(?:դարձնել|կիրառել)\s+(.+?)\s+ծառայություն/i,
    /կիրառել\s+\d+(?:\.\d+)?%?\s+հարկ\s+միայն\s+(.+?)\s+համար/i,
    /(?:сделать|применить)\s+(.+?)\s+услуг/i,
    /применить\s+\d+(?:\.\d+)?%?\s+налог\s+только\s+к\s+(.+?)(?:[.?!]?)$/i,
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

function extractTaxModel(prompt: string): TaxPricingModel | undefined {
  if (
    /\b(tax[- ]?inclusive|inclusive\s+pricing|prices?\s+include\s+tax|including\s+tax)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(հարկով\s+ներառված|ներառված\s+հարկ|հարկով)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(с\s+налогом|включая\s+налог|налогов.*включ|цены\s+с\s+налогом)/i.test(
        prompt,
      ))
  ) {
    return 'inclusive';
  }
  if (
    /\b(tax[- ]?exclusive|exclusive\s+pricing|prices?\s+exclude\s+tax|excluding\s+tax|before\s+tax)\b/i.test(
      prompt,
    ) ||
    (containsCyrillicScript(prompt) &&
      /(без\s+налога|исключая\s+налог)/i.test(prompt))
  ) {
    return 'exclusive';
  }
  return undefined;
}

function extractTaxEnabled(prompt: string): boolean | undefined {
  if (
    /\b(?:enable|turn\s+on|activate)\b/i.test(prompt) &&
    hasBusinessTaxContext(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:disable|turn\s+off|deactivate)\b/i.test(prompt) &&
    hasBusinessTaxContext(prompt)
  ) {
    return false;
  }
  if (containsArmenianScript(prompt)) {
    if (
      /(միացնել|ակտիվացնել)/i.test(prompt) &&
      /(հարկ|vat|gst)/i.test(prompt)
    ) {
      return true;
    }
    if (/(անջատել|կասեցնել)/i.test(prompt) && /(հարկ|vat|gst)/i.test(prompt)) {
      return false;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (
      /(включить|активировать|включи)/i.test(prompt) &&
      /(налог|ндс|vat|gst)/i.test(prompt)
    ) {
      return true;
    }
    if (
      /(отключить|выключить|деактивировать)/i.test(prompt) &&
      /(налог|ндс|vat|gst)/i.test(prompt)
    ) {
      return false;
    }
  }
  return undefined;
}

export function parseBusinessTaxFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureBusinessTax | null {
  const enabledFromParams =
    typeof params.enabled === 'boolean' ? params.enabled : undefined;
  const rateFromParams = normalizeTaxRatePercent(params.rate);
  const nameFromParams =
    typeof params.name === 'string' && params.name.trim()
      ? params.name.trim()
      : undefined;
  const modelFromParams = normalizeTaxPricingModel(
    typeof params.model === 'string' ? params.model : undefined,
  );

  const enabled = enabledFromParams ?? extractTaxEnabled(prompt);
  const rate = rateFromParams ?? extractTaxRate(prompt);
  const name = nameFromParams ?? extractTaxName(prompt);
  const model = modelFromParams ?? extractTaxModel(prompt);

  if (
    enabled === undefined &&
    rate === undefined &&
    name === undefined &&
    model === undefined
  ) {
    return null;
  }

  const parsed: ParsedConfigureBusinessTax = {};
  if (enabled !== undefined) parsed.enabled = enabled;
  if (rate !== undefined) parsed.rate = rate;
  if (name !== undefined) parsed.name = name;
  if (model !== undefined) parsed.model = model;

  if (
    rate !== undefined &&
    enabled === undefined &&
    enabledFromParams === undefined
  ) {
    parsed.enabled = true;
  }

  return parsed;
}

export function parseSetServiceTaxRateFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSetServiceTaxRate | null {
  const serviceQuery = extractServiceTaxQuery(prompt, params);
  const taxRatePercent = extractServiceTaxRate(prompt, params);

  if (!serviceQuery || taxRatePercent === undefined) {
    return null;
  }

  const serviceIds = Array.isArray(params.serviceIds)
    ? params.serviceIds.filter(
        (value): value is string => typeof value === 'string',
      )
    : undefined;

  return {
    serviceQuery,
    taxRatePercent,
    ...(serviceIds?.length ? { serviceIds } : {}),
  };
}

export function isSetServiceTaxRatePrompt(prompt: string): boolean {
  if (!hasBusinessTaxContext(prompt)) return false;

  if (/\b(?:preview|quote|estimate|before\s+creat)\b/i.test(prompt)) {
    return false;
  }

  if (
    /\b(explain|describe|what|which|why|how)\b/i.test(prompt) &&
    !MUTATE_TAX_VERBS.test(prompt)
  ) {
    return false;
  }

  const serviceScoped =
    SERVICE_TAX_SCOPE_CUE.test(prompt) ||
    /\b(?:only|exempt|override)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(ծառայություն|մասաժ|խորհրդատ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(услуг|массаж|консультац)/i.test(prompt));
  if (!serviceScoped) return false;

  if (/\b(?:tax[- ]?exempt|no\s+tax|zero\s+tax|0\s*%?\s*tax)\b/i.test(prompt)) {
    return true;
  }

  if (/\b(?:apply|make|set|assign|use)\b/i.test(prompt)) return true;

  if (containsArmenianScript(prompt)) {
    if (
      /(դարձնել|կիրառել|սահմանել)/i.test(prompt) &&
      /(հարկ|ազատ)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(сделать|применить|установить)/i.test(prompt) &&
      /(налог|ндс|без\s+налога)/i.test(prompt)
    ) {
      return true;
    }
  }

  return extractServiceTaxRate(prompt) !== undefined;
}

export function isExplainBusinessTaxPrompt(prompt: string): boolean {
  if (!hasBusinessTaxContext(prompt)) return false;
  if (isSetServiceTaxRatePrompt(prompt)) return false;
  if (isExplainStackedTaxPrompt(prompt)) return false;
  if (isConfigureBusinessTaxPrompt(prompt)) return false;
  // e2e-bug.431 — "how much tax has Jane paid" is about a customer, not the
  // business's tax settings.
  //
  // The three exclusions above already keep this detector out of its siblings'
  // territory; `summarize_customer_tax_paid` was simply missing from the list,
  // and took all five of its eval cases. The guard below (line ~372) looks like
  // it should have caught them — it declines appointment-scoped prompts — but
  // it tests `\bappointment\b`, which does not match "appointments".
  if (isSummarizeCustomerTaxPaidPrompt(prompt)) return false;

  if (
    /\b(appointment|provider\s+app|payment\s+breakdown|mark(?:ed)?\s+paid|collected)\b/i.test(
      prompt,
    ) &&
    !/\b(salon|business|our\s+settings)\b/i.test(prompt)
  ) {
    return false;
  }

  if (/\b(?:preview|quote|estimate)\s+(?:tax|vat|gst)\b/i.test(prompt)) {
    return false;
  }

  if (/\b(?:tax\s+paid|paid\s+tax|tax\s+history)\b/i.test(prompt)) {
    return false;
  }

  if (
    /\b(booking page|service cards?|incl\.?|before i pay)\b/i.test(prompt) ||
    (/\bcheckout\b/i.test(prompt) &&
      !/\b(business|salon|our|settings)\b/i.test(prompt)) ||
    (containsArmenianScript(prompt) &&
      /(checkout|քարտեր|գրանցում|incl)/i.test(prompt) &&
      !/(սալոն|բիզնես|կարգավորում)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(checkout|карточк|записи|incl)/i.test(prompt) &&
      !/(салон|бизнес|настройк)/i.test(prompt))
  ) {
    return false;
  }

  const explainCue =
    /\b(?:what|which|explain|describe|show|how|current|our|status|breakdown|example)\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ինչ|ինչպես|բացատրիր|ցույց|ընթացիկ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(какой|какая|как|объясни|покажи|текущ)/i.test(prompt));

  return explainCue;
}

export function isConfigureBusinessTaxPrompt(prompt: string): boolean {
  if (!hasBusinessTaxContext(prompt)) return false;

  if (
    /\b(explain|describe|what|which|why|how)\b/i.test(prompt) &&
    !MUTATE_TAX_VERBS.test(prompt)
  ) {
    return false;
  }

  if (isSetServiceTaxRatePrompt(prompt)) return false;
  if (isConfigureStackedTaxRulesPrompt(prompt)) return false;

  if (MUTATE_TAX_VERBS.test(prompt)) return true;

  if (containsArmenianScript(prompt)) {
    if (
      /(սահմանել|փոխել|միացնել|անջատել|օգտագործել|կարգավորել|դարձնել)/i.test(
        prompt,
      ) &&
      /(հարկ|vat|gst)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(установить|сменить|включить|отключить|использовать|настроить|переключить)/i.test(
        prompt,
      ) &&
      /(налог|ндс|vat|gst)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueBusinessTaxIntent(
  prompt: string,
  action: string,
): { action: BusinessTaxIntent; rescueReason: string } | null {
  if ((BUSINESS_TAX_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (
    isSetServiceTaxRatePrompt(prompt) &&
    parseSetServiceTaxRateFromPrompt(prompt)
  ) {
    return {
      action: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
    };
  }

  if (isExplainBusinessTaxPrompt(prompt)) {
    return {
      action: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
    };
  }

  if (!isConfigureBusinessTaxPrompt(prompt)) return null;
  if (!parseBusinessTaxFromPrompt(prompt)) return null;
  return {
    action: 'configure_business_tax',
    rescueReason: 'configure_business_tax',
  };
}
