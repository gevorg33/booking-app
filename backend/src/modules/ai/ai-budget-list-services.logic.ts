import {
  applyBudgetFilterToMatchedServices,
  buildBudgetListServicesNoMatchSummary,
  resolveBudgetMaxPrice,
  resolveBudgetMinPrice,
  resolveBudgetPreferShortDuration,
  resolveBudgetMinDurationMinutes,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import {
  applyServiceDiscoveryToCatalog,
  sortServicesByPriceAsc,
} from './ai-service-catalog-rank.util.js';
import { resolveServiceRankParam } from './ai-service-rank-discovery.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';

export type PublicListServiceCatalogRow = BudgetCatalogService & {
  currency?: string;
};

export type ListServicesNavigateHint = {
  path: 'services';
  query: Record<string, string>;
};

export function findAffordableServiceCombos<T extends BudgetCatalogService>(
  services: readonly T[],
  maxTotalPrice: number,
  serviceCount: number,
): T[][] {
  if (serviceCount < 2 || services.length < serviceCount) return [];

  const combos: T[][] = [];

  function collect(startIndex: number, picked: T[], sum: number): void {
    if (picked.length === serviceCount) {
      if (sum <= maxTotalPrice) combos.push([...picked]);
      return;
    }
    for (let index = startIndex; index < services.length; index++) {
      const service = services[index]!;
      const nextSum = sum + (service.price ?? 0);
      if (nextSum > maxTotalPrice) continue;
      picked.push(service);
      collect(index + 1, picked, nextSum);
      picked.pop();
    }
  }

  collect(0, [], 0);
  return combos.sort(
    (left, right) =>
      left.reduce((total, service) => total + (service.price ?? 0), 0) -
      right.reduce((total, service) => total + (service.price ?? 0), 0),
  );
}

export function formatCartTotalComboLine(
  combo: ReadonlyArray<BudgetCatalogService & { currency?: string }>,
): string {
  const total = combo.reduce((sum, service) => sum + (service.price ?? 0), 0);
  const currency = combo[0]?.currency ? ` ${combo[0].currency}` : '';
  const names = combo.map((service) => service.name).join(' + ');
  return `• ${names} — $${total}${currency} total`;
}

export function buildBudgetCartTotalNoMatchSummary(
  services: readonly BudgetCatalogService[],
  maxTotalPrice: number,
  serviceCount: number,
): string {
  const combos = findAffordableServiceCombos(
    sortServicesByPriceAsc([...services]),
    Number.MAX_SAFE_INTEGER,
    serviceCount,
  );
  const cheapest = combos[0];
  if (!cheapest) {
    return `Nothing found for ${serviceCount} services under $${maxTotalPrice} total.`;
  }
  const cheapestTotal = cheapest.reduce(
    (sum, service) => sum + (service.price ?? 0),
    0,
  );
  const names = cheapest.map((service) => service.name).join(' + ');
  return `Nothing under $${maxTotalPrice} total for ${serviceCount} services. Closest combo: ${names} ($${cheapestTotal}).`;
}

export function resolveListServicesNavigateHint(
  services: ReadonlyArray<{ id: string }>,
): ListServicesNavigateHint | undefined {
  if (services.length === 1) {
    return { path: 'services', query: { serviceId: services[0]!.id } };
  }
  if (services.length > 1) {
    return { path: 'services', query: {} };
  }
  return undefined;
}

export function formatCatalogServicePriceLabel(
  price: number | null | undefined,
  currency?: string | null,
): string {
  if (price == null || !Number.isFinite(Number(price))) {
    return 'price on request';
  }
  const suffix = currency ? ` ${currency}` : '';
  return `${price}${suffix}`;
}

export function buildBudgetRangeHighestInRangeNote(
  services: readonly BudgetCatalogService[],
  maxPrice: number,
): string | null {
  if (services.length === 0) return null;

  let highest: BudgetCatalogService | null = null;
  let highestPrice = Number.NEGATIVE_INFINITY;
  for (const service of services) {
    const price = Number(service.price);
    if (!Number.isFinite(price) || price > maxPrice) continue;
    if (price > highestPrice) {
      highestPrice = price;
      highest = service;
    }
  }

  if (!highest) return null;
  return `Highest in your $${maxPrice} range: ${highest.name} at $${highestPrice}.`;
}

export function buildRankPremiumNoMatchInBudgetSummary(
  catalog: readonly BudgetCatalogService[],
  maxPrice: number,
  serviceCategory?: string | null,
): string {
  const closest = buildBudgetListServicesNoMatchSummary(catalog, maxPrice);
  const category = serviceCategory?.trim();
  const lead = category
    ? `No premium ${category} under $${maxPrice}.`
    : `No premium options under $${maxPrice}.`;
  if (!closest) return lead;

  const optionsIndex = closest.indexOf('Closest options:');
  if (optionsIndex === -1) {
    return `${lead}\n\n${closest}`;
  }
  return `${lead}\n\n${closest.slice(optionsIndex)}`;
}

export function formatPublicListServiceLine(
  service: PublicListServiceCatalogRow,
): string {
  const duration = service.durationMinutes ?? 0;
  const priceLabel = formatCatalogServicePriceLabel(
    service.price,
    service.currency,
  );
  return `• ${service.name} — ${duration} min · ${priceLabel}`;
}

export type DashboardListServiceCatalogRow = BudgetCatalogService & {
  currency?: string;
  bufferMinutes?: number;
  description?: string | null;
};

export function formatDashboardListServiceLine(
  service: DashboardListServiceCatalogRow,
): string {
  const currency = service.currency || 'USD';
  if (service.price == null || !Number.isFinite(Number(service.price))) {
    const buffer = service.bufferMinutes
      ? ` (+${service.bufferMinutes} min buffer)`
      : '';
    return `• ${service.name} — ${service.durationMinutes ?? 0} min${buffer} · price on request`;
  }
  const price = Number(service.price).toFixed(2);
  const buffer = service.bufferMinutes
    ? ` (+${service.bufferMinutes} min buffer)`
    : '';
  return `• ${service.name} — ${service.durationMinutes ?? 0} min${buffer} · ${currency} ${price}`;
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

function composeCartTotalListServicesResponse<
  T extends BudgetCatalogService & { currency?: string },
>(input: {
  matchedServices: readonly T[];
  maxTotalPrice: number;
  serviceCount: number;
  header: string;
}): {
  services: T[];
  summary: string;
  success: boolean;
  combos: T[][];
} {
  const combos = findAffordableServiceCombos(
    input.matchedServices,
    input.maxTotalPrice,
    input.serviceCount,
  );

  if (combos.length === 0) {
    return {
      services: [],
      combos: [],
      success: true,
      summary: [
        input.header,
        '',
        buildBudgetCartTotalNoMatchSummary(
          input.matchedServices,
          input.maxTotalPrice,
          input.serviceCount,
        ),
      ].join('\n'),
    };
  }

  const lines = combos.map((combo) => formatCartTotalComboLine(combo));
  const services = [
    ...new Map(
      combos.flat().map((service) => [service.id, service] as const),
    ).values(),
  ];

  return {
    services,
    combos,
    success: true,
    summary: [input.header, '', ...lines].join('\n'),
  };
}

/** Dashboard admin list_services — same budget ceiling semantics as public (budget-1.9). */
export function composeDashboardListServicesBudgetResponse(input: {
  matchedServices: DashboardListServiceCatalogRow[];
  maxPrice?: unknown;
  minPrice?: unknown;
  preferShortDuration?: unknown;
  minDurationMinutes?: unknown;
  maxTotalPrice?: unknown;
  serviceCount?: unknown;
  header: string;
}): {
  services: DashboardListServiceCatalogRow[];
  summary: string;
  success: boolean;
  detailsServices: ReturnType<typeof mapDashboardListServiceDetails>;
} {
  const cartTotal = resolveBudgetMaxPrice(input.maxTotalPrice);
  const serviceCount =
    typeof input.serviceCount === 'number' && input.serviceCount >= 2
      ? input.serviceCount
      : null;
  if (cartTotal != null && serviceCount != null) {
    const composed = composeCartTotalListServicesResponse({
      matchedServices: input.matchedServices,
      maxTotalPrice: cartTotal,
      serviceCount,
      header: input.header,
    });
    return {
      services: composed.services,
      success: composed.success,
      summary: composed.summary,
      detailsServices: mapDashboardListServiceDetails(composed.services),
    };
  }

  const budgetMax = resolveBudgetMaxPrice(input.maxPrice);
  const budgetMin = resolveBudgetMinPrice(input.minPrice);
  const durationMin = resolveBudgetMinDurationMinutes(input.minDurationMinutes);
  const services =
    budgetMax != null || budgetMin != null || durationMin != null
      ? applyBudgetFilterToMatchedServices(
          input.matchedServices,
          input.maxPrice,
          input.minPrice,
          input.preferShortDuration,
          input.minDurationMinutes,
        )
      : input.matchedServices;

  if (
    (budgetMax != null || budgetMin != null || durationMin != null) &&
    services.length === 0
  ) {
    return {
      services: [],
      success: true,
      summary:
        budgetMax != null
          ? buildBudgetListServicesNoMatchSummary(
              input.matchedServices,
              budgetMax,
            ) ?? `Nothing found under $${budgetMax}.`
          : `Nothing found in the $${budgetMin}–$${budgetMax ?? '∞'} range.`,
      detailsServices: [],
    };
  }

  const lines = services.map(formatDashboardListServiceLine);
  return {
    services,
    success: true,
    summary: [input.header, '', ...lines].join('\n'),
    detailsServices: mapDashboardListServiceDetails(services),
  };
}

export function composePublicListServicesBudgetResponse(input: {
  matchedServices: PublicListServiceCatalogRow[];
  maxPrice?: unknown;
  minPrice?: unknown;
  preferShortDuration?: unknown;
  minDurationMinutes?: unknown;
  maxTotalPrice?: unknown;
  serviceCount?: unknown;
  valueOrPremiumBrowse?: boolean;
  header: string;
}): {
  services: PublicListServiceCatalogRow[];
  summary: string;
  success: boolean;
  navigate?: ListServicesNavigateHint;
} {
  const cartTotal = resolveBudgetMaxPrice(input.maxTotalPrice);
  const serviceCount =
    typeof input.serviceCount === 'number' && input.serviceCount >= 2
      ? input.serviceCount
      : null;
  if (cartTotal != null && serviceCount != null) {
    const composed = composeCartTotalListServicesResponse({
      matchedServices: input.matchedServices,
      maxTotalPrice: cartTotal,
      serviceCount,
      header: input.header,
    });
    return {
      services: composed.services,
      success: composed.success,
      summary: composed.summary,
      navigate: resolveListServicesNavigateHint(composed.services),
    };
  }

  const budgetMax = resolveBudgetMaxPrice(input.maxPrice);
  const budgetMin = resolveBudgetMinPrice(input.minPrice);
  const durationMin = resolveBudgetMinDurationMinutes(input.minDurationMinutes);
  const services =
    budgetMax != null || budgetMin != null || durationMin != null
      ? applyBudgetFilterToMatchedServices(
          input.matchedServices,
          input.maxPrice,
          input.minPrice,
          input.preferShortDuration,
          input.minDurationMinutes,
        )
      : input.matchedServices;

  if (
    (budgetMax != null || budgetMin != null || durationMin != null) &&
    services.length === 0
  ) {
    return {
      services: [],
      success: true,
      summary:
        budgetMax != null
          ? buildBudgetListServicesNoMatchSummary(
              input.matchedServices,
              budgetMax,
            ) ?? `Nothing found under $${budgetMax}.`
          : `Nothing found in the $${budgetMin}–$${budgetMax ?? '∞'} range.`,
    };
  }

  const lines = services.map(formatPublicListServiceLine);
  let summary = [input.header, '', ...lines].join('\n');
  if (input.valueOrPremiumBrowse && budgetMax != null && services.length > 0) {
    const highestNote = buildBudgetRangeHighestInRangeNote(services, budgetMax);
    if (highestNote) {
      summary = `${summary}\n\n${highestNote}`;
    }
  }
  return {
    services,
    success: true,
    summary,
    navigate: resolveListServicesNavigateHint(services),
  };
}

/** Pick the bookable service under an optional budget ceiling (cheapest when multiple). */
export function resolveBudgetConstrainedService<
  T extends BudgetCatalogService,
>(
  catalog: readonly T[],
  params: {
    serviceId?: string | null;
    serviceName?: string | null;
    serviceCategory?: string | null;
    maxPrice?: unknown;
  },
): { service: T | null; noMatchSummary: string | null } {
  let matched: T[] = [...catalog];
  if (params.serviceId) {
    matched = catalog.filter((service) => service.id === params.serviceId);
  } else if (params.serviceName || params.serviceCategory) {
    matched = resolveServicesFromCatalogParams([...catalog], params);
  }

  const budgetMax = resolveBudgetMaxPrice(params.maxPrice);
  if (budgetMax == null) {
    if (matched.length === 1) return { service: matched[0] ?? null, noMatchSummary: null };
    if (params.serviceName) {
      const needle = params.serviceName.toLowerCase();
      const byName = matched.find((service) =>
        service.name.toLowerCase().includes(needle),
      );
      return { service: byName ?? matched[0] ?? null, noMatchSummary: null };
    }
    return { service: matched[0] ?? null, noMatchSummary: null };
  }

  const filtered = applyBudgetFilterToMatchedServices(matched, budgetMax);
  if (filtered.length === 0) {
    return {
      service: null,
      noMatchSummary:
        buildBudgetListServicesNoMatchSummary(matched, budgetMax) ??
        `Nothing found under $${budgetMax}.`,
    };
  }

  return { service: filtered[0] ?? null, noMatchSummary: null };
}

/** Rank/budget/category discovery pick for book + availability handlers (discover section C). */
export function resolveDiscoverConstrainedService<
  T extends BudgetCatalogService,
>(
  catalog: readonly T[],
  params: Record<string, unknown>,
  resolveByName?: (name: string) => T | undefined,
): { service: T | null; noMatchSummary: string | null } {
  if (params.serviceId) {
    return resolveBudgetConstrainedService(catalog, {
      serviceId: String(params.serviceId),
      maxPrice: params.maxPrice,
    });
  }

  const serviceRank = resolveServiceRankParam(params.serviceRank);
  const hasDiscovery =
    serviceRank != null ||
    params.maxPrice != null ||
    (!!params.serviceCategory && !params.serviceName);

  if (hasDiscovery) {
    const discovered = applyServiceDiscoveryToCatalog(catalog, {
      ...params,
      limit: 1,
    });
    if (discovered.length === 0) {
      const maxPrice =
        typeof params.maxPrice === 'number' ? params.maxPrice : null;
      return {
        service: null,
        noMatchSummary:
          maxPrice != null
            ? (buildBudgetListServicesNoMatchSummary(catalog, maxPrice) ??
              `Nothing found under $${maxPrice}.`)
            : 'No matching services found for your budget or rank filter.',
      };
    }

    if (params.serviceName && resolveByName) {
      const named = resolveByName(String(params.serviceName));
      if (named && discovered.some((entry) => entry.id === named.id)) {
        return resolveBudgetConstrainedService(catalog, {
          serviceId: named.id,
          serviceName: named.name,
          maxPrice: params.maxPrice,
        });
      }
    }

    return { service: discovered[0] as T, noMatchSummary: null };
  }

  if (params.serviceName) {
    return resolveBudgetConstrainedService(catalog, {
      serviceName: String(params.serviceName),
      serviceCategory: params.serviceCategory as string | undefined,
      maxPrice: params.maxPrice,
    });
  }

  return { service: null, noMatchSummary: null };
}

/** Budget filter for recommend_specialists — same ceiling semantics as list_services. */
export function applyBudgetFilterForRecommendSpecialists<
  T extends BudgetCatalogService,
>(matchedServices: readonly T[], maxPrice: unknown): {
  services: T[];
  noMatchSummary: string | null;
} {
  const budgetMax = resolveBudgetMaxPrice(maxPrice);
  if (budgetMax == null) {
    return { services: [...matchedServices], noMatchSummary: null };
  }

  const services = applyBudgetFilterToMatchedServices(matchedServices, budgetMax);
  if (services.length > 0) {
    return { services, noMatchSummary: null };
  }

  return {
    services: [],
    noMatchSummary:
      buildBudgetListServicesNoMatchSummary(matchedServices, budgetMax) ??
      `Nothing found under $${budgetMax}.`,
  };
}
