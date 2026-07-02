/** Shared service catalog price filter + sort helpers (budget-1.1, rank-1.1, discover-1.1). */

import type { ServiceTier } from '../../common/utils/service-rank-metadata.util.js';

export type ServiceRank = 'highest_price' | 'lowest_price' | 'most_popular';

export type ServiceCatalogPriceEntry = {
  id?: string;
  name?: string;
  price: number | null | undefined;
  durationMinutes?: number | null;
  serviceCategory?: string | null;
  /** Catalog rows with isActive=false are excluded before rank pick (rank-inactive-excluded). */
  isActive?: boolean | null;
  /** Phase 2 popularity signal for `most_popular` rank (rank-1.9). */
  bookingCount?: number | null;
  /** Phase 2 catalog rank metadata (rank-1.8). */
  isFeatured?: boolean | null;
  serviceTier?: ServiceTier | null;
};

export type PickRankedServicesOptions = {
  serviceRank?: ServiceRank | null;
  serviceCategory?: string | null;
  serviceTier?: ServiceTier | null;
  limit?: number | null;
};

/** Normalized budget + rank params after classifier/rescue enrichment (discover-1.1). */
export type ServiceDiscoveryParams = {
  maxPrice: number | null;
  serviceRank: ServiceRank | null;
  serviceCategory: string | null;
  serviceTier: ServiceTier | null;
  limit: number | null;
  hasBudget: boolean;
  hasRank: boolean;
  hasTier: boolean;
};

export function resolveServiceCatalogPrice(
  price: number | null | undefined,
): number | null {
  if (price == null) return null;
  const numeric = Number(price);
  return Number.isFinite(numeric) ? numeric : null;
}

export function isValidMaxPrice(maxPrice: unknown): maxPrice is number {
  return (
    typeof maxPrice === 'number' && Number.isFinite(maxPrice) && maxPrice >= 0
  );
}

/** Keep services with a known display price <= maxPrice (inclusive ceiling). */
/** Exclude inactive catalog rows before budget/rank discovery (rank-inactive-excluded). */
export function filterActiveCatalogServices<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
): T[] {
  return services.filter((service) => service.isActive !== false);
}

export function filterServicesByMaxPrice<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
  maxPrice: number,
): T[] {
  if (!isValidMaxPrice(maxPrice)) {
    return [...services];
  }

  return services.filter((service) => {
    const price = resolveServiceCatalogPrice(service.price);
    return price != null && price <= maxPrice;
  });
}

/** Keep services with known duration >= minDurationMinutes (budget-long-massage-en). */
export function filterServicesByMinDuration<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
  minDurationMinutes: number,
): T[] {
  if (!Number.isFinite(minDurationMinutes) || minDurationMinutes <= 0) {
    return [...services];
  }

  return services.filter(
    (service) =>
      typeof service.durationMinutes === 'number' &&
      service.durationMinutes >= minDurationMinutes,
  );
}

/** Keep services with a known display price >= minPrice (inclusive floor). */
export function filterServicesByMinPrice<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
  minPrice: number,
): T[] {
  if (!isValidMaxPrice(minPrice)) {
    return [...services];
  }

  return services.filter((service) => {
    const price = resolveServiceCatalogPrice(service.price);
    return price != null && price >= minPrice;
  });
}

function compareServiceCatalogPrices(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftPrice = resolveServiceCatalogPrice(left.price);
  const rightPrice = resolveServiceCatalogPrice(right.price);

  if (leftPrice == null && rightPrice == null) {
    return compareServiceCatalogTieBreak(left, right);
  }
  if (leftPrice == null) return 1;
  if (rightPrice == null) return -1;
  if (leftPrice !== rightPrice) return leftPrice - rightPrice;
  return compareServiceCatalogTieBreak(left, right);
}

function compareServiceCatalogTieBreak(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftDuration = left.durationMinutes ?? 0;
  const rightDuration = right.durationMinutes ?? 0;
  if (leftDuration !== rightDuration) {
    return rightDuration - leftDuration;
  }
  const nameCompare = (left.name ?? '').localeCompare(right.name ?? '');
  if (nameCompare !== 0) return nameCompare;
  return (left.id ?? '').localeCompare(right.id ?? '');
}

function serviceTierSortScore(
  tier: ServiceTier | null | undefined,
  mode: 'highest' | 'lowest',
): number {
  if (tier === 'premium') return mode === 'highest' ? 2 : 0;
  if (tier === 'standard') return mode === 'highest' ? 1 : 2;
  return mode === 'highest' ? 0 : 1;
}

function compareServiceTierForRank(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
  mode: 'highest' | 'lowest',
): number {
  const leftScore = serviceTierSortScore(left.serviceTier, mode);
  const rightScore = serviceTierSortScore(right.serviceTier, mode);
  if (leftScore === rightScore) return 0;
  return rightScore - leftScore;
}

function compareFeaturedForHighestRank(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftFeatured = left.isFeatured === true ? 1 : 0;
  const rightFeatured = right.isFeatured === true ? 1 : 0;
  if (leftFeatured === rightFeatured) return 0;
  return rightFeatured - leftFeatured;
}

function compareFeaturedForLowestRank(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftFeatured = left.isFeatured === true ? 1 : 0;
  const rightFeatured = right.isFeatured === true ? 1 : 0;
  if (leftFeatured === rightFeatured) return 0;
  return leftFeatured - rightFeatured;
}

function compareRankedHighestPrice(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const featured = compareFeaturedForHighestRank(left, right);
  if (featured !== 0) return featured;

  const tier = compareServiceTierForRank(left, right, 'highest');
  if (tier !== 0) return tier;

  return compareServiceCatalogPricesDesc(left, right);
}

function compareRankedLowestPrice(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const tier = compareServiceTierForRank(left, right, 'lowest');
  if (tier !== 0) return tier;

  const featured = compareFeaturedForLowestRank(left, right);
  if (featured !== 0) return featured;

  return compareServiceCatalogPrices(left, right);
}

function compareServiceCatalogPricesDesc(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftPrice = resolveServiceCatalogPrice(left.price);
  const rightPrice = resolveServiceCatalogPrice(right.price);

  if (leftPrice == null && rightPrice == null) {
    return compareServiceCatalogTieBreak(left, right);
  }
  if (leftPrice == null) return 1;
  if (rightPrice == null) return -1;
  if (leftPrice !== rightPrice) return rightPrice - leftPrice;
  return compareServiceCatalogTieBreak(left, right);
}

function compareServiceCatalogPopularity(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftCount = left.bookingCount ?? 0;
  const rightCount = right.bookingCount ?? 0;
  if (leftCount !== rightCount) return rightCount - leftCount;
  return compareServiceCatalogTieBreak(left, right);
}

export function filterServicesByTier<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
  serviceTier: ServiceTier,
): T[] {
  return services.filter((service) => service.serviceTier === serviceTier);
}

function filterServicesByCategory<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
  serviceCategory: string | null | undefined,
): T[] {
  if (!serviceCategory?.trim()) return [...services];
  const needle = serviceCategory.trim().toLowerCase();
  return services.filter(
    (service) =>
      (service.serviceCategory ?? '').toLowerCase().includes(needle) ||
      (service.name ?? '').toLowerCase().includes(needle),
  );
}

export function resolveServiceDiscoveryLimit(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return parseInt(value.trim(), 10);
  }
  return null;
}

/** Normalize budget + rank classifier params for shared discovery handlers (discover-1.1). */
export function resolveServiceDiscoveryParams(
  params: Record<string, unknown>,
): ServiceDiscoveryParams {
  const maxPrice = isValidMaxPrice(params.maxPrice) ? params.maxPrice : null;
  const serviceRank = isValidServiceRank(params.serviceRank)
    ? params.serviceRank
    : null;
  const rawCategory = params.serviceCategory;
  const serviceCategory =
    typeof rawCategory === 'string' && rawCategory.trim()
      ? rawCategory.trim()
      : null;
  const serviceTier =
    params.serviceTier === 'standard' || params.serviceTier === 'premium'
      ? params.serviceTier
      : null;

  return {
    maxPrice,
    serviceRank,
    serviceCategory,
    serviceTier,
    limit: resolveServiceDiscoveryLimit(params.limit),
    hasBudget: maxPrice != null,
    hasRank: serviceRank != null,
    hasTier: serviceTier != null,
  };
}

/** Budget + rank intersection on catalog — category → ceiling → rank/limit (discover-1.1). */
export function applyServiceDiscoveryToCatalog<
  T extends ServiceCatalogPriceEntry,
>(catalog: readonly T[], params: Record<string, unknown>): T[] {
  const resolved = resolveServiceDiscoveryParams(params);

  if (resolved.hasRank) {
    let budgetScoped =
      resolved.hasBudget && resolved.maxPrice != null
        ? filterServicesByMaxPrice(catalog, resolved.maxPrice)
        : catalog;
    if (resolved.hasTier && resolved.serviceTier) {
      budgetScoped = filterServicesByTier(budgetScoped, resolved.serviceTier);
    }
    return pickRankedServices(budgetScoped, {
      serviceCategory: resolved.serviceCategory,
      serviceRank: resolved.serviceRank,
      serviceTier: resolved.serviceTier,
      limit: resolved.limit,
    });
  }

  let categorized = filterServicesByCategory(catalog, resolved.serviceCategory);
  if (resolved.hasTier && resolved.serviceTier) {
    categorized = filterServicesByTier(categorized, resolved.serviceTier);
  }
  if (resolved.hasBudget && resolved.maxPrice != null) {
    const budgetMatches = sortServicesByPriceAsc(
      filterServicesByMaxPrice(categorized, resolved.maxPrice),
    );
    return applyRankLimit(budgetMatches, resolved.limit);
  }

  return applyRankLimit(categorized, resolved.limit);
}

function applyRankLimit<T>(
  services: readonly T[],
  limit: number | null | undefined,
): T[] {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) {
    return [...services];
  }
  return services.slice(0, Math.floor(limit));
}

export function isValidServiceRank(value: unknown): value is ServiceRank {
  return (
    value === 'highest_price' ||
    value === 'lowest_price' ||
    value === 'most_popular'
  );
}

/** Ascending by display price; tier/featured metadata first when set (rank-1.8). */
function compareServiceCatalogDurationAsc(
  left: ServiceCatalogPriceEntry,
  right: ServiceCatalogPriceEntry,
): number {
  const leftDuration = left.durationMinutes ?? Number.MAX_SAFE_INTEGER;
  const rightDuration = right.durationMinutes ?? Number.MAX_SAFE_INTEGER;
  if (leftDuration !== rightDuration) return leftDuration - rightDuration;
  return compareServiceCatalogPrices(left, right);
}

/** Ascending duration (shortest first); unknown duration last; price asc tie-break (budget-short-service-en). */
export function sortServicesByDurationAsc<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
): T[] {
  return [...services].sort(compareServiceCatalogDurationAsc);
}

export function sortServicesByPriceAsc<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
): T[] {
  return [...services].sort(compareRankedLowestPrice);
}

/** Descending by display price; featured/tier metadata first when set (rank-1.8). */
export function sortServicesByPriceDesc<T extends ServiceCatalogPriceEntry>(
  services: readonly T[],
): T[] {
  return [...services].sort(compareRankedHighestPrice);
}

/** Descending by booking count; tie-break duration desc, then name, then id (rank-1.9). */
export function sortServicesByPopularityDesc<
  T extends ServiceCatalogPriceEntry,
>(services: readonly T[]): T[] {
  return [...services].sort(compareServiceCatalogPopularity);
}

/** Filter by category, rank, and return the top N matches (rank-1.1). */
export function pickRankedServices<T extends ServiceCatalogPriceEntry>(
  catalog: readonly T[],
  options: PickRankedServicesOptions = {},
): T[] {
  let filtered = filterServicesByCategory(catalog, options.serviceCategory);
  if (options.serviceTier) {
    filtered = filterServicesByTier(filtered, options.serviceTier);
  }
  if (filtered.length === 0) return [];

  if (!options.serviceRank || !isValidServiceRank(options.serviceRank)) {
    return applyRankLimit(filtered, options.limit);
  }

  const priced = filtered.filter(
    (service) => resolveServiceCatalogPrice(service.price) != null,
  );
  if (priced.length === 0) return [];

  const ranked =
    options.serviceRank === 'highest_price'
      ? sortServicesByPriceDesc(priced)
      : options.serviceRank === 'lowest_price'
        ? sortServicesByPriceAsc(filtered)
        : sortServicesByPopularityDesc(filtered);

  return applyRankLimit(ranked, options.limit);
}
