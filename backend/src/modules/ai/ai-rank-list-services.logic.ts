import {
  applyBudgetFilterToMatchedServices,
  buildBudgetListServicesNoMatchSummary,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import {
  formatDashboardListServiceLine,
  formatPublicListServiceLine,
  resolveListServicesNavigateHint,
  type DashboardListServiceCatalogRow,
  type ListServicesNavigateHint,
  type PublicListServiceCatalogRow,
} from './ai-budget-list-services.logic.js';
import {
  applyServiceDiscoveryToCatalog,
  resolveServiceDiscoveryParams,
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

export function buildRankListServicesHeader(input: {
  serviceRank: ServiceRank;
  serviceCategory?: string | null;
  limit: number;
}): string {
  const category = input.serviceCategory?.trim();
  const categorySuffix = category ? ` ${category}` : '';

  if (input.limit === 1) {
    if (input.serviceRank === 'highest_price') {
      return category
        ? `Our top${categorySuffix} option:`
        : 'Our top option:';
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

/** Public/customer list_services — rank after category (+ optional budget) filter (rank-1.4). */
export function composePublicListServicesRankResponse(input: {
  matchedServices: PublicListServiceCatalogRow[];
  serviceRank: ServiceRank;
  limit: number;
  maxPrice?: unknown;
  serviceCategory?: string | null;
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
    limit: input.limit,
  });
  const budgetMax = resolved.maxPrice;
  const pool =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(input.matchedServices, budgetMax)
      : input.matchedServices;

  if (budgetMax != null && pool.length === 0) {
    return {
      services: [],
      success: true,
      summary:
        buildBudgetListServicesNoMatchSummary(
          input.matchedServices,
          budgetMax,
        ) ?? `Nothing found under $${budgetMax}.`,
    };
  }

  const services = applyServiceDiscoveryToCatalog(pool, {
    serviceRank: input.serviceRank,
    limit: input.limit,
  });

  if (services.length === 0) {
    return {
      services: [],
      success: true,
      summary: 'No matching services found in the catalog.',
    };
  }

  const header =
    input.header ??
    buildRankListServicesHeader({
      serviceRank: input.serviceRank,
      serviceCategory: input.serviceCategory,
      limit: input.limit,
    });
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
  const pool =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(input.matchedServices, budgetMax)
      : input.matchedServices;

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
    return {
      services: [],
      success: true,
      summary: 'No matching services found in the catalog.',
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
