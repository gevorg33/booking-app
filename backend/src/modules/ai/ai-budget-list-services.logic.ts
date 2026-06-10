import {
  applyBudgetFilterToMatchedServices,
  buildBudgetListServicesNoMatchSummary,
  resolveBudgetMaxPrice,
  type BudgetCatalogService,
} from './ai-budget-service-discovery.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';

export type PublicListServiceCatalogRow = BudgetCatalogService & {
  currency?: string;
};

export type ListServicesNavigateHint = {
  path: 'services';
  query: Record<string, string>;
};

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

export function formatPublicListServiceLine(
  service: PublicListServiceCatalogRow,
): string {
  const duration = service.durationMinutes ?? 0;
  const currency = service.currency ? ` ${service.currency}` : '';
  return `• ${service.name} — ${duration} min · ${service.price}${currency}`;
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

/** Dashboard admin list_services — same budget ceiling semantics as public (budget-1.9). */
export function composeDashboardListServicesBudgetResponse(input: {
  matchedServices: DashboardListServiceCatalogRow[];
  maxPrice?: unknown;
  header: string;
}): {
  services: DashboardListServiceCatalogRow[];
  summary: string;
  success: boolean;
  detailsServices: ReturnType<typeof mapDashboardListServiceDetails>;
} {
  const budgetMax = resolveBudgetMaxPrice(input.maxPrice);
  const services =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(input.matchedServices, budgetMax)
      : input.matchedServices;

  if (budgetMax != null && services.length === 0) {
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
  header: string;
}): {
  services: PublicListServiceCatalogRow[];
  summary: string;
  success: boolean;
  navigate?: ListServicesNavigateHint;
} {
  const budgetMax = resolveBudgetMaxPrice(input.maxPrice);
  const services =
    budgetMax != null
      ? applyBudgetFilterToMatchedServices(input.matchedServices, budgetMax)
      : input.matchedServices;

  if (budgetMax != null && services.length === 0) {
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

  const lines = services.map(formatPublicListServiceLine);
  return {
    services,
    success: true,
    summary: [input.header, '', ...lines].join('\n'),
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
    matched = resolveServicesFromCatalogParams(catalog, params);
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
