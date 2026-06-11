/** Dashboard lookup_service_assignment budget/rank filters (ai-cmd-ext-1.5). */

import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  applyServiceDiscoveryToCatalog,
  type ServiceCatalogPriceEntry,
} from './ai-service-catalog-rank.util.js';
import { buildBudgetListServicesNoMatchSummary } from './ai-budget-service-discovery.util.js';
import { resolveServiceRankParam } from './ai-service-rank-discovery.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';

export type LookupAssignmentCatalogService = ServiceCatalogPriceEntry & {
  id: string;
  name: string;
};

export function enrichDashboardLookupAssignmentParams(
  params: Record<string, unknown>,
  prompt?: string,
): Record<string, unknown> {
  return enrichDiscoveryParamsFromPrompt(params, prompt);
}

export function resolveLookupAssignmentService<T extends LookupAssignmentCatalogService>(
  catalog: readonly T[],
  params: Record<string, unknown>,
  resolveByName: (name: string) => T | undefined,
): { service: T | null; noMatchSummary: string | null } {
  const serviceName = params.serviceName as string | undefined;
  const serviceRank = resolveServiceRankParam(params.serviceRank);
  const hasDiscovery =
    serviceRank != null ||
    params.maxPrice != null ||
    (!!params.serviceCategory && !serviceName);

  if (!hasDiscovery) {
    if (!serviceName) {
      return { service: null, noMatchSummary: 'Which service should I look up?' };
    }
    const direct = resolveByName(serviceName);
    return {
      service: direct ?? null,
      noMatchSummary: direct ? null : `No service found matching "${serviceName}".`,
    };
  }

  let pool: T[] = [...catalog];
  if (serviceName) {
    const direct = resolveByName(serviceName);
    if (direct) {
      pool = [direct];
    } else {
      pool = resolveServicesFromCatalogParams([...catalog], params) as T[];
    }
  }

  const discovered = applyServiceDiscoveryToCatalog(pool, {
    ...params,
    limit: 1,
  });

  if (discovered.length === 0) {
    const maxPrice = typeof params.maxPrice === 'number' ? params.maxPrice : null;
    return {
      service: null,
      noMatchSummary:
        maxPrice != null
          ? (buildBudgetListServicesNoMatchSummary(pool, maxPrice) ??
            `Nothing found under $${maxPrice}.`)
          : 'No matching services for that budget or rank filter.',
    };
  }

  return { service: discovered[0] as T, noMatchSummary: null };
}

export function formatLookupAssignmentDiscoveryNote(
  params: Record<string, unknown>,
  serviceName: string,
): string | null {
  const rank = resolveServiceRankParam(params.serviceRank);
  const maxPrice = typeof params.maxPrice === 'number' ? params.maxPrice : null;
  if (!rank && maxPrice == null) return null;

  const parts: string[] = [];
  if (maxPrice != null) parts.push(`under $${maxPrice}`);
  if (rank === 'highest_price') parts.push('premium pick');
  if (rank === 'lowest_price') parts.push('cheapest pick');
  if (rank === 'most_popular') parts.push('most popular pick');
  return `(filtered ${parts.join(', ')} → ${serviceName})`;
}
