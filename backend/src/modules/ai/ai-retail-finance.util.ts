import { isExportCommissionsPrompt } from './ai-payments.util.js';
import { isMarkPaidPrompt } from './ai-booking-depth.util.js';

export const DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS = [
  'create_product',
  'link_product_to_service',
  'update_inventory_product',
  'delete_inventory_product',
  'unlink_inventory_product',
  'set_recommended_products',
  'adjust_inventory',
  'add_retail_sale_to_booking',
  'remove_retail_line',
  'record_expense',
  'delete_expense',
  'create_commission_rule',
  'delete_commission_rule',
  'payout_export',
  'set_retail_sales_lines',
  'export_analytics_report',
] as const;

export const DASHBOARD_RETAIL_FINANCE_READ_INTENTS = [
  'list_products',
  'list_expenses',
  'summarize_pl',
  'commission_report',
  'summarize_reviews',
  'summarize_adoption_funnel',
] as const;

export const PROVIDER_RETAIL_FINANCE_INTENTS = [
  'suggest_retail_upsell',
  'add_retail_to_my_booking',
  'search_retail_sku',
] as const;

export const RETAIL_FINANCE_INTENTS = [
  ...DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS,
  ...DASHBOARD_RETAIL_FINANCE_READ_INTENTS,
  ...PROVIDER_RETAIL_FINANCE_INTENTS,
] as const;

export type RetailFinanceIntent = (typeof RETAIL_FINANCE_INTENTS)[number];

export interface RetailFinanceCompoundStep {
  action: RetailFinanceIntent | 'mark_paid';
  params: Record<string, unknown>;
  segment: string;
}

const RETAIL_FINANCE_VERB =
  /\b(list|create|link|adjust|add|remove|record|summarize|commission|payout|export|product|products|inventory|stock|retail|expense|expenses|upsell|p\s*&\s*l|profit|loss|set|replace|mark|paid)\b/i;

const COMPOUND_NEXT =
  '(?:list|create|link|adjust|add|remove|record|summarize|commission|payout|export|product|products|inventory|stock|retail|expense|expenses|upsell|profit|loss|set|replace|mark|paid)';

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

function isPostCheckoutRecommendationProductPrompt(prompt: string): boolean {
  if (
    /\b(link|attach|connect)\b/i.test(prompt) &&
    /\bservice\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(add|create|set|update|configure|edit)\b/i.test(prompt) &&
    /\bproduct\b/i.test(prompt) &&
    (/\bpost[- ]?checkout\b/i.test(prompt) ||
      /\bcheckout\s+recommendation/i.test(prompt) ||
      /\brecommendation\s+product/i.test(prompt) ||
      /\bproduct\s+recommendation/i.test(prompt) ||
      /\bafter\s+checkout\b/i.test(prompt) ||
      /\brecommendation\s+carousel\b/i.test(prompt))
  );
}

export function isCreateProductPrompt(prompt: string): boolean {
  if (isPostCheckoutRecommendationProductPrompt(prompt)) return false;
  return (
    /\b(create|add)\b/i.test(prompt) &&
    /\bproduct\b/i.test(prompt) &&
    !/\blink\b/i.test(prompt)
  );
}

function isCheckoutRecommendationLinkPrompt(prompt: string): boolean {
  return (
    /\b(?:recommended|recommendation|checkout|post[- ]?checkout)\b/i.test(
      prompt,
    ) &&
    /\b(?:link|attach|set|recommend|suggest)\b/i.test(prompt) &&
    /\b(?:service|category)\b/i.test(prompt)
  );
}

export function isLinkProductToServicePrompt(prompt: string): boolean {
  if (isCheckoutRecommendationLinkPrompt(prompt)) return false;
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

/** e2e-bug.141 — delete a recorded expense by id/description/category. */
export function isDeleteExpensePrompt(prompt: string): boolean {
  if (/\b(retail|product|line|inventory|commission)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(delete|remove)\b/i.test(prompt) && /\bexpenses?\b/i.test(prompt)
  );
}

export function isRecordExpensePrompt(prompt: string): boolean {
  if (isDeleteExpensePrompt(prompt)) return false;
  return (
    /\b(record|log|add|enter)\b/i.test(prompt) && /\bexpense\b/i.test(prompt)
  );
}

export function isListExpensesPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\bexpenses?\b/i.test(prompt) &&
    !/\b(record|log|add|delete|remove)\b/i.test(prompt)
  );
}

export function isSummarizePlPrompt(prompt: string): boolean {
  return (
    /\b(summarize|show|report)\b/i.test(prompt) &&
    /\b(p\s*&\s*l|profit\s+(and|&)\s+loss|p\/l)\b/i.test(prompt)
  );
}

export function isCommissionReportPrompt(prompt: string): boolean {
  if (/\b(export|download|csv|payout)\b/i.test(prompt)) return false;
  if (isCreateCommissionRulePromptLoose(prompt)) return false;
  return (
    /\bcommission\s+report\b/i.test(prompt) ||
    /\bstaff\s+commissions?\s+summary\b/i.test(prompt) ||
    // e2e-bug.137 — "How much commission have my employees earned…"
    (/\bcommissions?\b/i.test(prompt) &&
      /\b(employees?|staff|providers?|earned|earn(?:ings?)?|how much)\b/i.test(
        prompt,
      )) ||
    (/\b(report|summary)\b/i.test(prompt) && /\bcommissions?\b/i.test(prompt))
  );
}

/** Detect set/create commission without requiring the report detector import cycle. */
function isCreateCommissionRulePromptLoose(prompt: string): boolean {
  return (
    /\b(set|create|add|assign|configure)\b/i.test(prompt) &&
    /\bcommission\b/i.test(prompt) &&
    /\b(rate|percent|%|flat|rule)\b/i.test(prompt) &&
    /\d+(?:\.\d+)?/.test(prompt)
  );
}

export function isPayoutExportPrompt(prompt: string): boolean {
  return (
    /\bpayout\s+export\b/i.test(prompt) ||
    /\bexport\s+payout\s+csv\b/i.test(prompt)
  );
}

/** e2e-bug.146 — set/create commission rate for an employee/service. */
export function isCreateCommissionRulePrompt(prompt: string): boolean {
  if (isPayoutExportPrompt(prompt) || isExportCommissionsPrompt(prompt)) {
    return false;
  }
  if (/\b(delete|remove|revoke)\b/i.test(prompt) && /\bcommission\b/i.test(prompt)) {
    return false;
  }
  if (/\b(how much|earned|report|summary)\b/i.test(prompt) && !/\b(set|create|add)\b/i.test(prompt)) {
    return false;
  }
  return isCreateCommissionRulePromptLoose(prompt);
}

/** e2e-bug.137 — reviews/ratings summary (dashboard). */
export function isSummarizeReviewsPrompt(prompt: string): boolean {
  if (/\b(write|leave|post|submit)\b/i.test(prompt) && /\breview\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(reviews?|ratings?)\b/i.test(prompt) &&
    /\b(summarize|summary|show|list|average|overall|how\s+are|what\s+are|customer)\b/i.test(
      prompt,
    )
  );
}

export function isDeleteCommissionRulePrompt(prompt: string): boolean {
  if (isCommissionReportPrompt(prompt)) return false;
  return (
    /\b(delete|remove|revoke)\b/i.test(prompt) &&
    /\bcommission(?:\s+rule)?\b/i.test(prompt)
  );
}

/** e2e-bug.146 — export analytics report (not P&L narration / payout CSV). */
export function isExportAnalyticsReportPrompt(prompt: string): boolean {
  if (isPayoutExportPrompt(prompt) || isExportCommissionsPrompt(prompt)) {
    return false;
  }
  if (isSummarizePlPrompt(prompt) && !/\bexport\b/i.test(prompt)) {
    return false;
  }
  return (
    /\bexport\b/i.test(prompt) &&
    /\b(analytics|report|performance|utilization)\b/i.test(prompt)
  );
}

export function parseCreateCommissionRuleFromPrompt(
  prompt: string,
): Record<string, unknown> | null {
  if (!isCreateCommissionRulePrompt(prompt)) return null;

  const percentMatch =
    prompt.match(
      /\b(?:to|at|of)\s+(\d+(?:\.\d+)?)\s*(?:%|percent|per\s*cent)?\b/i,
    ) ??
    prompt.match(/\b(\d+(?:\.\d+)?)\s*(?:%|percent|per\s*cent)\b/i) ??
    prompt.match(/\b(\d+(?:\.\d+)?)\s*(?:flat|dollars?|usd)?\b/i);
  if (!percentMatch?.[1]) return null;
  const value = Number(percentMatch[1]);
  if (!Number.isFinite(value)) return null;

  const type: 'percent' | 'flat' = /\bflat\b/i.test(prompt)
    ? 'flat'
    : 'percent';

  const forEmployee = prompt.match(
    /\b(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/,
  );
  const employeeName = forEmployee?.[1]?.trim();

  const serviceMatch = prompt.match(
    /\b(?:on|for)\s+(?:the\s+)?([A-Za-z][\w\s'-]{1,40}?)\s+service\b/i,
  );

  return {
    value,
    type,
    ...(employeeName ? { employeeName } : {}),
    ...(serviceMatch?.[1] ? { serviceName: serviceMatch[1].trim() } : {}),
  };
}

export function parseExportAnalyticsReportFromPrompt(
  prompt: string,
): Record<string, unknown> | null {
  if (!isExportAnalyticsReportPrompt(prompt)) return null;
  const params: Record<string, unknown> = {};
  if (/\bpdf\b/i.test(prompt)) params.format = 'pdf';
  if (/\bcsv\b/i.test(prompt)) params.format = 'csv';
  if (/\bthis\s+quarter\b/i.test(prompt)) params.dateRange = 'this_quarter';
  if (/\bthis\s+month\b/i.test(prompt)) params.dateRange = 'this_month';
  if (/\bthis\s+year\b/i.test(prompt)) params.dateRange = 'this_year';
  return params;
}

export function isSuggestRetailUpsellPrompt(prompt: string): boolean {
  if (
    /\b(recommend|suggest)\b/i.test(prompt) &&
    /\b(?:after|for|following)\s+(?:the\s+)?[A-Za-z][\w\s'-]+\s+service\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\b(suggest|recommend)\b/i.test(prompt) &&
    /\b(retail|product|upsell)\b/i.test(prompt)
  );
}

/** ai-cmd-provider-5.4.5 — navigate/search sellable retail products by name or SKU. */
export function isSearchRetailSkuPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  // "Do we have X set up/configured/enabled?" is an integration/settings query
  // (explain_integration_health etc.), not a retail product lookup.
  if (
    /\b(set\s*up|configured|enabled|connected|integration|api\s*key|webhook)\b/i.test(
      lower,
    )
  ) {
    return false;
  }

  if (
    /\bsku\b/i.test(lower) &&
    /\b(find|search|look\s*up|check)\b/i.test(lower)
  ) {
    return true;
  }
  if (/\bcarry\b/i.test(lower) && /\b(we|you)\b/i.test(lower)) return true;
  if (/\b(do\s+we\s+have|do\s+you\s+have)\b/i.test(lower)) return true;
  if (/\bin\s+stock\b/i.test(lower) && /\b(is|do|have)\b/i.test(lower)) {
    return true;
  }
  if (/\bsearch\b/i.test(lower) && /\b(inventory|for)\b/i.test(lower)) {
    return true;
  }

  if (
    /[԰-֏]/.test(prompt) &&
    /(ունե|փնտրիր|կա)/i.test(prompt) &&
    /(sku|ապրանք)/i.test(prompt)
  ) {
    return true;
  }
  if (
    /[Ѐ-ӿ]/.test(prompt) &&
    /(есть|найди|ищем|поищи)/i.test(prompt) &&
    /(sku|наличии|товар)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function extractRetailSearchQuery(prompt: string): string | null {
  const sku = extractSkuFromPrompt(prompt);
  if (sku) return sku;
  const skuNumber = prompt.match(/\bsku\s*[:#]?\s*([A-Za-z0-9-]+)\b/i);
  if (skuNumber) return skuNumber[1].trim();
  const carry = prompt.match(
    /\b(?:carry|do\s+(?:we|you)\s+have|find|search\s+(?:for|inventory\s+for)|look\s*up|check\s+if\s+we\s+carry)\s+(?:the\s+)?([A-Za-z][\w\s'-]{1,40}?)(?:\s+in\s+stock|\?|$)/i,
  );
  if (carry) return carry[1].trim();
  const isInStock = prompt.match(
    /\bis\s+(?:the\s+)?([A-Za-z][\w\s'-]{1,40}?)\s+in\s+stock\b/i,
  );
  if (isInStock) return isInStock[1].trim();
  return null;
}

export function isAddRetailToMyBookingPrompt(prompt: string): boolean {
  return (
    /\badd\b/i.test(prompt) &&
    /\b(my\s+booking|my\s+appointment)\b/i.test(prompt) &&
    (/\b(retail|product)\b/i.test(prompt) || /\badd\s+[A-Za-z]/i.test(prompt))
  );
}

export function isSetRetailSalesLinesPrompt(prompt: string): boolean {
  const replaceCue =
    /\b(set|replace|update)\b/i.test(prompt) &&
    /\b(retail\s+)?(?:sales?\s+)?(cart|lines?)\b/i.test(prompt);
  if (!replaceCue) return false;
  return parseRetailSalesLinesFromPrompt(prompt).length > 0;
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
  // e2e-bug.148 — "Add a retail product called QA Test Product priced at …"
  const called = prompt.match(
    /\b(?:retail\s+)?product\s+(?:called|named)\s+["']?([A-Za-z][\w\s'-]{1,40}?)["']?(?=\s*(?:,|\.|$|\bpriced\b|\bprice\b|\bretail\b|\bsku\b|\bfor\b|\bat\b|\bcost))/i,
  );
  if (called) return called[1].trim();
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

/**
 * e2e-bug.148 — accept natural retail price phrasing, not only "price 5"/"retail 5".
 * Prefer price-adjacent forms before bare "$X" / "X dollars".
 */
export function extractRetailPriceFromPrompt(prompt: string): number | null {
  const patterns = [
    /\bretail(?:\s+price)?\s*(?:is\s+|of\s+|at\s+|:\s*)?\$?\s*(\d+(?:\.\d{1,2})?)\b/i,
    /\bpric(?:e|ed)\s*(?:is\s+|of\s+|at\s+|:\s*)?\$?\s*(\d+(?:\.\d{1,2})?)\b/i,
    /\b(?:costs?|costing)\s*(?:is\s+|at\s+)?\$?\s*(\d+(?:\.\d{1,2})?)\b/i,
    /\$\s*(\d+(?:\.\d{1,2})?)\b/,
    /\b(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd|eur|amd)\b/i,
    /\bfor\s+\$?\s*(\d+(?:\.\d{1,2})?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

/** Populate create_product params from NL (validator checks `price`; handler uses `retailPrice`). */
export function enrichCreateProductParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const productName =
    (typeof next.productName === 'string' && next.productName.trim()) ||
    (typeof next.name === 'string' && next.name.trim()) ||
    extractProductNameFromPrompt(prompt);
  if (productName) {
    next.productName = productName;
    if (next.name == null) next.name = productName;
  }
  const sku =
    (typeof next.sku === 'string' && next.sku.trim()) ||
    extractSkuFromPrompt(prompt);
  if (sku) next.sku = sku;

  const fromParams =
    typeof next.price === 'number'
      ? next.price
      : typeof next.retailPrice === 'number'
        ? next.retailPrice
        : null;
  const price = fromParams ?? extractRetailPriceFromPrompt(prompt);
  if (price != null) {
    next.price = price;
    next.retailPrice = price;
  }
  return next;
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

/** Date/filler tokens the LLM or regex must not treat as expense categories. */
const EXPENSE_CATEGORY_STOPWORDS = new Set([
  'today',
  'tomorrow',
  'yesterday',
  'tonight',
  'business',
  'a',
  'an',
  'the',
  'my',
  'our',
  'this',
  'that',
  'week',
  'month',
  'year',
  'morning',
  'afternoon',
  'evening',
  'now',
  'just',
  'added',
  'new',
  'for',
  'and',
  'with',
  'from',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

const EXPENSE_CATEGORY_HINTS: Array<{ re: RegExp; category: string }> = [
  { re: /\b(supplies?|cleaning|cleaner|janitor)\b/i, category: 'supplies' },
  { re: /\b(rent|lease)\b/i, category: 'rent' },
  { re: /\b(utilit(?:y|ies)|electric|water|gas|internet)\b/i, category: 'utilities' },
  { re: /\b(marketing|ads?|advertising|promo)\b/i, category: 'marketing' },
  { re: /\b(payroll|salary|wages?)\b/i, category: 'payroll' },
  { re: /\b(travel|transport|uber|taxi|flight)\b/i, category: 'travel' },
  { re: /\b(software|saas|subscription)\b/i, category: 'software' },
  { re: /\b(equipment|tools?|hardware)\b/i, category: 'equipment' },
  { re: /\b(office|stationery)\b/i, category: 'office' },
];

/** e2e-bug.140 — reject date/filler categories; infer from description when needed. */
export function normalizeExpenseCategory(
  raw: string | null | undefined,
  promptOrDescription = '',
): string {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  const lower = trimmed.toLowerCase();
  const usable =
    trimmed.length >= 2 &&
    trimmed.length <= 40 &&
    !EXPENSE_CATEGORY_STOPWORDS.has(lower) &&
    !/^\d+$/.test(trimmed);

  if (usable) return trimmed;

  const haystack = `${trimmed} ${promptOrDescription}`.trim();
  for (const hint of EXPENSE_CATEGORY_HINTS) {
    if (hint.re.test(haystack)) return hint.category;
  }
  return 'general';
}

export function extractExpenseCategoryFromPrompt(
  prompt: string,
): string | null {
  const quoted = prompt.match(/\bcategory\s+"([^"]+)"/i)?.[1]?.trim();
  if (quoted && !EXPENSE_CATEGORY_STOPWORDS.has(quoted.toLowerCase())) {
    return quoted;
  }
  const named = prompt.match(
    /\bcategory\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+\$|\s+amount|\s+for|\s*$|[.?!])/i,
  )?.[1]?.trim();
  if (named && !EXPENSE_CATEGORY_STOPWORDS.has(named.toLowerCase())) {
    return named;
  }
  // "record expense supplies $45" — not "expense today for …"
  const expense = prompt.match(
    /\bexpense\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+\$|\s+amount|\s*$)/i,
  )?.[1]?.trim();
  if (!expense) return null;
  if (EXPENSE_CATEGORY_STOPWORDS.has(expense.toLowerCase())) return null;
  return expense;
}

export function enrichRecordExpenseParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (next.amount == null) {
    const amount = extractExpenseAmountFromPrompt(prompt);
    if (amount !== null) next.amount = amount;
  }
  if (!next.description) {
    const description = extractExpenseDescriptionFromPrompt(prompt);
    if (description) next.description = description;
  }
  const description =
    typeof next.description === 'string' ? next.description : '';
  const rawCategory =
    typeof next.category === 'string' ? next.category : undefined;
  const extracted = extractExpenseCategoryFromPrompt(prompt);
  next.category = normalizeExpenseCategory(
    rawCategory ?? extracted,
    `${prompt} ${description}`,
  );
  return next;
}

export function extractExpenseAmountFromPrompt(prompt: string): number | null {
  const amount = prompt.match(/\$?\s*(\d+(?:\.\d{1,2})?)\b/);
  return amount ? Number(amount[1]) : null;
}

export function extractExpenseDescriptionFromPrompt(
  prompt: string,
): string | null {
  const quoted = prompt.match(/\bdescription\s+"([^"]+)"/i);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  // e2e-bug.141 — "Delete the $20 QA test cleaning supplies expense I just added"
  const beforeExpense = prompt.match(
    /\b(?:delete|remove)\s+(?:the\s+)?(?:\$?\d+(?:\.\d{1,2})?\s+)?(.+?)\s+expense\b/i,
  );
  if (beforeExpense?.[1]) {
    const cleaned = beforeExpense[1]
      .replace(/\b(?:just\s+added|i\s+just\s+added)\b/gi, '')
      .replace(/\b(?:business|today|yesterday)\b/gi, '')
      .trim();
    if (cleaned.length >= 3 && !/^(the|a|an|this|that|my)$/i.test(cleaned)) {
      return cleaned;
    }
  }

  // "expense for QA test cleaning supplies" / "expense called …"
  const forDesc = prompt.match(
    /\bexpense\s+(?:for|called|named)\s+["']?([^"'.,]+?)["']?(?:\s+I\s+just|\s*$|[.?!])/i,
  );
  if (forDesc?.[1]?.trim() && forDesc[1].trim().length >= 3) {
    return forDesc[1].trim();
  }

  // record: "… for QA test cleaning supplies"
  const recordFor = prompt.match(
    /\b(?:expense|spent)\b[^.]{0,40}?\bfor\s+([A-Za-z][\w\s'-]{2,60}?)(?:\s*$|[.?!])/i,
  );
  if (recordFor?.[1]?.trim()) return recordFor[1].trim();

  return null;
}

export function extractExpenseIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b(?:expense\s+)?(?:with\s+)?id\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];
  const bare = prompt.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  return bare?.[1] ?? null;
}

export function enrichDeleteExpenseParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  if (!next.expenseId) {
    const expenseId = extractExpenseIdFromPrompt(prompt);
    if (expenseId) next.expenseId = expenseId;
  }
  if (!next.description) {
    const description = extractExpenseDescriptionFromPrompt(prompt);
    if (description) next.description = description;
  }
  if (!next.category) {
    // Only explicit "category …" — avoid "expense I just added" false category.
    const quotedCategory = prompt.match(/\bcategory\s+"([^"]+)"/i)?.[1]?.trim();
    const namedCategory = prompt.match(
      /\bcategory\s+([A-Za-z][\w\s'-]{1,30}?)(?:\s+expense|\s*$|[.?!])/i,
    )?.[1]?.trim();
    const category = quotedCategory || namedCategory;
    if (category && !/^(the|a|an|this|that|my|i)$/i.test(category)) {
      next.category = category;
    }
  }
  return next;
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
  if (isExportAnalyticsReportPrompt(prompt)) {
    return {
      action: 'export_analytics_report',
      rescueReason: 'export_analytics_report',
    };
  }
  if (isCreateCommissionRulePrompt(prompt)) {
    return {
      action: 'create_commission_rule',
      rescueReason: 'create_commission_rule',
    };
  }
  if (isDeleteCommissionRulePrompt(prompt)) {
    return {
      action: 'delete_commission_rule',
      rescueReason: 'delete_commission_rule',
    };
  }

  if (isSuggestRetailUpsellPrompt(prompt)) {
    return {
      action: 'suggest_retail_upsell',
      rescueReason: 'suggest_retail_upsell',
    };
  }
  if (isSearchRetailSkuPrompt(prompt)) {
    return {
      action: 'search_retail_sku',
      rescueReason: 'search_retail_sku',
    };
  }
  if (isAddRetailToMyBookingPrompt(prompt)) {
    return {
      action: 'add_retail_to_my_booking',
      rescueReason: 'add_retail_to_my_booking',
    };
  }
  if (isSetRetailSalesLinesPrompt(prompt)) {
    return {
      action: 'set_retail_sales_lines',
      rescueReason: 'set_retail_sales_lines',
    };
  }

  if (isCommissionReportPrompt(prompt)) {
    return { action: 'commission_report', rescueReason: 'commission_report' };
  }
  if (isSummarizeReviewsPrompt(prompt)) {
    return { action: 'summarize_reviews', rescueReason: 'summarize_reviews' };
  }
  if (isSummarizePlPrompt(prompt)) {
    return { action: 'summarize_pl', rescueReason: 'summarize_pl' };
  }
  if (isListExpensesPrompt(prompt)) {
    return { action: 'list_expenses', rescueReason: 'list_expenses' };
  }
  if (isDeleteExpensePrompt(prompt)) {
    return { action: 'delete_expense', rescueReason: 'delete_expense' };
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
  if (retailPrice !== null) {
    base.retailPrice = retailPrice;
    // e2e-bug.148 — entity validator requires `price`; handler reads `retailPrice`.
    base.price = retailPrice;
  }
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
  if (isSetRetailSalesLinesPrompt(text)) {
    return {
      action: 'set_retail_sales_lines',
      params: { ...base, lines: parseRetailSalesLinesFromPrompt(text) },
      segment: text,
    };
  }
  if (isMarkPaidPrompt(text)) {
    return { action: 'mark_paid', params: base, segment: text };
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

export interface ParsedRetailSalesLine {
  productName: string;
  quantity: number;
}

/** Parses multiple "N product" lines from a bulk retail cart replace command,
 *  e.g. "set retail cart to 2 shampoo, 1 conditioner and 3 candles". */
export function parseRetailSalesLinesFromPrompt(
  prompt: string,
): ParsedRetailSalesLine[] {
  const clause =
    prompt.match(
      /\b(?:set|replace|update)\s+(?:the\s+)?(?:retail\s+)?(?:sales?\s+)?(?:cart|lines?)\s+(?:to|with)\s+(.+)$/i,
    )?.[1] ?? prompt.match(/\bcart\s+(?:to|with)\s+(.+)$/i)?.[1];
  if (!clause) return [];

  const segments = clause
    .split(/\s*,\s*|\s+and\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const lines: ParsedRetailSalesLine[] = [];
  for (const segment of segments) {
    const withQty = segment.match(/^(\d+)\s*(?:x\s*)?([A-Za-z][\w\s'-]*)$/i);
    if (withQty) {
      lines.push({
        quantity: parseInt(withQty[1], 10),
        productName: withQty[2].trim(),
      });
      continue;
    }
    const nameOnly = segment.match(/^([A-Za-z][\w\s'-]*)$/i);
    if (nameOnly) {
      lines.push({ quantity: 1, productName: nameOnly[1].trim() });
    }
  }
  return lines;
}
