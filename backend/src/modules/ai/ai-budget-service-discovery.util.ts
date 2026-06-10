import { extractAmountFromPrompt } from './ai-payments.util.js';
import {
  applyServiceDiscoveryToCatalog,
  filterServicesByMaxPrice,
  isValidMaxPrice,
  sortServicesByPriceAsc,
  type ServiceCatalogPriceEntry,
} from './ai-service-catalog-rank.util.js';
import type {
  BudgetDiscoverySurface,
  BudgetServiceDiscoveryPromptFixture,
} from './ai-budget-service-discovery.fixtures.js';

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

const BUDGET_BUCKS_PATTERN =
  /\b([\d,]+(?:\.\d{1,2})?)\s+bucks?\b/i;

const BUDGET_WORD_AMOUNT_PATTERN =
  /\b(?:have|under|below|max|about)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:dollars?|bucks?)\b/i;

const BUDGET_WORD_BUCKS_PATTERN = /\b([a-z]+)\s+bucks?\b/i;

const PLAIN_DOLLARS_PATTERN = /\b(\d+(?:\.\d{1,2})?)\s+dollars?\b/i;

const ABOUT_DOLLARS_PATTERN =
  /\babout\s+(\d+(?:\.\d{1,2})?)\s+dollars?\b/i;

const BUDGET_WORD_CEILING_PATTERN =
  /\b(?:under|below|max)\s+([a-z]+)\b/i;

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

export function isBudgetAdministrativeOrExplainContext(prompt: string): boolean {
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
  if (/\b(?:balance|check balance|gift card balance|track my|track the|track physical)\b/i.test(prompt)) {
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
  if (/\border\b/i.test(prompt) && /\b(?:buy|purchase|order)\s+(?:a\s+)?(?:physical\s+)?gift\s+card\b/i.test(prompt)) {
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
    /\b(?:add|set|update|clear|remove|delete|configure|create)\b/i.test(prompt) &&
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
  return (
    /\b(?:what packages|what bundles|what deals|show packages|browse packages|available packages|packages under|deals under|any packages|packages do you|packages are available)\b/i.test(
      prompt,
    ) ||
    /\b(?:what|which|show)\b[^.?!]{0,30}\b(?:packages|bundles|deals)\b/i.test(
      prompt,
    ) ||
    /\b(?:under|below|cheapest|affordable)\b/i.test(prompt)
  );
}

export function isBudgetDepositQuestion(prompt: string): boolean {
  return /\bdeposit\b/i.test(prompt);
}

export function isBudgetSubscriptionBalancePrompt(prompt: string): boolean {
  return /\b(?:subscription|plan)\b/i.test(prompt) && /\bcover\b/i.test(prompt);
}

/** True when maxPrice budget filtering should apply to this prompt. */
export function shouldExtractBudgetMaxPrice(prompt: string): boolean {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isBudgetDepositQuestion(prompt)) return false;
  if (isBudgetSubscriptionBalancePrompt(prompt)) return false;
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
  if (tokens.length === 2 && tokens[1] === 'dollars' && tokens[0] in WORD_NUMBER_MAP) {
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
  if (
    generic &&
    /\b(?:dram|rub|ruble|рубл|руб|դրամ)\b/i.test(prompt)
  ) {
    const value = parseNumericToken(generic[1]);
    if (value != null) return value;
  }

  return null;
}

export function resolveBudgetMisrouteAction(prompt: string): string | null {
  if (isBudgetAdministrativeOrExplainContext(prompt)) return null;
  if (isBudgetGiftCardMisroute(prompt)) return 'apply_gift_card_code';
  if (isBudgetPackageDiscoveryPrompt(prompt)) return 'discover_packages';
  if (isBudgetDepositQuestion(prompt)) return 'explain_checkout_currency';
  if (isBudgetSubscriptionBalancePrompt(prompt)) return 'discover_subscription_plans';
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

  const misroute = resolveBudgetMisrouteAction(prompt);
  if (misroute) {
    const next = { ...params };
    delete next.maxPrice;
    return next;
  }

  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  if (maxPrice != null) {
    return { ...params, maxPrice };
  }

  return params;
}

export type BudgetCatalogService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
  serviceCategory?: string;
  durationMinutes?: number;
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

/** Category filter first, then inclusive maxPrice filter, sorted ascending. */
export function applyBudgetDiscoveryToCatalog<T extends BudgetCatalogService>(
  services: readonly T[],
  options: { maxPrice?: number; serviceCategory?: string },
): T[] {
  return applyServiceDiscoveryToCatalog(services, {
    maxPrice: options.maxPrice,
    serviceCategory: options.serviceCategory,
  });
}

export function resolveBudgetMaxPrice(maxPrice: unknown): number | null {
  return isValidMaxPrice(maxPrice) ? maxPrice : null;
}

/** Apply inclusive maxPrice after category/name filters; ascending sort when budget is active. */
export function applyBudgetFilterToMatchedServices<T extends BudgetCatalogService>(
  services: readonly T[],
  maxPrice: unknown,
): T[] {
  if (!isValidMaxPrice(maxPrice)) {
    return [...services];
  }
  return sortServicesByPriceAsc(filterServicesByMaxPrice(services, maxPrice));
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
  if (/\b(?:specialist|stylist|therapist|provider|employee)s?\b/i.test(prompt)) {
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

  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  if (maxPrice == null) return null;

  if (
    action === 'unknown' ||
    action === 'list_services' ||
    action === 'recommend_specialists'
  ) {
    if (/\b(?:best|rated|top|specialist|stylist|therapist)\b/i.test(prompt)) {
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

    if (action === 'unknown') {
      return {
        action: 'list_services',
        rescueReason: 'budget_list_services',
      };
    }
  }

  return null;
}
