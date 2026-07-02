import {
  applyBudgetFilterToMatchedServices,
  buildBudgetListServicesNoMatchSummary,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import {
  buildRankPremiumNoMatchInBudgetSummary,
  formatDashboardListServiceLine,
  formatPublicListServiceLine,
  resolveListServicesNavigateHint,
  type DashboardListServiceCatalogRow,
  type ListServicesNavigateHint,
  type PublicListServiceCatalogRow,
} from './ai-budget-list-services.logic.js';
import type { ServiceTier } from '../../common/utils/service-rank-metadata.util.js';
import {
  applyServiceDiscoveryToCatalog,
  filterActiveCatalogServices,
  resolveServiceDiscoveryParams,
  sortServicesByPriceAsc,
  type ServiceRank,
} from './ai-service-catalog-rank.util.js';

export function resolveListServicesRankLimitFromPrompt(
  prompt: string | undefined,
  params: Record<string, unknown>,
): number {
  const raw = params.limit;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.min(5, Math.floor(raw));
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    return Math.min(5, parseInt(raw.trim(), 10));
  }

  if (!prompt?.trim()) return 1;

  if (/\bmid[\s-]?range\b/i.test(prompt)) return 3;

  const topN = prompt.match(/\btop\s+(\d+)\b/i);
  if (topN?.[1]) {
    return Math.min(5, Math.max(1, parseInt(topN[1], 10)));
  }

  if (/\bshow\s+(?:me\s+)?all\b/i.test(prompt)) return 5;
  if (
    /\ball\s+(?:the\s+)?(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|affordable|popular|best)\b/i.test(
      prompt,
    )
  ) {
    return 5;
  }
  if (
    /\b(?:premium|luxury|deluxe|top[\s-]?tier|cheapest|affordable|popular)\s+options?\b/i.test(
      prompt,
    )
  ) {
    return 5;
  }

  if (/\btop[\s-]?tier\b/i.test(prompt) && /\bservices\b/i.test(prompt)) {
    return 3;
  }

  if (
    /\b(?:services|options|offerings)\b/i.test(prompt) &&
    !/\b(?:what(?:'s| is)|which is)\s+(?:your|the|a)\b/i.test(prompt)
  ) {
    return 3;
  }

  return 1;
}

export function collectDistinctServiceCategories(
  services: ReadonlyArray<{ serviceCategory?: string | null; name?: string }>,
): string[] {
  const categories = new Set<string>();
  for (const service of services) {
    const category = service.serviceCategory?.trim();
    if (category) {
      categories.add(category);
      continue;
    }
    const name = service.name?.trim();
    if (name) categories.add(name);
  }
  return [...categories].sort((left, right) => left.localeCompare(right));
}

/** rank-empty-category — honest not-found + available category suggestions. */
export function buildRankEmptyCategorySummary(
  serviceCategory: string,
  catalog: readonly BudgetCatalogService[],
): string {
  const categories = collectDistinctServiceCategories(catalog);
  const category = serviceCategory.trim();
  if (categories.length === 0) {
    return `No matching services found in the catalog for "${category}".`;
  }
  return `I couldn't find "${category}". Available categories: ${categories.join(', ')}.`;
}

export function buildRankListServicesHeader(input: {
  serviceRank: ServiceRank;
  serviceCategory?: string | null;
  limit: number;
}): string {
  const category = input.serviceCategory?.trim();
  const categorySuffix = category ? ` ${category}` : '';

  if (input.limit === 1) {
    if (input.serviceRank === 'highest_price') {
      return category ? `Our top${categorySuffix} option:` : 'Our top option:';
    }
    if (input.serviceRank === 'lowest_price') {
      return category
        ? `Our most affordable${categorySuffix} option:`
        : 'Our most affordable option:';
    }
    return category
      ? `Our most popular${categorySuffix} option:`
      : 'Our most popular option:';
  }

  if (input.serviceRank === 'highest_price') {
    return category
      ? `Top premium${categorySuffix} options:`
      : 'Top premium options:';
  }
  if (input.serviceRank === 'lowest_price') {
    return category
      ? `Most affordable${categorySuffix} options:`
      : 'Most affordable options:';
  }
  return category
    ? `Most popular${categorySuffix} options:`
    : 'Most popular options:';
}

/** Mid-range category browse — price-sorted list, no serviceRank (rank-mid-range-en). */
export function composePublicListServicesMidRangeResponse(input: {
  matchedServices: PublicListServiceCatalogRow[];
  serviceCategory?: string | null;
  limit: number;
  header?: string;
}): {
  services: PublicListServiceCatalogRow[];
  summary: string;
  success: boolean;
  navigate?: ListServicesNavigateHint;
} {
  const filtered = applyServiceDiscoveryToCatalog(input.matchedServices, {
    serviceCategory: input.serviceCategory,
    limit: input.limit,
  });
  const services = sortServicesByPriceAsc(filtered);

  if (services.length === 0) {
    const category = input.serviceCategory?.trim();
    return {
      services: [],
      success: true,
      summary:
        category && input.matchedServices.length > 0
          ? buildRankEmptyCategorySummary(category, input.matchedServices)
          : 'No matching services found in the catalog.',
    };
  }

  const category = input.serviceCategory?.trim();
  const header =
    input.header ??
    (category
      ? `Mid-range ${category} services (sorted by price):`
      : 'Mid-range services (sorted by price):');
  const lines = services.map(formatPublicListServiceLine);

  return {
    services,
    success: true,
    summary: [header, '', ...lines].join('\n'),
    navigate: resolveRankListServicesNavigateHint(services),
  };
}

export function buildTierFilterListServicesHeader(input: {
  serviceTier: ServiceTier;
  serviceCategory?: string | null;
}): string {
  const tierLabel =
    input.serviceTier === 'premium' ? 'Premium tier' : 'Standard tier';
  const category = input.serviceCategory?.trim();
  return category
    ? `${tierLabel} ${category} services:`
    : `${tierLabel} services:`;
}

export function applyRankToMatchedServices<T extends BudgetCatalogService>(
  matchedServices: readonly T[],
  serviceRank: ServiceRank,
  limit: number,
): T[] {
  return applyServiceDiscoveryToCatalog(matchedServices, {
    serviceRank,
    limit,
  });
}

/** rank-1.6 — pre-select one ranked service; open services tab when multiple. */
export function resolveRankListServicesNavigateHint(
  services: ReadonlyArray<{ id: string }>,
): ListServicesNavigateHint | undefined {
  return resolveListServicesNavigateHint(services);
}

function mapDashboardListServiceDetails(
  services: readonly DashboardListServiceCatalogRow[],
) {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    bufferMinutes: service.bufferMinutes,
    price: Number(service.price),
    currency: service.currency || 'USD',
    description: service.description ?? undefined,
  }));
}

/** Public/customer list_services — rank and/or tier after category (+ optional budget) filter (rank-1.4). */
export function composePublicListServicesRankResponse(input: {
  matchedServices: PublicListServiceCatalogRow[];
  serviceRank?: ServiceRank;
  serviceTier?: ServiceTier | null;
  limit: number;
  maxPrice?: unknown;
  serviceCategory?: string | null;
  allCatalogServices?: readonly BudgetCatalogService[];
  header?: string;
}): {
  services: PublicListServiceCatalogRow[];
  summary: string;
  success: boolean;
  navigate?: ListServicesNavigateHint;
} {
  const resolved = resolveServiceDiscoveryParams({
    maxPrice: input.maxPrice,
    serviceRank: input.serviceRank,
    serviceTier: input.serviceTier,
    serviceCategory: input.serviceCategory,
    limit: input.limit,
  });
  const budgetMax = resolved.maxPrice;
  const activeMatched = filterActiveCatalogServices(input.matchedServices);
  const pool =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(activeMatched, budgetMax)
      : activeMatched;

  if (budgetMax != null && pool.length === 0) {
    return {
      services: [],
      success: true,
      summary:
        input.serviceRank === 'highest_price'
          ? buildRankPremiumNoMatchInBudgetSummary(
              input.matchedServices,
              budgetMax,
              input.serviceCategory,
            )
          : (buildBudgetListServicesNoMatchSummary(
              input.matchedServices,
              budgetMax,
            ) ?? `Nothing found under $${budgetMax}.`),
    };
  }

  const services = applyServiceDiscoveryToCatalog(pool, {
    serviceRank: input.serviceRank,
    serviceTier: input.serviceTier,
    serviceCategory: input.serviceCategory,
    limit: input.limit,
  });

  if (services.length === 0) {
    const category = input.serviceCategory?.trim();
    const catalog = input.allCatalogServices ?? input.matchedServices;
    return {
      services: [],
      success: true,
      summary:
        category && catalog.length > 0
          ? buildRankEmptyCategorySummary(category, catalog)
          : 'No matching services found in the catalog.',
    };
  }

  const header =
    input.header ??
    (input.serviceRank
      ? buildRankListServicesHeader({
          serviceRank: input.serviceRank,
          serviceCategory: input.serviceCategory,
          limit: input.limit,
        })
      : input.serviceTier
        ? buildTierFilterListServicesHeader({
            serviceTier: input.serviceTier,
            serviceCategory: input.serviceCategory,
          })
        : 'Matching services:');
  const lines = services.map(formatPublicListServiceLine);

  return {
    services,
    success: true,
    summary: [header, '', ...lines].join('\n'),
    navigate: resolveRankListServicesNavigateHint(services),
  };
}

/** Dashboard admin list_services — rank after category (+ optional budget) filter (rank-1.4). */
export function composeDashboardListServicesRankResponse(input: {
  matchedServices: DashboardListServiceCatalogRow[];
  serviceRank: ServiceRank;
  limit: number;
  maxPrice?: unknown;
  serviceCategory?: string | null;
  allCatalogServices?: readonly BudgetCatalogService[];
  header?: string;
}): {
  services: DashboardListServiceCatalogRow[];
  summary: string;
  success: boolean;
  detailsServices: ReturnType<typeof mapDashboardListServiceDetails>;
} {
  const resolved = resolveServiceDiscoveryParams({
    maxPrice: input.maxPrice,
    serviceRank: input.serviceRank,
    limit: input.limit,
  });
  const budgetMax = resolved.maxPrice;
  const activeMatched = filterActiveCatalogServices(input.matchedServices);
  const pool =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(activeMatched, budgetMax)
      : activeMatched;

  if (budgetMax != null && pool.length === 0) {
    return {
      services: [],
      success: true,
      summary:
        buildBudgetListServicesNoMatchSummary(
          input.matchedServices,
          budgetMax,
        ) ?? `Nothing found under $${budgetMax}.`,
      detailsServices: [],
    };
  }

  const services = applyServiceDiscoveryToCatalog(pool, {
    serviceRank: input.serviceRank,
    limit: input.limit,
  });

  if (services.length === 0) {
    const category = input.serviceCategory?.trim();
    const catalog = input.allCatalogServices ?? input.matchedServices;
    return {
      services: [],
      success: true,
      summary:
        category && catalog.length > 0
          ? buildRankEmptyCategorySummary(category, catalog)
          : 'No matching services found in the catalog.',
      detailsServices: [],
    };
  }

  const header =
    input.header ??
    buildRankListServicesHeader({
      serviceRank: input.serviceRank,
      serviceCategory: input.serviceCategory,
      limit: input.limit,
    });
  const lines = services.map(formatDashboardListServiceLine);

  return {
    services,
    success: true,
    summary: [header, '', ...lines].join('\n'),
    detailsServices: mapDashboardListServiceDetails(services),
  };
}
