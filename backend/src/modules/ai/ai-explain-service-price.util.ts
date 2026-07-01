import {
  PrepaymentMode,
  type Service,
} from '../service/entities/service.entity.js';
import {
  formatInclusiveTaxBadge,
  readBusinessTaxSettings,
  toPublicBusinessTaxSettings,
} from '../../common/utils/business-tax.util.js';
import { formatCatalogServicePriceLabel } from './ai-budget-list-services.logic.js';
import {
  describeServicePrepaymentPolicy,
  resolveServicePrepaymentDueAmount,
} from './ai-explain-prepayment.util.js';
import {
  extractAmountFromPrompt,
  extractServiceNameFromPrompt,
  isExplainCheckoutTotalPrompt,
} from './ai-payments.util.js';
import { extractMaxPriceFromBudgetPrompt } from './ai-budget-service-discovery.util.js';
import {
  isExplainAmountDueNowPrompt,
  isExplainWhyPrepaymentPrompt,
} from './ai-explain-prepayment.util.js';
import { isCompareServicesPrompt } from './ai-compare-services.util.js';

export const CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES = `- explain_service_price: READ — explain a catalog service's listed card price, tax badge (incl. VAT/GST when tax-inclusive), and deposit/prepayment note. Triggers: how much is a haircut, what's the price of massage, cost of facial, is massage included in the $80, listed price for color. Set serviceName when the user names a catalog service; on public booking use session serviceId/serviceName when they refer to the selected service. NOT list_services (catalog browse, budget filters, rank/tier lists), NOT explain_checkout_total (amount due now at checkout with gift-card math), NOT explain_why_stripe_required (why prepayment policy), NOT explain_checkout_tax (salon-wide tax settings), NOT explain_checkout_currency (currency display), and NOT discover_packages (bundle catalog).`;

export type ExplainServicePricePromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_service_price';
  serviceName?: string;
  rescueReason: 'service_price';
};

export const EXPLAIN_SERVICE_PRICE_PROMPTS: readonly ExplainServicePricePromptFixture[] =
  [
    {
      id: 'how-much-haircut-customer',
      prompt: 'How much is a haircut?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
    {
      id: 'price-of-massage-customer',
      prompt: "What's the price of massage?",
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'massage',
      rescueReason: 'service_price',
    },
    {
      id: 'cost-of-facial-customer',
      prompt: 'What does a facial cost?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'facial',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-color-customer',
      prompt: 'How much does color cost?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'color',
      rescueReason: 'service_price',
    },
    {
      id: 'included-in-80-massage-customer',
      prompt: 'Is massage included in the $80?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'massage',
      rescueReason: 'service_price',
    },
    {
      id: 'price-for-manicure-customer',
      prompt: 'Price for manicure?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'manicure',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-blowdry-customer',
      prompt: 'How much is a blowdry?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'blowdry',
      rescueReason: 'service_price',
    },
    {
      id: 'charge-for-trim-customer',
      prompt: "What's the charge for a trim?",
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'trim',
      rescueReason: 'service_price',
    },
    {
      id: 'listed-price-haircut-customer',
      prompt: "What's the listed price for haircut?",
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
    {
      id: 'fee-for-waxing-customer',
      prompt: 'What is the fee for waxing?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'waxing',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-spa-day-customer',
      prompt: 'How much is spa day package service?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'spa day package service',
      rescueReason: 'service_price',
    },
    {
      id: 'is-listed-40-haircut-customer',
      prompt: 'Is the haircut $40 on the service list?',
      surface: 'customer',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-haircut-public',
      prompt: 'How much is a haircut?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
    {
      id: 'price-of-massage-public',
      prompt: "What's the price of massage?",
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'massage',
      rescueReason: 'service_price',
    },
    {
      id: 'cost-of-facial-public',
      prompt: 'What does a facial cost?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'facial',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-color-public',
      prompt: 'How much does color cost?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'color',
      rescueReason: 'service_price',
    },
    {
      id: 'included-in-80-massage-public',
      prompt: 'Is massage included in the $80?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'massage',
      rescueReason: 'service_price',
    },
    {
      id: 'price-for-manicure-public',
      prompt: 'Price for manicure?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'manicure',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-blowdry-public',
      prompt: 'How much is a blowdry?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'blowdry',
      rescueReason: 'service_price',
    },
    {
      id: 'charge-for-trim-public',
      prompt: "What's the charge for a trim?",
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'trim',
      rescueReason: 'service_price',
    },
    {
      id: 'listed-price-haircut-public',
      prompt: "What's the listed price for haircut?",
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
    {
      id: 'fee-for-waxing-public',
      prompt: 'What is the fee for waxing?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'waxing',
      rescueReason: 'service_price',
    },
    {
      id: 'how-much-spa-day-public',
      prompt: 'How much is spa day package service?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'spa day package service',
      rescueReason: 'service_price',
    },
    {
      id: 'is-listed-40-haircut-public',
      prompt: 'Is the haircut $40 on the service list?',
      surface: 'public',
      expectedAction: 'explain_service_price',
      serviceName: 'haircut',
      rescueReason: 'service_price',
    },
  ];

function cleanExtractedServiceName(value: string): string {
  return value
    .trim()
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/[?.!]+$/, '');
}

function isBudgetConstrainedListPrompt(prompt: string): boolean {
  if (extractMaxPriceFromBudgetPrompt(prompt) == null) return false;
  if (
    /\b(?:included|include|covers?)\s+(?:in|by)\b/i.test(prompt) ||
    /\bis\s+.+\s+included\b/i.test(prompt) ||
    /ներառված\s+է/i.test(prompt) ||
    /входит\s+в/i.test(prompt)
  ) {
    return false;
  }
  return /\b(?:under|below|at most|no more than|less than|within|budget|affordable|cheapest|options under|what can i book|between)\b/i.test(
    prompt,
  );
}

export function extractServiceNameForPricePrompt(
  prompt: string,
): string | null {
  const howMuchDoesCost = prompt.match(
    /\bhow\s+much\s+does\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)\s+cost\b/i,
  );
  if (howMuchDoesCost) {
    const name = cleanExtractedServiceName(howMuchDoesCost[1]);
    if (name) return name;
  }

  const howMuch = prompt.match(
    /\bhow\s+much\s+(?:is|are)\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s+on\b|\s*\?|$)/i,
  );
  if (howMuch) {
    const name = cleanExtractedServiceName(howMuch[1]);
    if (name && !/^(it|this|that|there)$/i.test(name)) return name;
  }

  const priceOf = prompt.match(
    /\b(?:what(?:'s| is)|whats)\s+(?:the\s+)?(?:listed\s+)?price\s+(?:of|for)\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (priceOf) {
    const name = cleanExtractedServiceName(priceOf[1]);
    if (name) return name;
  }

  const costFor = prompt.match(
    /\b(?:cost|charge|fee)\s+(?:of|for)\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (costFor) {
    const name = cleanExtractedServiceName(costFor[1]);
    if (name) return name;
  }

  const priceFor = prompt.match(
    /\bprice\s+for\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)(?:\s*\?|$)/i,
  );
  if (priceFor) {
    const name = cleanExtractedServiceName(priceFor[1]);
    if (name) return name;
  }

  const whatDoesCost = prompt.match(
    /\bwhat\s+does\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)\s+cost\b/i,
  );
  if (whatDoesCost) {
    const name = cleanExtractedServiceName(whatDoesCost[1]);
    if (name) return name;
  }

  if (/\b(?:list|card|catalog)\b/i.test(prompt)) {
    const listedDollar = prompt.match(
      /\bis\s+(?:the\s+)?([a-z][\w\s'-]{2,50}?)\s+\$\d/i,
    );
    if (listedDollar) {
      const name = cleanExtractedServiceName(listedDollar[1]);
      if (name) return name;
    }
  }

  const included = prompt.match(
    /\bis\s+(?:a|an|the\s+)?([a-z][\w\s'-]{2,50}?)\s+included\b/i,
  );
  if (included) {
    const name = cleanExtractedServiceName(included[1]);
    if (name) return name;
  }

  return extractServiceNameFromPrompt(prompt);
}

export function isExplainServicePricePrompt(prompt: string): boolean {
  if (isCompareServicesPrompt(prompt)) return false;

  if (
    /րքա/i.test(prompt) ||
    /ինչ\s+արժե/i.test(prompt) ||
    /ներառված\s+է/i.test(prompt) ||
    /сколько\s+стоит/i.test(prompt) ||
    /какая\s+цена/i.test(prompt) ||
    /входит\s+в/i.test(prompt)
  ) {
    return true;
  }

  if (/\bwhat\s+does\s+.+\s+cost\b/i.test(prompt)) return true;
  if (/\bhow\s+much\s+does\s+.+\s+cost\b/i.test(prompt)) return true;
  if (
    /\b(?:what(?:'s| is)|whats)\s+(?:the\s+)?(?:listed\s+)?price\s+(?:of|for)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\bprice\s+for\b/i.test(prompt)) return true;

  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (isExplainWhyPrepaymentPrompt(prompt)) return false;
  if (isBudgetConstrainedListPrompt(prompt)) return false;
  if (
    /\b(?:list|show|browse)\s+(?:services|offerings|catalog|menu)\b/i.test(
      prompt,
    ) ||
    /\bwhat\s+(?:services|kinds|types|options)\s+(?:do you|are)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\bexplain\b/i.test(prompt) &&
    /\b(tax|currency|checkout)\b/i.test(prompt) &&
    !/\b(?:price|cost)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:included|include|covers?)\s+(?:in|by)\b/i.test(prompt) &&
    (/\$\s*\d/i.test(prompt) || /\bprice\b/i.test(prompt))
  ) {
    return true;
  }
  if (/\bis\s+.+\s+included\b/i.test(prompt) && /\$\s*\d/i.test(prompt)) {
    return true;
  }

  if (/\bhow\s+much\s+(?:is|are|does|do)\b/i.test(prompt)) {
    if (/\b(?:today|now|due|checkout|pay|deposit)\b/i.test(prompt))
      return false;
    return true;
  }
  if (/\b(?:cost|charge|fee)\s+(?:of|for)\b/i.test(prompt)) return true;
  if (
    /\bis\s+(?:the\s+)?[a-z][\w\s'-]{2,40}?\s+\$\d/i.test(prompt) &&
    /\b(?:list|card|catalog)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function enrichExplainServicePriceParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    extractServiceNameForPricePrompt(prompt);
  if (!serviceName) return params;
  return { ...params, serviceName };
}

export type ServicePriceExplainCopy = {
  summary: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  currency: string;
  durationMinutes: number;
  taxBadge: string | null;
  taxModel: 'inclusive' | 'exclusive' | null;
  taxEnabled: boolean;
  prepaymentMode: PrepaymentMode;
  prepaymentNote: string;
  depositDueNow: number;
  quotedAmount: number | null;
};

export function buildServicePriceExplainCopy(
  service: Pick<
    Service,
    | 'id'
    | 'name'
    | 'price'
    | 'currency'
    | 'durationMinutes'
    | 'prepaymentMode'
    | 'depositAmount'
  >,
  businessSettings: Record<string, unknown> | undefined,
  options: { prompt?: string } = {},
): ServicePriceExplainCopy {
  const servicePrice = Number(service.price);
  const currency = service.currency || 'USD';
  const priceLabel = formatCatalogServicePriceLabel(servicePrice, currency);
  const tax = readBusinessTaxSettings(businessSettings);
  const publicTax = toPublicBusinessTaxSettings(tax);
  const taxEnabled = publicTax != null;
  const taxModel = publicTax?.model ?? null;
  const inclusiveBadge =
    publicTax?.model === 'inclusive' && publicTax
      ? formatInclusiveTaxBadge(publicTax)
      : null;

  const quotedAmount = options.prompt
    ? extractAmountFromPrompt(options.prompt)
    : null;

  const taxNote = !publicTax
    ? 'No tax badge is shown — listed price is the amount on the service card.'
    : publicTax.model === 'inclusive'
      ? `Service card shows "${inclusiveBadge}" — tax is included in the listed price.`
      : `Listed price is before ${publicTax.name} (${publicTax.rate}%); tax is added at checkout.`;

  const prepaymentPolicy = describeServicePrepaymentPolicy(service);
  const depositDueNow = resolveServicePrepaymentDueAmount(service);
  const prepaymentNote =
    service.prepaymentMode === PrepaymentMode.NONE
      ? 'No online deposit when booking — pay at the visit unless another policy applies.'
      : depositDueNow > 0
        ? `Deposit note: ${prepaymentPolicy} ($${depositDueNow.toFixed(2)} due when booking online).`
        : `Deposit note: ${prepaymentPolicy}.`;

  const duration = service.durationMinutes ?? 0;
  const badgeSuffix = inclusiveBadge ? ` (${inclusiveBadge})` : '';
  const amountCompare =
    quotedAmount != null && Math.abs(quotedAmount - servicePrice) > 0.01
      ? `You asked about $${quotedAmount.toFixed(2)} — ${service.name} is listed at ${priceLabel}.`
      : quotedAmount != null
        ? `Yes — ${service.name} is listed at ${priceLabel}${badgeSuffix}.`
        : null;

  const summary = [
    `${service.name} — ${duration} min · ${priceLabel}${badgeSuffix}.`,
    amountCompare,
    taxNote,
    prepaymentNote,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    summary,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice,
    currency,
    durationMinutes: duration,
    taxBadge: inclusiveBadge,
    taxModel,
    taxEnabled,
    prepaymentMode: service.prepaymentMode,
    prepaymentNote,
    depositDueNow,
    quotedAmount,
  };
}

export function rescueExplainServicePriceIntent(
  prompt: string,
  action: string,
): { action: 'explain_service_price'; rescueReason: string } | null {
  if (action === 'explain_service_price') return null;
  if (!isExplainServicePricePrompt(prompt)) return null;
  return { action: 'explain_service_price', rescueReason: 'service_price' };
}

export function detectExplainServicePriceAction(
  prompt: string,
): 'explain_service_price' | null {
  return rescueExplainServicePriceIntent(prompt, 'unknown')?.action ?? null;
}
