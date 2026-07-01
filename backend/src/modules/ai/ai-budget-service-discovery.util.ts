import {
  isConfigureGiftCardProductsPrompt,
  isConfigureMultiServiceSettingsPrompt,
  isCreateGiftCardBundlePrompt,
} from './ai-catalog.util.js';
import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';
import {
  extractAmountFromPrompt,
  isBuyGiftCardPhysicalPrompt,
  isBuyGiftCardPrompt,
} from './ai-payments.util.js';
import {
  filterServicesByMaxPrice,
  filterServicesByMinDuration,
  filterServicesByMinPrice,
  isValidMaxPrice,
  sortServicesByDurationAsc,
  sortServicesByPriceAsc,
  type ServiceCatalogPriceEntry,
} from './ai-service-catalog-rank.util.js';
import type {
  BudgetDiscoverySurface,
  BudgetServiceDiscoveryPromptFixture,
} from './ai-budget-service-discovery.fixtures.js';
import { isProviderOrAnyoneBudgetLeadPrompt } from './ai-flexible-availability.util.js';
import { isConfigureServiceOnlinePaymentPrompt } from './ai-service-online-payment.util.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';

const WORD_NUMBER_MAP: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  ten: 10,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

const BUDGET_CEILING_PATTERN =
  /\b(?:under|below|at most|no more than|less than|max(?:imum)?|up to|within|nothing over)\s+(?:[\$€£]|usd|eur|amd|dram|rub(?:le|les)?)?\s*([\d,]+(?:\.\d{1,2})?)\b/i;

const BUDGET_HAVE_PATTERN =
  /\b(?:i\s+)?(?:only\s+)?have\s+(?:[\$€£])?\s*([\d,]+(?:\.\d{1,2})?)\b/i;

const BUDGET_BETWEEN_PATTERN =
  /\bbetween\s+[\$€£]?\s*([\d,]+(?:\.\d{1,2})?)\s+and\s+[\$€£]?\s*([\d,]+(?:\.\d{1,2})?)\b/i;

const BUDGET_VOICE_ASR_SERVICE_ALIASES: readonly {
  pattern: RegExp;
  category: string;
}[] = [
  { pattern: /\bher\s+cut\b/i, category: 'haircut' },
  { pattern: /\bfor\s+a\s+trim\b/i, category: 'haircut' },
];

const BUDGET_BUCKS_PATTERN = /\b([\d,]+(?:\.\d{1,2})?)\s+bucks?\b/i;

const BUDGET_WORD_AMOUNT_PATTERN =
  /\b(?:have|under|below|max|about)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:dollars?|bucks?)\b/i;

const BUDGET_WORD_BUCKS_PATTERN = /\b([a-z]+)\s+bucks?\b/i;

const PLAIN_DOLLARS_PATTERN = /\b(\d+(?:\.\d{1,2})?)\s+dollars?\b/i;

const ABOUT_DOLLARS_PATTERN = /\babout\s+(\d+(?:\.\d{1,2})?)\s+dollars?\b/i;

const BUDGET_WORD_CEILING_PATTERN = /\b(?:under|below|max)\s+([a-z]+)\b/i;

const DOLLAR_WITH_COMMAS_PATTERN = /\$\s*([\d,]+(?:\.\d{1,2})?)/;

const EURO_AMOUNT_PATTERN = /€\s*([\d,]+(?:\.\d{1,2})?)/;

const GENERIC_INTEGER_PATTERN = /\b([\d,]{2,})\b/;

export function budgetScenarioAppliesToSurface(
  scenario: Pick<BudgetServiceDiscoveryPromptFixture, 'surface'>,
  surface: Exclude<BudgetDiscoverySurface, 'both'>,
): boolean {
  return scenario.surface === 'both' || scenario.surface === surface;
}

export function resolveBudgetCompoundSteps(
  scenario: Pick<
    BudgetServiceDiscoveryPromptFixture,
    'publicCompoundSteps' | 'customerCompoundSteps'
  >,
  surface: Exclude<BudgetDiscoverySurface, 'both'>,
): readonly string[] | undefined {
  return surface === 'public'
    ? scenario.publicCompoundSteps
    : scenario.customerCompoundSteps;
}

export function isBudgetAdministrativeOrExplainContext(
  prompt: string,
): boolean {
  if (
    isConfigureGiftCardProductsPrompt(prompt) ||
    isCreateGiftCardBundlePrompt(prompt) ||
    isConfigureMultiServiceSettingsPrompt(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:what can i book|what(?:'s| is) available|services under|options under|book under|anything under|affordable|cheapest|under \$|below \$|within \$|max \$|have only \$|i have \$|my budget)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(?:tax|vat|gst|stacked tax|stripe tax|stripe charge|tax breakdown|tax settings|tax rate|tax-inclusive|tax-exclusive|tax number|configure business tax|set service tax|quote staff booking tax|lookup booking tax|explain appointment tax|summarize customer tax|checkout tax|consumer checkout tax|net\/tax\/gross)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:locale|locales|translation|translations|disabled language|language settings|default locale|localized names|enabled locales|bulk strip|bulk remove|strip disabled|remove localized|clean up legacy)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:preview a sample|sample gift card|preview notification|notification datetime|date format do gift card emails|confirmation email show|reminder text show|whatsapp message would display|why does the gift card purchase email|why did my confirmation email show|currency symbol|notification currency|package total in|gift card total show|currency are the gift card preset|priced in|what currency|display name|display names|titled|what name|which name|which localized|package is titled|what title|show here|armenian name|russian name|english name|localized title|named on this page)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:tour|max group|group size|difficulty|mark .+ as a tour)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:explain|why does|why did|why is|why are|how does|what is our|preview|sample|quote|lookup|diagnose|configure|count services|summarize recommendation|checkout recommendations|recommendation analytics|recommendation performance|create|bulk create)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  return false;
}

export function isBudgetGiftCardMisroute(prompt: string): boolean {
  if (!/\bgift\s+card\b/i.test(prompt)) return false;
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isConfigureGiftCardProductsPrompt(prompt)) return false;
  if (isBuyGiftCardPhysicalPrompt(prompt) || isBuyGiftCardPrompt(prompt)) {
    return false;
  }
  if (
    /\b(?:balance|check balance|gift card balance|track my|track the|track physical)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(?:apply|redeem|use my|use the|code|GCM-|GCB-|GCS-|checkout|pay with|book with)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\b(?:buy|purchase)\b/i.test(prompt)) return true;
  if (
    /\border\b/i.test(prompt) &&
    /\b(?:buy|purchase|order)\s+(?:a\s+)?(?:physical\s+)?gift\s+card\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\$\s*\d[\d,.]*\s+gift\s+card\b/i.test(prompt) ||
    /\b\d+\s+dollars?\s+gift\s+card\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\b(?:have|got)\b/i.test(prompt) &&
    (/\$\s*\d/.test(prompt) || /\b\d+\s+dollars?\b/i.test(prompt))
  );
}

export function isBudgetPackageDiscoveryPrompt(prompt: string): boolean {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (
    /\b(?:translation|translations|locale|locales|language|languages|disabled|categories|strip|bulk|count|localized name|display name|localized names)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(?:add|set|update|clear|remove|delete|configure|create)\b/i.test(
      prompt,
    ) &&
    /\b(?:name|translation|display|localized)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:why|what currency|explain|how much|priced in|show in|total in|currency are)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (!/\b(?:spa\s+)?packages?\b|\bbundles?\b|\bdeals?\b/i.test(prompt)) {
    return false;
  }
  if (/\b(?:visit|visits|booking|appointments?)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(?:what packages|what bundles|what deals|show packages|browse packages|available packages|packages under|deals under|any packages|packages do you|packages are available)\b/i.test(
      prompt,
    ) ||
    /\b(?:what|which|show)\b[^.?!]{0,30}\b(?:packages?|bundles?|deals?)\b/i.test(
      prompt,
    ) ||
    /\b(?:under|below|cheapest|affordable)\b/i.test(prompt)
  );
}

export function isBudgetDepositQuestion(prompt: string): boolean {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return false;
  if (isConfigureServiceDepositPolicyPrompt(prompt)) return false;
  return /\bdeposit\b/i.test(prompt);
}

export function isBudgetSubscriptionBalancePrompt(prompt: string): boolean {
  return /\b(?:subscription|plan)\b/i.test(prompt) && /\bcover\b/i.test(prompt);
}

/** Inclusive price floor + ceiling from "between $40 and $60" (budget-range-en). */
export function isBudgetPriceRangePrompt(prompt: string): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  return BUDGET_BETWEEN_PATTERN.test(prompt);
}

export function extractMinPriceFromBudgetPrompt(prompt: string): number | null {
  if (!isBudgetPriceRangePrompt(prompt)) return null;
  const between = prompt.match(BUDGET_BETWEEN_PATTERN);
  if (!between) return null;
  return parseNumericToken(between[1]);
}

/** "Any stylist for a cut under $45?" — team-wide provider scope + budget list (budget-any-provider-en). */
export function isBudgetAnyProviderListPrompt(prompt: string): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  if (/\b(?:best|rated|top|highest|recommended)\b/i.test(prompt)) return false;
  return (
    /\bany\s+(?:provider|staff|employee|therapist|stylist|specialist|specialists)\b/i.test(
      prompt,
    ) || /\bwhichever\s+(?:provider|specialist)\b/i.test(prompt)
  );
}

/** "Is Swedish massage under $90?" — explicit catalog service name + budget (budget-named-service-en). */
export function extractBudgetNamedServiceFromPrompt(
  prompt: string,
): string | null {
  if (!shouldExtractBudgetMaxPrice(prompt)) return null;

  const questionNamed = prompt.match(
    /\b(?:is|are|do you have|does)\s+(?:the\s+)?([a-z][\w\s'-]{2,50}?)\s+(?:under|below|less than|at most|within)\b/i,
  );
  if (questionNamed) {
    const name = questionNamed[1].trim().replace(/[?.!]+$/, '');
    if (name && !/^(there|it|this|that|anything|something)$/i.test(name)) {
      return name;
    }
  }

  return null;
}

export function enrichBudgetProviderScopeFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim() || params.allProviders === true) return params;
  if (!isBudgetAnyProviderListPrompt(prompt)) return params;

  const next: Record<string, unknown> = { ...params, allProviders: true };
  delete next.employeeName;
  delete next.employeeNames;
  delete next.employeeIds;
  return next;
}

export function enrichBudgetNamedServiceFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim() || params.serviceName) return params;

  const serviceName = extractBudgetNamedServiceFromPrompt(prompt);
  if (!serviceName) return params;

  const next: Record<string, unknown> = { ...params, serviceName };
  delete next.serviceCategory;
  return next;
}

/** "Karo — anything under $30?" / "Does Karo have anything under $40?" (budget-provider-no-match-en). */
export function extractBudgetEmployeeNameFromPrompt(
  prompt: string,
): string | null {
  if (!shouldExtractBudgetMaxPrice(prompt)) return null;
  if (isBudgetAnyProviderListPrompt(prompt)) return null;

  const dashLead = prompt.match(
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[—–-]\s*(?:anything|something|what)\b/i,
  );
  if (dashLead) return dashLead[1].trim();

  const doesHave = prompt.match(
    /\b(?:does|do)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+have(?:\s+anything)?\s+under\b/i,
  );
  if (doesHave) return doesHave[1].trim();

  return null;
}

export function enrichBudgetEmployeeFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim() || params.employeeName) return params;
  if (isProviderOrAnyoneBudgetLeadPrompt(prompt)) return params;

  const employeeName = extractBudgetEmployeeNameFromPrompt(prompt);
  if (!employeeName) return params;

  const next: Record<string, unknown> = { ...params, employeeName };
  delete next.allProviders;
  delete next.employeeNames;
  delete next.employeeIds;
  return next;
}

/** "Quick haircut under $40" — prefer shortest duration within budget (budget-short-service-en). */
export function isBudgetShortServicePrompt(prompt: string): boolean {
  if (!shouldExtractBudgetMaxPrice(prompt)) return false;
  return /\b(?:quick|short|express|fast|brief)\b/i.test(prompt);
}

export function extractBudgetQuickServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  if (!isBudgetShortServicePrompt(prompt)) return null;

  const match = prompt.match(
    /\b(?:quick|short|express|fast|brief)\s+([a-z][\w\s-]{2,30}?)\s+(?:under|below|for|at)\b/i,
  );
  if (!match) return null;

  const category = match[1].trim().replace(/[?.!]+$/, '');
  return category.length >= 3 ? category : null;
}

/** "90-minute massage under $100" — minimum session length + budget (budget-long-massage-en). */
export function extractBudgetMinDurationMinutesFromPrompt(
  prompt: string,
): number | null {
  if (!shouldExtractBudgetMaxPrice(prompt)) return null;

  const match = prompt.match(/\b(\d{2,3})\s*[-\s]?minute(?:s)?\b/i);
  if (!match) return null;

  const minutes = Number.parseInt(match[1], 10);
  return Number.isFinite(minutes) && minutes >= 15 ? minutes : null;
}

export function isBudgetLongServicePrompt(prompt: string): boolean {
  return extractBudgetMinDurationMinutesFromPrompt(prompt) != null;
}

export function extractBudgetLongServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  if (!isBudgetLongServicePrompt(prompt)) return null;

  const match = prompt.match(
    /\b\d{2,3}\s*[-\s]?minute(?:s)?\s+([a-z][\w\s-]{2,30}?)\s+(?:under|below|for|at)\b/i,
  );
  if (!match) return null;

  const category = match[1].trim().replace(/[?.!]+$/, '');
  return category.length >= 3 ? category : null;
}

export function enrichBudgetDurationPreferenceFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;

  const minDurationMinutes = extractBudgetMinDurationMinutesFromPrompt(prompt);
  if (minDurationMinutes != null) {
    const next: Record<string, unknown> = {
      ...params,
      minDurationMinutes,
    };
    delete next.preferShortDuration;
    if (!params.serviceCategory) {
      const serviceCategory =
        extractBudgetLongServiceCategoryFromPrompt(prompt);
      if (serviceCategory) {
        next.serviceCategory = serviceCategory;
        delete next.serviceName;
      }
    }
    return next;
  }

  if (params.preferShortDuration === true) return params;
  if (!isBudgetShortServicePrompt(prompt)) return params;

  const next: Record<string, unknown> = {
    ...params,
    preferShortDuration: true,
  };
  if (!params.serviceCategory) {
    const serviceCategory = extractBudgetQuickServiceCategoryFromPrompt(prompt);
    if (serviceCategory) {
      next.serviceCategory = serviceCategory;
      delete next.serviceName;
    }
  }
  return next;
}

export function resolveBudgetPreferShortDuration(
  preferShortDuration: unknown,
): boolean {
  return preferShortDuration === true;
}

export function resolveBudgetMinDurationMinutes(
  minDurationMinutes: unknown,
): number | null {
  return typeof minDurationMinutes === 'number' &&
    Number.isFinite(minDurationMinutes) &&
    minDurationMinutes >= 15
    ? minDurationMinutes
    : null;
}

function finalizeBudgetListServiceParams(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  return enrichBudgetDurationPreferenceFromPrompt(
    enrichBudgetNamedServiceFromPrompt(
      enrichBudgetProviderScopeFromPrompt(
        enrichBudgetEmployeeFromPrompt(
          enrichBudgetVoiceServiceFromPrompt(params, prompt),
          prompt,
        ),
        prompt,
      ),
      prompt,
    ),
    prompt,
  );
}

/** ASR / voice homophones → serviceCategory during budget enrichment (budget-voice-asr-en). */
export function enrichBudgetVoiceServiceFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim() || params.serviceCategory) return params;

  for (const alias of BUDGET_VOICE_ASR_SERVICE_ALIASES) {
    if (alias.pattern.test(prompt)) {
      return { ...params, serviceCategory: alias.category };
    }
  }

  return params;
}

/** Budget list + promo code for checkout — not promo_code_help (budget-with-promo-en). */
export function isBudgetWithPromoPrompt(prompt: string): boolean {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isBudgetDepositQuestion(prompt)) return false;
  if (isBudgetSubscriptionBalancePrompt(prompt)) return false;
  if (isBudgetCartTotalPrompt(prompt)) return false;
  if (!/\b(?:with\s+)?(?:promo\s+)?code\s+[A-Z0-9_-]{3,}\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(?:how|help|explain|validate|apply)\b[^.?!]{0,24}\b(?:promo|code)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\bapply\s+promo\b/i.test(prompt)) return false;
  return (
    extractMaxPriceFromBudgetPrompt(prompt) != null ||
    /\b(?:under|below|at most|up to|less than)\b/i.test(prompt)
  );
}

/** Promo code carried to checkout after budget list_services (budget-1.14). */
export function extractBudgetPromoCodeFromPrompt(
  prompt: string,
): string | null {
  if (!isBudgetWithPromoPrompt(prompt)) return null;

  const patterns = [
    /\bwith\s+(?:promo\s+)?code\s+([A-Z0-9_-]{3,})\b/i,
    /\b(?:promo|discount|coupon)\s+code\s+([A-Z0-9_-]{3,})\b/i,
    /\bcode\s+([A-Z0-9_-]{3,})\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const code = match?.[1]?.trim();
    if (code) return code;
  }

  return null;
}

/** Multi-service cart combined ceiling — not per-service maxPrice (budget-cart-total-en). */
export function isBudgetCartTotalPrompt(prompt: string): boolean {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (!/\btotal\b/i.test(prompt)) return false;
  return (
    /\b(?:two|2|three|3|four|4|\d+)\s+services?\b/i.test(prompt) ||
    /\bservices?\s+under\b/i.test(prompt)
  );
}

/** Combined cart ceiling for multi-service discovery (budget-1.13). */
export function extractMaxTotalPriceFromBudgetPrompt(
  prompt: string,
): number | null {
  if (!isBudgetCartTotalPrompt(prompt)) return null;

  const patterns = [
    /\b(?:under|below|at most|up to|within|less than)\s+(?:[\$€£]|usd|eur|amd|dram|rub(?:le|les)?)?\s*([\d,]+(?:\.\d{1,2})?)\s+total\b/i,
    /\b(?:[\$€£])\s*([\d,]+(?:\.\d{1,2})?)\s+total\b/i,
    /\b([\d,]+(?:\.\d{1,2})?)\s+(?:dollars?|bucks?)\s+total\b/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const value = match?.[1] ? parseNumericToken(match[1]) : null;
    if (value != null) return value;
  }

  return null;
}

/** How many services must fit under maxTotalPrice (defaults to 2). */
export function extractBudgetCartServiceCountFromPrompt(
  prompt: string,
): number | null {
  if (!isBudgetCartTotalPrompt(prompt)) return null;

  const digit = prompt.match(/\b(\d+)\s+services?\b/i);
  if (digit) {
    const value = Number.parseInt(digit[1], 10);
    return Number.isFinite(value) && value >= 2 ? value : null;
  }

  const word = prompt.match(/\b(two|three|four|five)\s+services?\b/i);
  if (word) {
    const mapped = WORD_NUMBER_MAP[word[1].toLowerCase()];
    return mapped != null && mapped >= 2 ? mapped : null;
  }

  return 2;
}

/** True when maxPrice budget filtering should apply to this prompt. */
export function shouldExtractBudgetMaxPrice(prompt: string): boolean {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isConfigureServiceDepositPolicyPrompt(prompt)) return false;
  if (isBudgetDepositQuestion(prompt)) return false;
  if (isBudgetSubscriptionBalancePrompt(prompt)) return false;
  if (isBudgetCartTotalPrompt(prompt)) return false;
  return true;
}

function parseNumericToken(raw: string): number | null {
  const normalized = raw.replace(/,/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseWordAmount(raw: string): number | null {
  const tokens = raw.trim().toLowerCase().split(/\s+/);
  if (tokens.length === 1 && tokens[0] in WORD_NUMBER_MAP) {
    return WORD_NUMBER_MAP[tokens[0]];
  }
  if (
    tokens.length === 2 &&
    tokens[1] === 'dollars' &&
    tokens[0] in WORD_NUMBER_MAP
  ) {
    return WORD_NUMBER_MAP[tokens[0]];
  }
  return null;
}

/** Deterministic maxPrice extraction for budget discovery rescue (budget-1.3). */
export function extractMaxPriceFromBudgetPrompt(prompt: string): number | null {
  if (!shouldExtractBudgetMaxPrice(prompt)) return null;

  if (
    /\bfree\s+(?:consultation|options?|services?)\b/i.test(prompt) ||
    (/\bfree\b/i.test(prompt) &&
      !/\b(?:who(?:'s| is|ever)|anyone|anybody|providers?|specialists?|stylist|therapist|which)\b[^.?!]{0,40}\bfree\b/i.test(
        prompt,
      ) &&
      !/\b(?:nearest|earliest|next|soonest)\s+free\b/i.test(prompt) &&
      !/\bfree\s+(?:time|slot|appointment|opening)\b/i.test(prompt))
  ) {
    return 0;
  }

  if (/\bmax\s+\d+\s+(?:people|guests|participants|pax)\b/i.test(prompt)) {
    return null;
  }

  const between = prompt.match(BUDGET_BETWEEN_PATTERN);
  if (between) {
    const upper = parseNumericToken(between[2]);
    if (upper != null) return upper;
  }

  const localizedAmount = prompt.match(
    /(\d[\d,]*)\s*(?:dram|դրամ|рубл(?:ей|я|ь)?|rubles?)/i,
  );
  if (localizedAmount) {
    const value = parseNumericToken(localizedAmount[1]);
    if (value != null) return value;
  }

  const ruHaveDollars = prompt.match(
    /(?:у\s+меня|u\s+menya)\s+(\d[\d,]*)\s*(?:долларов|dollarov)/iu,
  );
  if (ruHaveDollars) {
    const value = parseNumericToken(ruHaveDollars[1]);
    if (value != null) return value;
  }

  const ruCeilingDollars = prompt.match(
    /(?:до|do)\s+(\d[\d,]*)\s*(?:долларов|dollarov)/iu,
  );
  if (ruCeilingDollars) {
    const value = parseNumericToken(ruCeilingDollars[1]);
    if (value != null) return value;
  }

  const foreignDollars = prompt.match(/(\d[\d,]*)\s*долларов/iu);
  if (foreignDollars) {
    const value = parseNumericToken(foreignDollars[1]);
    if (value != null) return value;
  }

  const ceiling = prompt.match(BUDGET_CEILING_PATTERN);
  if (ceiling) {
    const value = parseNumericToken(ceiling[1]);
    if (value != null) return value;
  }

  const dollarWithCommas = prompt.match(DOLLAR_WITH_COMMAS_PATTERN);
  if (dollarWithCommas) {
    const value = parseNumericToken(dollarWithCommas[1]);
    if (value != null) return value;
  }

  const fromDollar = extractAmountFromPrompt(prompt);
  if (fromDollar != null) return fromDollar;

  const euro = prompt.match(EURO_AMOUNT_PATTERN);
  if (euro) {
    const value = parseNumericToken(euro[1]);
    if (value != null) return value;
  }

  const bucks = prompt.match(BUDGET_BUCKS_PATTERN);
  if (bucks) {
    const value = parseNumericToken(bucks[1]);
    if (value != null) return value;
  }

  const wordAmount = prompt.match(BUDGET_WORD_AMOUNT_PATTERN);
  if (wordAmount) {
    const value = parseWordAmount(wordAmount[1]);
    if (value != null) return value;
  }

  const wordBucks = prompt.match(BUDGET_WORD_BUCKS_PATTERN);
  if (wordBucks) {
    const value = parseWordAmount(wordBucks[1]);
    if (value != null) return value;
  }

  const wordCeiling = prompt.match(BUDGET_WORD_CEILING_PATTERN);
  if (wordCeiling) {
    const value = parseWordAmount(wordCeiling[1]);
    if (value != null) return value;
  }

  const aboutDollars = prompt.match(ABOUT_DOLLARS_PATTERN);
  if (aboutDollars) {
    const value = parseNumericToken(aboutDollars[1]);
    if (value != null) return value;
  }

  const plainDollars = prompt.match(PLAIN_DOLLARS_PATTERN);
  if (plainDollars) {
    const value = parseNumericToken(plainDollars[1]);
    if (value != null) return value;
  }

  const have = prompt.match(BUDGET_HAVE_PATTERN);
  if (have) {
    const value = parseNumericToken(have[1]);
    if (value != null) return value;
  }

  const onlyHave = prompt.match(/\bonly\s+have\s+(\d+(?:\.\d{1,2})?)\b/i);
  if (onlyHave) {
    const value = parseNumericToken(onlyHave[1]);
    if (value != null) return value;
  }

  const generic = prompt.match(GENERIC_INTEGER_PATTERN);
  if (generic && /\b(?:dram|rub|ruble|рубл|руб|դրամ)\b/i.test(prompt)) {
    const value = parseNumericToken(generic[1]);
    if (value != null) return value;
  }

  return null;
}

export function resolveBudgetMisrouteAction(prompt: string): string | null {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return null;
  if (isBudgetAdministrativeOrExplainContext(prompt)) return null;
  if (isBudgetGiftCardMisroute(prompt)) return 'apply_gift_card_code';
  if (isBudgetPackageDiscoveryPrompt(prompt)) return 'discover_packages';
  if (isBudgetDepositQuestion(prompt)) return 'explain_checkout_currency';
  if (isBudgetSubscriptionBalancePrompt(prompt))
    return 'discover_subscription_plans';
  return null;
}

const PUBLIC_BUDGET_MISROUTE_ACTION: Record<string, string> = {
  discover_packages: 'booking_help',
  apply_gift_card_code: 'booking_help',
  discover_subscription_plans: 'booking_help',
};

/** Surface-specific misroute — public web has no discover_packages / gift-card intents (budget-1.8). */
export function resolveBudgetMisrouteActionForSurface(
  prompt: string,
  surface: Exclude<BudgetDiscoverySurface, 'both'> | 'dashboard',
): string | null {
  const misroute = resolveBudgetMisrouteAction(prompt);
  if (!misroute) return null;
  if (surface === 'customer') return misroute;
  if (surface === 'dashboard') {
    if (misroute === 'discover_packages') return 'list_packages';
    if (misroute === 'apply_gift_card_code') return 'validate_gift_card';
    if (misroute === 'discover_subscription_plans') {
      return 'list_subscription_plans';
    }
    return misroute;
  }
  return PUBLIC_BUDGET_MISROUTE_ACTION[misroute] ?? misroute;
}

/** Post-LLM enrichment — set maxPrice when classifier missed it (budget-1.3). */
export function enrichBudgetFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;

  if (
    isExplainCheckoutCurrencyPrompt(prompt) &&
    isBudgetAdministrativeOrExplainContext(prompt)
  ) {
    const next = { ...params };
    delete next.maxPrice;
    delete next.maxTotalPrice;
    delete next.serviceCount;
    delete next.minPrice;
    delete next.serviceCategory;
    delete next.serviceName;
    delete next.serviceRank;
    return next;
  }

  const misroute = resolveBudgetMisrouteAction(prompt);
  if (misroute) {
    const next = { ...params };
    delete next.maxPrice;
    delete next.maxTotalPrice;
    delete next.serviceCount;
    return next;
  }

  const maxTotalPrice = extractMaxTotalPriceFromBudgetPrompt(prompt);
  if (maxTotalPrice != null) {
    const next: Record<string, unknown> = { ...params, maxTotalPrice };
    delete next.maxPrice;
    const serviceCount = extractBudgetCartServiceCountFromPrompt(prompt);
    if (serviceCount != null) {
      next.serviceCount = serviceCount;
    }
    return next;
  }

  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  if (maxPrice != null) {
    const next: Record<string, unknown> = { ...params, maxPrice };
    delete next.maxTotalPrice;
    delete next.serviceCount;
    const minPrice = extractMinPriceFromBudgetPrompt(prompt);
    if (minPrice != null) {
      next.minPrice = minPrice;
    }
    const promoCode = extractBudgetPromoCodeFromPrompt(prompt);
    if (promoCode) next.promoCode = promoCode;
    return finalizeBudgetListServiceParams(next, prompt);
  }

  return finalizeBudgetListServiceParams(params, prompt);
}

export type BudgetCatalogService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
  serviceCategory?: string | null;
  durationMinutes?: number | null;
};

export function filterCatalogByCategory<T extends BudgetCatalogService>(
  services: readonly T[],
  serviceCategory: string | undefined,
): T[] {
  if (!serviceCategory?.trim()) return [...services];
  const needle = serviceCategory.trim().toLowerCase();
  return services.filter(
    (service) =>
      (service.serviceCategory ?? '').toLowerCase().includes(needle) ||
      service.name.toLowerCase().includes(needle),
  );
}

/** Category filter first, then inclusive min/max price band, sorted ascending. */
export function applyBudgetDiscoveryToCatalog<T extends BudgetCatalogService>(
  services: readonly T[],
  options: { maxPrice?: number; minPrice?: number; serviceCategory?: string },
): T[] {
  const categorized = filterCatalogByCategory(
    services,
    options.serviceCategory,
  );
  return applyBudgetFilterToMatchedServices(
    categorized,
    options.maxPrice,
    options.minPrice,
  );
}

export function resolveBudgetMaxPrice(maxPrice: unknown): number | null {
  return isValidMaxPrice(maxPrice) ? maxPrice : null;
}

export function resolveBudgetMinPrice(minPrice: unknown): number | null {
  return isValidMaxPrice(minPrice) ? minPrice : null;
}

/** Apply inclusive min/max price after category/name filters; ascending sort when budget is active. */
export function applyBudgetFilterToMatchedServices<
  T extends BudgetCatalogService,
>(
  services: readonly T[],
  maxPrice: unknown,
  minPrice?: unknown,
  preferShortDuration?: unknown,
  minDurationMinutes?: unknown,
): T[] {
  const budgetMax = resolveBudgetMaxPrice(maxPrice);
  const budgetMin = resolveBudgetMinPrice(minPrice);
  const durationMin = resolveBudgetMinDurationMinutes(minDurationMinutes);
  if (budgetMax == null && budgetMin == null && durationMin == null) {
    return [...services];
  }

  let filtered = [...services];
  if (budgetMax != null) {
    filtered = filterServicesByMaxPrice(filtered, budgetMax);
  }
  if (budgetMin != null) {
    filtered = filterServicesByMinPrice(filtered, budgetMin);
  }
  if (durationMin != null) {
    filtered = filterServicesByMinDuration(filtered, durationMin);
  }
  if (resolveBudgetPreferShortDuration(preferShortDuration)) {
    return sortServicesByDurationAsc(filtered);
  }
  return sortServicesByPriceAsc(filtered);
}

export function resolveBudgetNavigateServiceId(
  matches: readonly BudgetCatalogService[],
): string | null {
  return matches.length === 1 ? (matches[0]?.id ?? null) : null;
}

export function buildBudgetNoMatchHint(
  catalog: readonly BudgetCatalogService[],
  maxPrice: number,
): string | null {
  if (!isValidMaxPrice(maxPrice)) return null;

  const sorted = sortServicesByPriceAsc(catalog);
  const cheapest = sorted.find(
    (service) => resolveServiceCatalogPriceSafe(service.price) != null,
  );
  if (!cheapest) return null;

  const price = resolveServiceCatalogPriceSafe(cheapest.price);
  if (price == null || price <= maxPrice) return null;

  const duration =
    cheapest.durationMinutes != null
      ? ` (${cheapest.durationMinutes} min)`
      : '';
  return `Nothing under $${maxPrice}; cheapest option is ${cheapest.name} at $${price}${duration}.`;
}

/** Soft no-match copy for list_services — cheapest + next alternatives above budget. */
export function buildBudgetListServicesNoMatchSummary(
  catalog: readonly BudgetCatalogService[],
  maxPrice: number,
): string | null {
  if (!isValidMaxPrice(maxPrice)) return null;

  const aboveBudget = sortServicesByPriceAsc(catalog).filter((service) => {
    const price = resolveServiceCatalogPriceSafe(service.price);
    return price != null && price > maxPrice;
  });
  if (aboveBudget.length === 0) return null;

  const lines = [`Nothing under $${maxPrice}.`, '', 'Closest options:'];
  for (const service of aboveBudget.slice(0, 3)) {
    const price = resolveServiceCatalogPriceSafe(service.price)!;
    const duration =
      service.durationMinutes != null
        ? ` · ${service.durationMinutes} min`
        : '';
    lines.push(`• ${service.name} — $${price}${duration}`);
  }
  return lines.join('\n');
}

function resolveServiceCatalogPriceSafe(
  price: number | null | undefined,
): number | null {
  if (price == null) return null;
  const numeric = Number(price);
  return Number.isFinite(numeric) ? numeric : null;
}

/** rank-1.5 — keep list_services when prompt ranks catalog items, not providers. */
function isServiceCatalogRankBudgetPrompt(prompt: string): boolean {
  if (
    /\b(?:specialist|stylist|therapist|provider|employee)s?\b/i.test(prompt)
  ) {
    if (/\b(?:best|rated|top|highest|recommended|suggested)\b/i.test(prompt)) {
      return false;
    }
  }
  if (
    /\b(?:rated|reviews?|stars?|rating)\b/i.test(prompt) &&
    !/\b(?:service|services|option|options|offering|offerings)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:premium|luxury|deluxe|top[\s-]?tier|most expensive|priciest|cheapest|most affordable|lowest[\s-]?priced?|most popular|best[\s-]?selling)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /\bbest\b/i.test(prompt) &&
    /\b(?:service|services|option|options|offering|offerings)\b/i.test(prompt)
  );
}

export function rescueBudgetServiceDiscoveryIntent(
  prompt: string,
  action: string,
  surface?: Exclude<BudgetDiscoverySurface, 'both'> | 'dashboard',
): { action: string; rescueReason: string } | null {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return null;
  if (isConfigureServiceDepositPolicyPrompt(prompt)) return null;
  if (isBudgetAdministrativeOrExplainContext(prompt)) return null;

  const misroute = surface
    ? resolveBudgetMisrouteActionForSurface(prompt, surface)
    : resolveBudgetMisrouteAction(prompt);
  if (misroute && action !== misroute) {
    const canonicalMisroute = resolveBudgetMisrouteAction(prompt);
    return {
      action: misroute,
      rescueReason: canonicalMisroute ?? misroute,
    };
  }

  const maxTotalPrice = extractMaxTotalPriceFromBudgetPrompt(prompt);
  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  if (maxPrice == null && maxTotalPrice == null) return null;

  if (
    action === 'unknown' ||
    action === 'list_services' ||
    action === 'recommend_specialists'
  ) {
    if (maxTotalPrice != null && action === 'unknown') {
      return {
        action: 'list_services',
        rescueReason: 'budget_list_services',
      };
    }
    if (
      /\b(?:best|rated|top|specialist|stylist|therapist)\b/i.test(prompt) &&
      !isBudgetAnyProviderListPrompt(prompt)
    ) {
      if (isServiceCatalogRankBudgetPrompt(prompt)) {
        if (action === 'unknown') {
          return {
            action: 'list_services',
            rescueReason: 'rank_list_services',
          };
        }
        return null;
      }
      if (action !== 'recommend_specialists') {
        return {
          action: 'recommend_specialists',
          rescueReason: 'budget_recommend_specialists',
        };
      }
      return null;
    }

    if (
      isBudgetAnyProviderListPrompt(prompt) &&
      action === 'recommend_specialists'
    ) {
      return {
        action: 'list_services',
        rescueReason: 'budget_list_services',
      };
    }

    if (action === 'unknown') {
      return {
        action: 'list_services',
        rescueReason: 'budget_list_services',
      };
    }
  }

  return null;
}
