import {
  isBudgetGiftCardMisroute,
  isBudgetPackageDiscoveryPrompt,
  enrichBudgetFromPrompt,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
} from './ai-budget-service-discovery.util.js';
import type { ServiceRank } from './ai-service-catalog-rank.util.js';
import { isValidServiceRank } from './ai-service-catalog-rank.util.js';
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

const PROVIDER_RATING_PATTERN =
  /\b(?:rated|reviews?|stars?|rating)\b/i;

function includesRankHint(prompt: string, hints: readonly string[]): boolean {
  const haystack = prompt.toLowerCase();
  return hints.some((hint) => haystack.includes(hint.toLowerCase()));
}

/** Provider-rank prompts must not receive catalog serviceRank (rank-1.3 / rank-1.5). */
export function isServiceCatalogRankSpecialistPrompt(prompt: string): boolean {
  const specialist =
    /\b(?:specialist|stylist|therapist|provider|employee)s?\b/i.test(prompt);
  const rankCue =
    /\b(?:best|rated|top|highest|recommended|suggested)\b/i.test(prompt);
  return specialist && rankCue;
}

export function isServiceRankEnrichmentBlockedPrompt(prompt: string): boolean {
  if (isBudgetGiftCardMisroute(prompt)) return true;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return true;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return true;
  return false;
}

/** Deterministic serviceRank extraction for post-LLM enrichment (rank-1.3). */
export function extractServiceRankFromPrompt(prompt: string): ServiceRank | null {
  if (!prompt?.trim() || isServiceRankEnrichmentBlockedPrompt(prompt)) {
    return null;
  }

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
      HIGHEST_PRICE_PATTERN.test(prompt)) &&
    !isServiceCatalogRankSpecialistPrompt(prompt)
  ) {
    return 'highest_price';
  }

  return null;
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
  return enrichServiceRankFromPrompt(enrichBudgetFromPrompt({}, prompt), prompt);
}

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
    isServiceCatalogRankPrompt(prompt)
  ) {
    return {
      action: 'list_services',
      rescueReason: 'rank_list_services',
      params: buildServiceRankDiscoveryRescueParams(prompt),
    };
  }

  return null;
}
