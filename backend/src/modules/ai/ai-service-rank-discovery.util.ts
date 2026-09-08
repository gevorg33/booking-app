import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';
import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';
import {
  isBudgetGiftCardMisroute,
  isBudgetPackageDiscoveryPrompt,
  enrichBudgetFromPrompt,
  extractMaxPriceFromBudgetPrompt,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
} from './ai-budget-service-discovery.util.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';
import { resolveServiceMetric } from './ai-intent-heuristics.js';
import {
  enrichServiceTierFromPrompt,
  extractServiceTierFromPrompt,
  isServiceTierFilterPrompt,
} from '../../common/utils/service-rank-metadata.util.js';
import type { ServiceRank } from './ai-service-catalog-rank.util.js';
import { isValidServiceRank } from './ai-service-catalog-rank.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichEmployeeRoleRankFromPrompt } from './ai-employee-role-rank.util.js';
import { resolveListServicesRankLimitFromPrompt } from './ai-rank-list-services.logic.js';
import { isRankSessionListPickPrompt } from './ai-rank-session-pick.util.js';
import { enrichFlexibleAvailabilitySingleWindowFromPrompt } from './ai-flexible-availability.util.js';
import {
  RANK_I18N_HIGHEST_HINTS,
  RANK_I18N_LOWEST_HINTS,
} from './ai-service-rank-discovery.fixtures.js';

const HIGHEST_PRICE_PATTERN =
  /\b(?:premium|luxury|deluxe|top[\s-]?tier|most expensive|priciest|high[\s-]?end|upscale|vip|signature|flagship)\b/i;

const LOWEST_PRICE_PATTERN =
  /\b(?:cheapest|most affordable|lowest[\s-]?priced?|least expensive|budget[\s-]?friendly|entry[\s-]?level)\b/i;

const MOST_POPULAR_PATTERN =
  /\b(?:most popular|best[\s-]?selling|top[\s-]?selling|best[\s-]?seller)\b/i;

const SERVICE_CATALOG_NOUN_PATTERN =
  /\b(?:service|services|option|options|offering|offerings|package tier)\b/i;

const PROVIDER_RATING_PATTERN = /\b(?:rated|reviews?|stars?|rating)\b/i;

// e2e-bug.278 — do not treat bare "recommend for <service>" as subjective
// ("Who do you recommend for a massage tomorrow?" is provider rank).
const SUBJECTIVE_RANK_PATTERN =
  /\b(?:first[\s-]?time|for\s+me|for\s+my|suitable\s+for|new\s+to|beginner|beginners)\b/i;

const RANK_BEST_SERVICE_CATEGORY_PATTERN =
  /\bbest\s+([a-z][\w-]{2,30})(?=\s*(?:and|under|below|for|with|tomorrow|today|nearest|soonest|service|services|not|,|$))/i;

/** e2e-bug.101 — include most expensive / most premium (not only cheapest / bare premium). */
const RANK_SERVICE_CATEGORY_PATTERN =
  /\b(?:most\s+popular|best[\s-]?selling|most\s+expensive|priciest|most\s+premium|premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|entry[\s-]?level|budget[\s-]?friendly|vip|signature|flagship|high[\s-]?end|upscale)\s+([a-z][\w-]{2,30})(?=\s*(?:\?|$|under|below|for|with|option|service|services|treatment|treatments|you|tomorrow|today|nearest|soonest|,))/i;

const SERVICE_CATALOG_NOT_PROVIDER_PATTERN =
  /\bnot\s+(?:a\s+)?(?:person|people|provider|stylist|therapist|specialist|staff|employee)s?\b/i;

const RANK_SESSION_UPGRADE_PATTERN =
  /\bshow\s+(?:the\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|most\s+affordable|budget[\s-]?friendly|entry[\s-]?level|most\s+popular)\s+instead\b|\b(?:premium|luxury|cheapest|most\s+affordable|most\s+popular)\s+instead\b/i;

const RANK_SESSION_BUDGET_REFINE_PATTERN =
  /\b(?:anything|something)\s+like\s+that\s+under\b|\b(?:like|similar)\s+that\s+under\b|\bsimilar\s+(?:options?\s+)?under\b|\btoo\s+much\b[\s—-]*\bunder\b/i;

const TIER_FILTER_CATEGORY_PATTERN =
  /\b(?:tier\s+)?services?\s+for\s+([a-z][\w-]{2,30})\b/i;

const MID_RANGE_PATTERN = /\bmid[\s-]?range\b/i;

const MID_RANGE_CATEGORY_PATTERN =
  /\bmid[\s-]?range\s+([a-z][\w-]{2,30})(?:\s+service)?\b/i;

const RANK_SERVICE_CATEGORY_ALIASES: Record<string, string> = {
  // e2e-bug.323 — bare "cut"/"cuts" must NOT pre-alias to "haircut": doing so
  // discards the raw token before matchServicesByQuery ever runs, so its
  // literal-substring-first synonym expansion never gets a chance to prefer
  // real catalog rows named "Men's cut" / "Women's cut" over the unrelated
  // "hairstyle" synonym match. Leaving "cut" unaliased (and normalizing
  // plural "cuts" -> "cut", not "haircut") lets expandServiceLookupQueries
  // try the raw singular token first (finds "* cut" rows when present) and
  // still falls back to the haircut/hairstyle family via the same synonym
  // group when no literal cut-named service exists.
  cuts: 'cut',
  trim: 'haircut',
  // e2e-bug.101 — "most expensive styling" bypassed the haircut/hairstyle
  // synonym entirely (that group only expands multi-word "hair styling"),
  // so a catalog with only "hairstyle" (no literal "styling") never matched.
  style: 'haircut',
  styles: 'haircut',
  styling: 'haircut',
  massages: 'massage',
};

/** e2e-bug.101 — strip "most expensive" / "your most premium" the same as "cheapest". */
const LEADING_SERVICE_RANK_ADJECTIVE_PATTERN =
  /^(?:(?:your|the|a|an)\s+)*(?:cheapest|most\s+affordable|lowest[\s-]?priced?|least\s+expensive|most\s+expensive|priciest|most\s+premium|premium|luxury|deluxe|best(?:[\s-]?selling)?|top[\s-]?tier|most\s+popular|budget[\s-]?friendly|entry[\s-]?level|mid[\s-]?range|high[\s-]?end|upscale|vip|signature|flagship)\s+/i;

/** Strip catalog-rank adjectives before treating a token as serviceName (discover-flagship-book-en). */
export function stripLeadingServiceRankAdjectives(name: string): string {
  let next = name.trim();
  for (let i = 0; i < 3; i += 1) {
    const stripped = next
      .replace(LEADING_SERVICE_RANK_ADJECTIVE_PATTERN, '')
      .trim();
    if (stripped === next) break;
    next = stripped;
  }
  return next;
}

/** When rank adjectives polluted serviceName, prefer category (e2e-bug.101). */
export function scrubRankPollutedServiceNameParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof params.serviceName !== 'string' || !params.serviceName.trim()) {
    return params;
  }
  const stripped = stripLeadingServiceRankAdjectives(params.serviceName);
  if (stripped === params.serviceName.trim()) return params;

  const next: Record<string, unknown> = { ...params };
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    next.serviceName = null;
    next.serviceNames = null;
    if (!next.serviceCategory && words[0]) {
      next.serviceCategory = words[0];
    }
  } else {
    next.serviceName = stripped;
  }
  return next;
}

/** Generic catalog nouns — not a service category (discover-journey-premium-en T1). */
const RANK_SERVICE_CATEGORY_NOISE = new Set([
  'option',
  'options',
  'service',
  'services',
  'offering',
  'offerings',
  'treatment',
  'treatments',
  'package',
  'packages',
  // e2e-bug.260 — "best rated for massage" / "best specialists for facial"
  // must not treat rank/provider nouns as the service category.
  'rated',
  'rating',
  'ratings',
  'specialist',
  'specialists',
  'stylist',
  'stylists',
  'therapist',
  'therapists',
  'provider',
  'providers',
  'employee',
  'employees',
  'staff',
  'team',
]);

function normalizeRankServiceCategoryKeyword(keyword: string): string | null {
  const cleaned = keyword
    .trim()
    .replace(/[?.!]+$/, '')
    .toLowerCase();
  if (!cleaned || RANK_SERVICE_CATEGORY_NOISE.has(cleaned)) return null;
  const aliased = RANK_SERVICE_CATEGORY_ALIASES[cleaned] ?? cleaned;
  return aliased.length >= 3 ? aliased : null;
}

/** Mid-range catalog browse — price-sorted list, no serviceRank (rank-mid-range-en v1). */
export function isMidRangeServiceListPrompt(prompt: string): boolean {
  return MID_RANGE_PATTERN.test(prompt);
}

/** Budget browse across value + premium tiers — list all in range, no serviceRank (discover-value-or-premium-en). */
export function isValueOrPremiumBudgetListPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  return (
    /\baffordable\s+or\s+premium\b/i.test(prompt) ||
    /\bpremium\s+or\s+affordable\b/i.test(prompt) ||
    /\bwhat\s+fits\b/i.test(prompt)
  );
}

/** Affordability question — budget list browse, no catalog rank (discover-flagship-question-en). */
export function isAffordabilityListPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  return (
    /\bcan\s+(?:i|we)\s+afford\b/i.test(prompt) ||
    /\b(?:could|would)\s+(?:i|we)\s+afford\b/i.test(prompt)
  );
}

/** Session follow-up — switch catalog rank tier while keeping prior category (rank-session-upgrade-en). */
export function isRankSessionUpgradePrompt(prompt: string): boolean {
  return RANK_SESSION_UPGRADE_PATTERN.test(prompt);
}

/** Session follow-up — add budget ceiling to prior rank pick (rank-session-then-budget-en). */
export function isRankSessionBudgetRefinePrompt(prompt: string): boolean {
  if (!RANK_SESSION_BUDGET_REFINE_PATTERN.test(prompt)) return false;
  return extractMaxPriceFromBudgetPrompt(prompt) != null;
}

function includesRankHint(prompt: string, hints: readonly string[]): boolean {
  const haystack = prompt.toLowerCase();
  return hints.some((hint) => haystack.includes(hint.toLowerCase()));
}

/** Catalog recommend with explicit anti-provider cue — list_services rank, not specialists (rank-recommend-not-provider-en). */
export function isServiceCatalogRecommendNotProviderPrompt(
  prompt: string,
): boolean {
  if (!prompt?.trim()) return false;
  return (
    /\brecommend/i.test(prompt) &&
    SERVICE_CATALOG_NOUN_PATTERN.test(prompt) &&
    SERVICE_CATALOG_NOT_PROVIDER_PATTERN.test(prompt)
  );
}

/** Provider-rank prompts must not receive catalog serviceRank (rank-1.3 / rank-1.5). */
export function isServiceCatalogRankSpecialistPrompt(prompt: string): boolean {
  const specialist =
    /\b(?:specialist|stylist|therapist|provider|employee|someone|somebody)s?\b/i.test(
      prompt,
    );
  const rankCue =
    /\b(?:best|rated|top|highest|recommend(?:ed|s)?|suggest(?:ed|s)?)\b/i.test(
      prompt,
    );
  if (specialist && rankCue) return true;

  // e2e-bug.278 — who-recommend / who-is-best / recommend-someone (day-part ok).
  return (
    /\bwho\s+(?:do\s+you\s+)?recommend\b/i.test(prompt) ||
    /\bwho\s+is\s+(?:the\s+)?best\b/i.test(prompt) ||
    /\brecommend\s+someone\b/i.test(prompt) ||
    /\bsuggest\s+(?:someone|a\s+(?:specialist|stylist|therapist|provider))\b/i.test(
      prompt,
    )
  );
}

/** Provider rating discovery — specialist or "best rated X" without catalog service noun (rank-specialist-stays-en). */
export function isProviderRankDiscoveryPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isServiceCatalogRecommendNotProviderPrompt(prompt)) return false;
  // e2e-bug.434 — a specialty *read* is not a ranking ask.
  //
  // "Who is best for curly hair?" is claimed by both this detector and
  // `explain_provider_specialty`, and the two are genuinely close: one ranks
  // providers, the other answers who has a given skill. Probed across the
  // neighbouring phrasings, only this one is ambiguous —
  //
  //     "Who is best for curly hair?"              specialty ✓  rank ✓   ← both
  //     "Who is the best stylist?"                 specialty ✗  rank ✓
  //     "Which provider is top rated for massage?" specialty ✗  rank ✓
  //     "Who is the expert in balayage?"           specialty ✓  rank ✗
  //
  // — so the exclusion costs the ranking detector nothing it uniquely owns. It
  // sits above `isServiceCatalogRankSpecialistPrompt`, which returns `true`
  // outright and would otherwise short-circuit the question.
  if (isExplainProviderSpecialtyPrompt(prompt)) return false;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return true;
  if (
    PROVIDER_RATING_PATTERN.test(prompt) &&
    /\b(?:best|top|highest)\b/i.test(prompt) &&
    !SERVICE_CATALOG_NOUN_PATTERN.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function extractProviderRankServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  if (!isProviderRankDiscoveryPrompt(prompt)) return null;

  // e2e-bug.260 — allow "for massage today" (no article); stop before date /
  // day-part / budget windows ("for a cut under $60").
  const forServiceMatch = prompt.match(
    /\bfor\s+(?:(?:a|an|the)\s+)?([a-z][\w-]{2,30})(?=\s*(?:this\b|next\b|today\b|tomorrow\b|tonight\b|week\b|weekend\b|morning\b|afternoon\b|evening\b|under\b|below\b|,|\?|$))/i,
  );
  if (forServiceMatch) {
    const normalized = normalizeRankServiceCategoryKeyword(
      forServiceMatch[1].trim().replace(/[?.!]+$/, ''),
    );
    if (normalized) return normalized;
  }

  const specialist = prompt.match(
    /\b(?:best\s+)?(?:rated\s+)?([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\s+(?:specialist|stylist|therapist|provider|employee)s?\b/i,
  );
  if (specialist) {
    const category = specialist[1].trim().replace(/[?.!]+$/, '');
    if (category.length >= 2 && category.toLowerCase() !== 'rated') {
      const normalized = normalizeRankServiceCategoryKeyword(category);
      if (normalized) return normalized;
    }
  }

  // Do not let "rated for …" capture the word "for" as the category.
  const rated = prompt.match(
    /\b(?:best\s+)?rated\s+(?!for\b|under\b)([a-z][\w\s-]{2,40}?)(?=\s*(?:this\s+week|under|for|$))/i,
  );
  if (rated) {
    const category = rated[1].trim().replace(/[?.!]+$/, '');
    return normalizeRankServiceCategoryKeyword(category);
  }

  return null;
}

/** Subjective "best for me" — booking_help, not catalog serviceRank (rank-best-for-me-en). */
export function isSubjectiveServiceRankPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return false;
  if (isServiceCatalogRecommendNotProviderPrompt(prompt)) return false;
  if (
    !/\bbest\b/i.test(prompt) &&
    !/\brecommend(?:ed|ation)?\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    HIGHEST_PRICE_PATTERN.test(prompt) ||
    LOWEST_PRICE_PATTERN.test(prompt) ||
    MOST_POPULAR_PATTERN.test(prompt)
  ) {
    return false;
  }
  return SUBJECTIVE_RANK_PATTERN.test(prompt);
}

export function extractSubjectiveRankServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  if (!isSubjectiveServiceRankPrompt(prompt)) return null;

  const firstTime = prompt.match(
    /\bfirst[\s-]?time\s+([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\b/i,
  );
  if (firstTime) {
    const category = firstTime[1].trim().replace(/[?.!]+$/, '');
    return category.length >= 3 ? category : null;
  }

  const forA = prompt.match(
    /\bfor\s+(?:a\s+)?([a-z][\w-]*(?:\s+[a-z][\w-]*)?)\s*[?.!]?\s*$/i,
  );
  if (forA) {
    const category = forA[1].trim().replace(/[?.!]+$/, '');
    return category.length >= 3 ? category : null;
  }

  return null;
}

/** Dashboard admin service analytics — analyze_services, not catalog serviceRank (rank-not-analyze-services-admin-en). */
export function isAdminServiceAnalyticsRankPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (
    /\b(?:most\s+booked|top\s+revenue|least\s+(?:booked|popular)|best\s+performing|busiest)\b/i.test(
      prompt,
    ) &&
    /\bservices?\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    /\bservices?\b/i.test(prompt) &&
    /\b(?:this\s+month|this\s+week|today|last\s+month|last\s+week)\b/i.test(
      prompt,
    ) &&
    /\b(?:most|top|least|busiest)\b/i.test(prompt)
  );
}

/** Dashboard admin appointment analytics — analyze_appointments, not catalog rank (rank-not-analyze-appt-en). */
export function isAdminAppointmentAnalyticsRankPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  return (
    /\b(?:most\s+expensive|longest|shortest|earliest|latest)\b/i.test(prompt) &&
    /\bappointments?\b/i.test(prompt)
  );
}

export function isServiceRankEnrichmentBlockedPrompt(prompt: string): boolean {
  if (
    isExplainCheckoutCurrencyPrompt(prompt) &&
    /\b(?:explain|why|what currency|which currency)\b/i.test(prompt)
  ) {
    return true;
  }
  if (isBudgetGiftCardMisroute(prompt)) return true;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return true;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return true;
  if (isSubjectiveServiceRankPrompt(prompt)) return true;
  if (isAdminServiceAnalyticsRankPrompt(prompt)) return true;
  if (isAdminAppointmentAnalyticsRankPrompt(prompt)) return true;
  return false;
}

export function extractServiceRankServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  if (isRankSessionUpgradePrompt(prompt)) return null;
  if (isRankSessionBudgetRefinePrompt(prompt)) return null;
  if (isRankSessionListPickPrompt(prompt)) return null;
  // e2e-bug.260 — provider-rank prompts use specialist extract, not "best rated".
  if (
    isServiceCatalogRankSpecialistPrompt(prompt) ||
    isProviderRankDiscoveryPrompt(prompt)
  ) {
    return extractProviderRankServiceCategoryFromPrompt(prompt);
  }

  if (isMidRangeServiceListPrompt(prompt)) {
    const midRangeMatch = prompt.match(MID_RANGE_CATEGORY_PATTERN);
    if (midRangeMatch) {
      return normalizeRankServiceCategoryKeyword(midRangeMatch[1]);
    }
  }

  const tierFor = prompt.match(TIER_FILTER_CATEGORY_PATTERN);
  if (tierFor) {
    return normalizeRankServiceCategoryKeyword(tierFor[1]);
  }

  const rankMatch = prompt.match(RANK_SERVICE_CATEGORY_PATTERN);
  if (rankMatch) {
    return normalizeRankServiceCategoryKeyword(rankMatch[1]);
  }

  const bestMatch = prompt.match(RANK_BEST_SERVICE_CATEGORY_PATTERN);
  if (bestMatch) {
    return normalizeRankServiceCategoryKeyword(bestMatch[1]);
  }

  return null;
}

/** Deterministic serviceRank extraction for post-LLM enrichment (rank-1.3). */
export function extractServiceRankFromPrompt(
  prompt: string,
): ServiceRank | null {
  if (!prompt?.trim() || isServiceRankEnrichmentBlockedPrompt(prompt)) {
    return null;
  }
  if (isServiceTierFilterPrompt(prompt)) return null;
  if (isMidRangeServiceListPrompt(prompt)) return null;
  if (isValueOrPremiumBudgetListPrompt(prompt)) return null;
  if (isAffordabilityListPrompt(prompt)) return null;

  if (MOST_POPULAR_PATTERN.test(prompt)) return 'most_popular';
  if (
    LOWEST_PRICE_PATTERN.test(prompt) ||
    includesRankHint(prompt, RANK_I18N_LOWEST_HINTS)
  ) {
    return 'lowest_price';
  }
  if (
    HIGHEST_PRICE_PATTERN.test(prompt) ||
    includesRankHint(prompt, RANK_I18N_HIGHEST_HINTS)
  ) {
    return 'highest_price';
  }

  if (
    /\bbest\b/i.test(prompt) &&
    (SERVICE_CATALOG_NOUN_PATTERN.test(prompt) ||
      HIGHEST_PRICE_PATTERN.test(prompt) ||
      RANK_BEST_SERVICE_CATEGORY_PATTERN.test(prompt)) &&
    !isServiceCatalogRankSpecialistPrompt(prompt)
  ) {
    return 'highest_price';
  }

  return null;
}

export function extractBestServiceCategoryFromPrompt(
  prompt: string,
): string | null {
  const match = prompt.match(RANK_BEST_SERVICE_CATEGORY_PATTERN);
  if (!match) return null;
  const category = match[1].trim().replace(/[?.!]+$/, '');
  return category.length >= 3 ? category : null;
}

/** Post-LLM enrichment — set or strip serviceRank when classifier missed rank cues. */
export function enrichServiceRankFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (!prompt?.trim()) return params;

  if (isServiceRankEnrichmentBlockedPrompt(prompt)) {
    const next = { ...params };
    delete next.serviceRank;
    return next;
  }

  if (isServiceTierFilterPrompt(prompt)) {
    const next = { ...params };
    delete next.serviceRank;
    return next;
  }

  if (isMidRangeServiceListPrompt(prompt)) {
    const next = { ...params };
    delete next.serviceRank;
    return next;
  }

  if (isValueOrPremiumBudgetListPrompt(prompt)) {
    const next = { ...params };
    delete next.serviceRank;
    return next;
  }

  if (isAffordabilityListPrompt(prompt)) {
    const next = { ...params };
    delete next.serviceRank;
    return next;
  }

  const serviceRank = extractServiceRankFromPrompt(prompt);
  if (serviceRank) {
    return { ...params, serviceRank };
  }

  return params;
}

export function resolveServiceRankParam(value: unknown): ServiceRank | null {
  return isValidServiceRank(value) ? value : null;
}

/** Catalog service rank — not provider/specialist rating (rank-1.5). */
export function isServiceCatalogRankPrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (isServiceRankEnrichmentBlockedPrompt(prompt)) return false;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return false;
  if (
    PROVIDER_RATING_PATTERN.test(prompt) &&
    !SERVICE_CATALOG_NOUN_PATTERN.test(prompt)
  ) {
    return false;
  }
  return extractServiceRankFromPrompt(prompt) != null;
}

/** Misclassified recommend_specialists → list_services + serviceRank (rank-1.5). */
export function rescueServiceRankFromRecommendSpecialistsIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (action !== 'recommend_specialists') return null;
  if (!isServiceCatalogRankPrompt(prompt)) return null;
  return {
    action: 'list_services',
    rescueReason: 'rank_recommend_specialists',
  };
}

export function buildServiceRankDiscoveryRescueParams(
  prompt: string,
): Record<string, unknown> {
  const enriched = scrubRankPollutedServiceNameParams(
    enrichServiceTierFromPrompt(
      enrichServiceRankFromPrompt(enrichBudgetFromPrompt({}, prompt), prompt),
      prompt,
    ),
  );
  const category = extractServiceRankServiceCategoryFromPrompt(prompt);
  const rankedParams: Record<string, unknown> = { ...enriched };
  if (category) {
    rankedParams.serviceCategory = category;
    delete rankedParams.serviceName;
    delete rankedParams.serviceNames;
  }
  const withCategory = enrichListServicesParamsFromPrompt(prompt, rankedParams);
  if (isMidRangeServiceListPrompt(prompt)) {
    return {
      ...withCategory,
      limit: resolveListServicesRankLimitFromPrompt(prompt, withCategory),
    };
  }
  return withCategory;
}

export function buildProviderRankDiscoveryRescueParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichEmployeeRoleRankFromPrompt(
    enrichBudgetFromPrompt({}, prompt),
    prompt,
  );
  delete params.serviceRank;
  if (params.employeeRole) {
    return enrichFlexibleAvailabilitySingleWindowFromPrompt(prompt, params);
  }

  const serviceCategory = extractProviderRankServiceCategoryFromPrompt(prompt);
  if (serviceCategory) {
    params.serviceCategory = serviceCategory;
  }
  // e2e-bug.296 — rescue params must carry tonight/this evening → date+timeOfDay
  // (otherwise recommend_specialists falls back to a 14-day scan).
  return enrichFlexibleAvailabilitySingleWindowFromPrompt(prompt, params);
}

export function buildSubjectiveRankDiscoveryRescueParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichBudgetFromPrompt({}, prompt);
  delete params.serviceRank;
  const serviceCategory =
    extractSubjectiveRankServiceCategoryFromPrompt(prompt);
  if (serviceCategory) {
    params.serviceCategory = serviceCategory;
  }
  return params;
}

export function buildAdminServiceAnalyticsRescueParams(
  prompt: string,
): Record<string, unknown> {
  return { serviceMetric: resolveServiceMetric({}, prompt) };
}

const PROVIDER_RANK_MISROUTE_ACTIONS = new Set([
  'unknown',
  'list_services',
  'check_providers_for_service',
  'check_availability',
]);

/** Surface-scoped rank discovery rescue for public/customer eval + pipeline (rank-1.11). */
export function rescueServiceRankDiscoveryIntent(
  prompt: string,
  action: string,
  surface: 'public' | 'customer' | 'dashboard' = 'public',
): {
  action: string;
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (isConfigureServiceDepositPolicyPrompt(prompt)) return null;

  if (
    surface === 'dashboard' &&
    (action === 'unknown' || action === 'list_services') &&
    isAdminServiceAnalyticsRankPrompt(prompt)
  ) {
    return {
      action: 'analyze_services',
      rescueReason: 'rank_to_analyze_services',
      params: buildAdminServiceAnalyticsRescueParams(prompt),
    };
  }

  if (
    surface === 'dashboard' &&
    (action === 'unknown' || action === 'list_services') &&
    isAdminAppointmentAnalyticsRankPrompt(prompt)
  ) {
    return {
      action: 'analyze_appointments',
      rescueReason: 'rank_to_analyze_appointments',
      params: {},
    };
  }

  if (
    (action === 'unknown' || action === 'list_services') &&
    isSubjectiveServiceRankPrompt(prompt)
  ) {
    return {
      action: 'booking_help',
      rescueReason: 'rank_subjective_booking_help',
      params: buildSubjectiveRankDiscoveryRescueParams(prompt),
    };
  }

  if (
    PROVIDER_RANK_MISROUTE_ACTIONS.has(action) &&
    isProviderRankDiscoveryPrompt(prompt)
  ) {
    return {
      action: 'recommend_specialists',
      rescueReason: 'rank_provider_specialists',
      params: buildProviderRankDiscoveryRescueParams(prompt),
    };
  }

  if (isServiceRankEnrichmentBlockedPrompt(prompt)) {
    const misroute = resolveBudgetMisrouteActionForSurface(prompt, surface);
    const canonicalMisroute = resolveBudgetMisrouteAction(prompt);
    if (misroute && action !== misroute) {
      return {
        action: misroute,
        rescueReason: canonicalMisroute ?? misroute,
        params: {},
      };
    }
    return null;
  }

  const rankRecommend = rescueServiceRankFromRecommendSpecialistsIntent(
    prompt,
    action,
  );
  if (rankRecommend) {
    return {
      ...rankRecommend,
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  const budgetRescue = rescueBudgetServiceDiscoveryIntent(
    prompt,
    action,
    surface,
  );
  if (budgetRescue?.rescueReason === 'rank_list_services') {
    return {
      ...budgetRescue,
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  if (
    (action === 'unknown' || action === 'list_services') &&
    isMidRangeServiceListPrompt(prompt)
  ) {
    return {
      action: 'list_services',
      rescueReason: 'rank_mid_range_list',
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  if (
    (action === 'unknown' || action === 'list_services') &&
    isServiceCatalogRankPrompt(prompt)
  ) {
    return {
      action: 'list_services',
      rescueReason: 'rank_list_services',
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  if (
    (action === 'unknown' || action === 'list_services') &&
    extractServiceTierFromPrompt(prompt)
  ) {
    return {
      action: 'list_services',
      rescueReason: 'rank_tier_filter',
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  return null;
}
