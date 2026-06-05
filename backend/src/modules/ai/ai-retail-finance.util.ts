import { isExportCommissionsPrompt } from './ai-payments.util.js';

export const DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS = [
  'create_product',
  'link_product_to_service',
  'adjust_inventory',
  'add_retail_sale_to_booking',
  'remove_retail_line',
  'record_expense',
  'payout_export',
] as const;

export const DASHBOARD_RETAIL_FINANCE_READ_INTENTS = [
  'list_products',
  'list_expenses',
  'summarize_pl',
  'commission_report',
] as const;

export const PROVIDER_RETAIL_FINANCE_INTENTS = [
  'suggest_retail_upsell',
  'add_retail_to_my_booking',
] as const;

export const RETAIL_FINANCE_INTENTS = [
  ...DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
  ...DASHBOARD_RETAIL_FINANCE_READ_INTENTS,
  ...PROVIDER_RETAIL_FINANCE_INTENTS,
] as const;

export type RetailFinanceIntent = (typeof RETAIL_FINANCE_INTENTS)[number];

export interface RetailFinanceCompoundStep {
  action: RetailFinanceIntent;
  params: Record<string, unknown>;
  segment: string;
}

const RETAIL_FINANCE_VERB =
  /\b(list|create|link|adjust|add|remove|record|summarize|commission|payout|export|product|products|inventory|stock|retail|expense|expenses|upsell|p\s*&\s*l|profit|loss)\b/i;

const COMPOUND_NEXT =
  '(?:list|create|link|adjust|add|remove|record|summarize|commission|payout|export|product|products|inventory|stock|retail|expense|expenses|upsell|profit|loss)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isRetailFinanceIntent(
  action: string,
): action is RetailFinanceIntent {
  return (RETAIL_FINANCE_INTENTS as readonly string[]).includes(action);
}

export function isListServicesCatalogPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\bservices?\b/i.test(prompt) &&
    !/\bproducts?\b/i.test(prompt) &&
    !/\binventory\b/i.test(prompt)
  );
}

export function isListProductsPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(products?|inventory|stock|retail\s+catalog)\b/i.test(prompt) &&
    !isListServicesCatalogPrompt(prompt)
  );
}

export function isCreateProductPrompt(prompt: string): boolean {
  return (
    /\b(create|add)\b/i.test(prompt) &&
    /\bproduct\b/i.test(prompt) &&
    !/\blink\b/i.test(prompt)
  );
}

export function isLinkProductToServicePrompt(prompt: string): boolean {
  return (
    /\b(link|attach|connect)\b/i.test(prompt) &&
    /\bservice\b/i.test(prompt) &&
    (/\bproduct\b/i.test(prompt) || /\bto\s+.+?\s+service\b/i.test(prompt))
  );
}

export function isAdjustInventoryPrompt(prompt: string): boolean {
  return (
    /\b(adjust|update|change|increase|decrease)\b/i.test(prompt) &&
    /\b(inventory|stock|quantity)\b/i.test(prompt)
  );
}

export function isAddRetailSaleToBookingPrompt(prompt: string): boolean {
  return (
    /\b(add|attach|sell)\b/i.test(prompt) &&
    /\bretail\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt)
  );
}

export function isRemoveRetailLinePrompt(prompt: string): boolean {
  return (
    /\b(remove|delete|drop)\b/i.test(prompt) &&
    /\b(retail|product)\b/i.test(prompt) &&
    /\b(line|sale|item)\b/i.test(prompt)
  );
}

export function isRecordExpensePrompt(prompt: string): boolean {
  return (
    /\b(record|log|add|enter)\b/i.test(prompt) && /\bexpense\b/i.test(prompt)
  );
}

export function isListExpensesPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\bexpenses?\b/i.test(prompt) &&
    !/\b(record|log|add)\b/i.test(prompt)
  );
}

export function isSummarizePlPrompt(prompt: string): boolean {
  return (
    /\b(summarize|show|report)\b/i.test(prompt) &&
    /\b(p\s*&\s*l|profit\s+(and|&)\s+loss|p\/l)\b/i.test(prompt)
  );
}

export function isCommissionReportPrompt(prompt: string): boolean {
  return (
    /\bcommission\s+report\b/i.test(prompt) ||
    /\bstaff\s+commissions?\s+summary\b/i.test(prompt) ||
    (/\b(report|summary)\b/i.test(prompt) &&
      /\bcommissions?\b/i.test(prompt) &&
      !/\b(export|download|csv|payout)\b/i.test(prompt))
  );
}

export function isPayoutExportPrompt(prompt: string): boolean {
  return (
    /\bpayout\s+export\b/i.test(prompt) ||
    /\bexport\s+payout\s+csv\b/i.test(prompt)
  );
}

export function isSuggestRetailUpsellPrompt(prompt: string): boolean {
  return (
    /\b(suggest|recommend)\b/i.test(prompt) &&
    /\b(retail|product|upsell)\b/i.test(prompt)
  );
}

export function isAddRetailToMyBookingPrompt(prompt: string): boolean {
  return (
    /\badd\b/i.test(prompt) &&
    /\b(my\s+booking|my\s+appointment)\b/i.test(prompt) &&
    (/\b(retail|product)\b/i.test(prompt) || /\badd\s+[A-Za-z]/i.test(prompt))
  );
}

export function isRetailFinanceCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !RETAIL_FINANCE_VERB.test(trimmed)) return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeRetailFinanceCompoundPrompt(trimmed).length > 1
  );
}

export function extractProductNameFromPrompt(prompt: string): string | null {
  const named = prompt.match(/\bproduct\s+"([^"]+)"/i);
  if (named) return named[1].trim();
  const create = prompt.match(
    /\bcreate\s+product\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+sku|\s+retail|\s+quantity|\s+qty|\s+description|\s+and|\s*$)/i,
  );
  if (create) return create[1].trim();
  const addRetail = prompt.match(
    /\badd\s+(?:retail\s+)?(?:sale\s+)?([A-Za-z][\w\s'-]{1,30}?)\s+to\b/i,
  );
  if (addRetail) return addRetail[1].trim();
  const link = prompt.match(/\blink\s+([A-Za-z][\w\s'-]{1,30}?)\s+to\s+/i);
  if (link) return link[1].trim();
  const adjust = prompt.match(
    /\badjust\s+inventory\s+(?:for\s+)?([A-Za-z][\w\s'-]{1,30}?)(?:\s+by|\s*$)/i,
  );
  if (adjust) return adjust[1].trim();
  const remove = prompt.match(
    /\bremove\s+(?:retail\s+)?(?:line\s+)?([A-Za-z][\w\s'-]{1,30}?)\s+from\b/i,
  );
  if (remove) return remove[1].trim();
  return null;
}

export function extractSkuFromPrompt(prompt: string): string | null {
  const sku = prompt.match(/\bsku\s+([A-Za-z0-9_-]+)\b/i);
  return sku?.[1]?.trim() ?? null;
}

export function extractRetailPriceFromPrompt(prompt: string): number | null {
  const retail = prompt.match(/\bretail\s+(\d+(?:\.\d{1,2})?)\b/i);
  if (retail) return Number(retail[1]);
  const price = prompt.match(/\bprice\s+(\d+(?:\.\d{1,2})?)\b/i);
  return price ? Number(price[1]) : null;
}

export function extractQuantityFromPrompt(prompt: string): number | null {
  const qty = prompt.match(/\b(?:qty|quantity)\s+(\d+)\b/i);
  if (qty) return Number(qty[1]);
  const onHand = prompt.match(/\b(?:on\s+hand|stock)\s+(\d+)\b/i);
  return onHand ? Number(onHand[1]) : null;
}

export function extractInventoryDeltaFromPrompt(prompt: string): number | null {
  const decrease = prompt.match(
    /\bdecrease\s+(?:inventory|stock)\s+by\s+(\d+)\b/i,
  );
  if (decrease) return -Number(decrease[1]);
  const increase = prompt.match(
    /\bincrease\s+(?:inventory|stock)\s+by\s+(\d+)\b/i,
  );
  if (increase) return Number(increase[1]);
  const by = prompt.match(/\bby\s+(-?\d+)\b/i);
  if (by) return Number(by[1]);
  return null;
}

export function extractServiceNameFromPrompt(prompt: string): string | null {
  const toService = prompt.match(
    /\bto\s+([A-Za-z][\w\s'-]{1,40}?)\s+service\b/i,
  );
  if (toService) return toService[1].trim();
  const serviceWord = prompt.match(
    /\bservice\s+([A-Za-z][\w\s'-]{1,40}?)(?:\s+and|\s*$)/i,
  );
  return serviceWord?.[1]?.trim() ?? null;
}

export function extractBookingIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b(?:booking|appointment)\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];
  const short = prompt.match(/\bbooking\s+([a-z0-9-]{2,})\b/i);
  return short?.[1] ?? null;
}

export function extractCustomerNameFromPrompt(prompt: string): string | null {
  const forCustomer = prompt.match(
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  if (forCustomer) return forCustomer[1].trim();
  const customerWord = prompt.match(
    /\bcustomer\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+at|\s+and|\s*$)/i,
  );
  return customerWord?.[1]?.trim() ?? null;
}

export function extractExpenseCategoryFromPrompt(
  prompt: string,
): string | null {
  const category = prompt.match(/\bcategory\s+"([^"]+)"/i);
  if (category) return category[1].trim();
  const expense = prompt.match(
    /\bexpense\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+\$|\s+amount|\s+for|\s*$)/i,
  );
  return expense?.[1]?.trim() ?? null;
}

export function extractExpenseAmountFromPrompt(prompt: string): number | null {
  const amount = prompt.match(/\$?\s*(\d+(?:\.\d{1,2})?)\b/);
  return amount ? Number(amount[1]) : null;
}

export function extractExpenseDescriptionFromPrompt(
  prompt: string,
): string | null {
  const desc = prompt.match(/\bdescription\s+"([^"]+)"/i);
  return desc?.[1]?.trim() ?? null;
}

export function extractProductIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\bproduct\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return uuid?.[1] ?? null;
}

export function parseFirstProduct<T extends { id: string; name: string }>(
  products: T[],
): T | null {
  return products[0] ?? null;
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueRetailFinanceIntent(
  prompt: string,
  action: string,
): { action: RetailFinanceIntent; rescueReason: string } | null {
  if (isRetailFinanceIntent(action)) return null;
  if (isRetailFinanceCompoundPrompt(prompt)) return null;
  if (isListServicesCatalogPrompt(prompt)) return null;

  if (isPayoutExportPrompt(prompt)) {
    return { action: 'payout_export', rescueReason: 'payout_export' };
  }
  if (isExportCommissionsPrompt(prompt)) {
    return null;
  }

  if (isSuggestRetailUpsellPrompt(prompt)) {
    return {
      action: 'suggest_retail_upsell',
      rescueReason: 'suggest_retail_upsell',
    };
  }
  if (isAddRetailToMyBookingPrompt(prompt)) {
    return {
      action: 'add_retail_to_my_booking',
      rescueReason: 'add_retail_to_my_booking',
    };
  }

  if (isCommissionReportPrompt(prompt)) {
    return { action: 'commission_report', rescueReason: 'commission_report' };
  }
  if (isSummarizePlPrompt(prompt)) {
    return { action: 'summarize_pl', rescueReason: 'summarize_pl' };
  }
  if (isListExpensesPrompt(prompt)) {
    return { action: 'list_expenses', rescueReason: 'list_expenses' };
  }
  if (isRecordExpensePrompt(prompt)) {
    return { action: 'record_expense', rescueReason: 'record_expense' };
  }
  if (isRemoveRetailLinePrompt(prompt)) {
    return { action: 'remove_retail_line', rescueReason: 'remove_retail_line' };
  }
  if (isAddRetailSaleToBookingPrompt(prompt)) {
    return {
      action: 'add_retail_sale_to_booking',
      rescueReason: 'add_retail_sale',
    };
  }
  if (isAdjustInventoryPrompt(prompt)) {
    return { action: 'adjust_inventory', rescueReason: 'adjust_inventory' };
  }
  if (isLinkProductToServicePrompt(prompt)) {
    return { action: 'link_product_to_service', rescueReason: 'link_product' };
  }
  if (isCreateProductPrompt(prompt)) {
    return { action: 'create_product', rescueReason: 'create_product' };
  }
  if (isListProductsPrompt(prompt)) {
    return { action: 'list_products', rescueReason: 'list_products' };
  }

  return null;
}

function classifyRetailFinanceSegment(
  segment: string,
): RetailFinanceCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const productName = extractProductNameFromPrompt(text);
  if (productName) base.productName = productName;
  const sku = extractSkuFromPrompt(text);
  if (sku) base.sku = sku;
  const retailPrice = extractRetailPriceFromPrompt(text);
  if (retailPrice !== null) base.retailPrice = retailPrice;
  const quantity = extractQuantityFromPrompt(text);
  if (quantity !== null) base.quantityOnHand = quantity;
  const delta = extractInventoryDeltaFromPrompt(text);
  if (delta !== null) base.delta = delta;
  const serviceName = extractServiceNameFromPrompt(text);
  if (serviceName) base.serviceName = serviceName;
  const bookingId = extractBookingIdFromPrompt(text);
  if (bookingId) base.bookingId = bookingId;
  const customerName = extractCustomerNameFromPrompt(text);
  if (customerName) base.customerName = customerName;
  const productId = extractProductIdFromPrompt(text);
  if (productId) base.productId = productId;
  const category = extractExpenseCategoryFromPrompt(text);
  if (category) base.category = category;
  const amount = extractExpenseAmountFromPrompt(text);
  if (amount !== null) base.amount = amount;
  const description = extractExpenseDescriptionFromPrompt(text);
  if (description) base.description = description;
  if (/\bthis\s+month\b/i.test(text)) base.dateRange = 'this_month';
  if (/\bmy\s+appointment\b/i.test(text)) base.myAppointment = true;

  if (isListProductsPrompt(text)) {
    return { action: 'list_products', params: base, segment: text };
  }
  if (
    isCreateProductPrompt(text) ||
    (/\bcreate\b/i.test(text) && /\bproduct\b/i.test(text))
  ) {
    return { action: 'create_product', params: base, segment: text };
  }
  if (isLinkProductToServicePrompt(text)) {
    return { action: 'link_product_to_service', params: base, segment: text };
  }
  if (isAdjustInventoryPrompt(text)) {
    return { action: 'adjust_inventory', params: base, segment: text };
  }
  if (isAddRetailSaleToBookingPrompt(text)) {
    return {
      action: 'add_retail_sale_to_booking',
      params: base,
      segment: text,
    };
  }
  if (isRemoveRetailLinePrompt(text)) {
    return { action: 'remove_retail_line', params: base, segment: text };
  }
  if (isRecordExpensePrompt(text)) {
    return { action: 'record_expense', params: base, segment: text };
  }
  if (isListExpensesPrompt(text)) {
    return { action: 'list_expenses', params: base, segment: text };
  }
  if (isSummarizePlPrompt(text)) {
    return { action: 'summarize_pl', params: base, segment: text };
  }
  if (isCommissionReportPrompt(text)) {
    return { action: 'commission_report', params: base, segment: text };
  }
  if (isPayoutExportPrompt(text)) {
    return { action: 'payout_export', params: base, segment: text };
  }
  if (isSuggestRetailUpsellPrompt(text)) {
    return { action: 'suggest_retail_upsell', params: base, segment: text };
  }
  if (isAddRetailToMyBookingPrompt(text)) {
    return { action: 'add_retail_to_my_booking', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for retail, POS, and finance operations. */
export function decomposeRetailFinanceCompoundPrompt(
  prompt: string,
): RetailFinanceCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyRetailFinanceSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: RetailFinanceCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyRetailFinanceSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
