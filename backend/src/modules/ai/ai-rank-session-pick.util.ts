import {
  filterCatalogByCategory,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  applyServiceDiscoveryToCatalog,
  filterActiveCatalogServices,
  filterServicesByMaxPrice,
  isValidServiceRank,
  type ServiceRank,
} from './ai-service-catalog-rank.util.js';
import { resolveListServicesRankLimitFromPrompt } from './ai-rank-list-services.logic.js';

const RANK_SESSION_LIST_PICK_PATTERN =
  /\b(?:book\s+)?(?:the\s+)?(first|1st|second|2nd|third|3rd|fourth|4th)\s+one\b/i;

const LIST_PICK_INDEX: Record<string, number> = {
  first: 1,
  '1st': 1,
  second: 2,
  '2nd': 2,
  third: 3,
  '3rd': 3,
  fourth: 4,
  '4th': 4,
};

/** Session follow-up — pick Nth service from prior ranked list (rank-session-pick-one-en). */
export function isRankSessionListPickPrompt(prompt: string): boolean {
  return extractRankSessionListPickIndexFromPrompt(prompt) != null;
}

export function extractRankSessionListPickIndexFromPrompt(
  prompt: string,
): number | null {
  const match = prompt.match(RANK_SESSION_LIST_PICK_PATTERN);
  if (!match) return null;
  const index = LIST_PICK_INDEX[match[1].toLowerCase()];
  return index ?? null;
}

export function parseRankedServiceIdsFromSession(
  value: unknown,
): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry): entry is string => typeof entry === 'string',
      );
    }
  } catch {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return null;
}

export function serializeRankedServiceIds(
  serviceIds: readonly string[],
): string | null {
  return serviceIds.length > 0 ? JSON.stringify([...serviceIds]) : null;
}

/** Rebuild ranked list from prior session rank params when ids were not persisted. */
export function buildRankedServicesFromSessionContext<
  T extends BudgetCatalogService,
>(
  sessionParams: Record<string, unknown>,
  catalog: readonly T[],
  prompt?: string,
): T[] {
  const serviceRank = isValidServiceRank(sessionParams.serviceRank)
    ? sessionParams.serviceRank
    : null;
  if (!serviceRank) return [];

  const limit = resolveListServicesRankLimitFromPrompt(prompt, sessionParams);
  const serviceCategory =
    typeof sessionParams.serviceCategory === 'string'
      ? sessionParams.serviceCategory
      : undefined;
  const maxPrice =
    typeof sessionParams.maxPrice === 'number' ? sessionParams.maxPrice : null;

  let pool = filterActiveCatalogServices([...catalog]);
  if (serviceCategory) {
    pool = filterCatalogByCategory(pool, serviceCategory);
  }
  if (maxPrice != null) {
    pool = filterServicesByMaxPrice(pool, maxPrice);
  }

  return applyServiceDiscoveryToCatalog(pool, {
    serviceRank,
    serviceCategory,
    limit,
  });
}

export function resolveRankSessionListPickService<
  T extends { id: string; name: string },
>(rankedServices: readonly T[], pickIndex: number): T | null {
  if (pickIndex < 1 || pickIndex > rankedServices.length) return null;
  return rankedServices[pickIndex - 1] ?? null;
}

/** Resolve ordinal pick against session ranked list ids or rebuilt catalog rank. */
export function enrichRankSessionPickFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
  catalog: Array<{ id: string; name: string }>,
  rankedCatalog?: readonly BudgetCatalogService[],
): Record<string, unknown> | null {
  const pickIndex = extractRankSessionListPickIndexFromPrompt(prompt);
  if (pickIndex == null) return null;

  const rankedIds = parseRankedServiceIdsFromSession(params.rankedServiceIds);
  let picked: { id: string; name: string } | null = null;

  if (rankedIds?.length) {
    const pickId = rankedIds[pickIndex - 1];
    picked = catalog.find((service) => service.id === pickId) ?? null;
  } else if (rankedCatalog?.length) {
    const ranked = buildRankedServicesFromSessionContext(
      params,
      rankedCatalog,
      prompt,
    );
    picked = resolveRankSessionListPickService(ranked, pickIndex);
  }

  if (!picked) return null;

  return enrichDiscoveryParamsFromPrompt(
    {
      ...params,
      serviceId: picked.id,
      serviceName: picked.name,
    },
    prompt,
  );
}
