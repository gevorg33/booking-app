import type { Repository } from 'typeorm';
import type {
  EntityFinder,
  EntityReader,
} from './ai-logic-repo.types.js';
import type { EventStoreService } from '../../events/store/event-store.service.js';
import type { InventoryService } from '../inventory/inventory.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { formatRecommendationSurfaceLabel } from './ai-recommendation-analytics.util.js';
import {
  aggregateRecommendationPerformanceEvents,
  formatCtrPercent,
  formatPerformanceProductRows,
  formatPerformanceServiceRows,
  parseSummarizeRecommendationPerformanceFromPrompt,
  type ParsedSummarizeRecommendationPerformance,
  type RecommendationPerformanceAspect,
  type RecommendationPerformanceSummary,
} from './ai-recommendation-performance.util.js';

export interface SummarizeRecommendationPerformanceLogicDeps {
  businessRepo: EntityReader<Business>;
  eventStore: Pick<EventStoreService, 'getEvents'>;
  inventoryService: Pick<InventoryService, 'listProducts'>;
  serviceRepo: EntityFinder<Service>;
}

const DEFAULT_DAYS_AHEAD = 30;

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolvePeriodDays(
  parsed: ParsedSummarizeRecommendationPerformance,
): number {
  return parsed.daysAhead ?? DEFAULT_DAYS_AHEAD;
}

function attachProductNames(
  stats: RecommendationPerformanceSummary,
  productNameById: Map<string, string>,
): RecommendationPerformanceSummary {
  const withNames = <T extends { productId: string; productName?: string }>(
    rows: T[],
  ) =>
    rows.map((row) => ({
      ...row,
      productName: productNameById.get(row.productId) ?? row.productId,
    }));

  return {
    ...stats,
    byProduct: withNames(stats.byProduct),
    topProductsByCtr: withNames(stats.topProductsByCtr),
  };
}

function attachServiceNames(
  stats: RecommendationPerformanceSummary,
  serviceNameById: Map<string, string>,
): RecommendationPerformanceSummary {
  const withNames = <T extends { serviceId: string; serviceName?: string }>(
    rows: T[],
  ) =>
    rows.map((row) => ({
      ...row,
      serviceName: serviceNameById.get(row.serviceId) ?? row.serviceId,
    }));

  return {
    ...stats,
    byService: withNames(stats.byService),
    topServicesByCtr: withNames(stats.topServicesByCtr),
  };
}

function buildCtrSummary(
  stats: RecommendationPerformanceSummary,
  periodDays: number,
  surface?: string,
): string {
  const surfaceLabel = surface
    ? formatRecommendationSurfaceLabel(surface)
    : 'all surfaces';
  if (stats.totalImpressions === 0) {
    return `No checkout recommendation impressions were recorded in the last ${periodDays} days on ${surfaceLabel}.`;
  }
  return `Over the last ${periodDays} days on ${surfaceLabel}, checkout recommendations had an overall CTR of ${formatCtrPercent(stats.overallCtr)} (${stats.totalClicks} clicks / ${stats.totalImpressions} impressions).`;
}

function buildByProductSummary(
  stats: RecommendationPerformanceSummary,
  periodDays: number,
): string {
  const rows =
    stats.topProductsByCtr.length > 0
      ? formatPerformanceProductRows(stats.topProductsByCtr)
      : formatPerformanceProductRows(stats.byProduct);
  return `Checkout recommendation CTR by product in the last ${periodDays} days: ${rows}.`;
}

function buildByServiceSummary(
  stats: RecommendationPerformanceSummary,
  periodDays: number,
): string {
  const rows =
    stats.topServicesByCtr.length > 0
      ? formatPerformanceServiceRows(stats.topServicesByCtr)
      : formatPerformanceServiceRows(stats.byService);
  return `Checkout recommendation CTR by booked service in the last ${periodDays} days: ${rows}.`;
}

function buildBookingsSummary(
  stats: RecommendationPerformanceSummary,
  periodDays: number,
  surface?: string,
): string {
  const surfaceLabel = surface
    ? formatRecommendationSurfaceLabel(surface)
    : 'all surfaces';
  return `In the last ${periodDays} days on ${surfaceLabel}, ${stats.bookingsWithRecommendationsShown} booking(s) had checkout recommendation cards shown (product_recommendation.shown with bookingId).`;
}

function buildAllSummary(
  stats: RecommendationPerformanceSummary,
  periodDays: number,
  surface?: string,
): string {
  const ctr = buildCtrSummary(stats, periodDays, surface);
  const bookings = buildBookingsSummary(stats, periodDays, surface);
  const products = buildByProductSummary(stats, periodDays);
  const services = buildByServiceSummary(stats, periodDays);
  return `${ctr} ${bookings} Top product CTR: ${formatPerformanceProductRows(stats.topProductsByCtr)}. Top service CTR: ${formatPerformanceServiceRows(stats.topServicesByCtr)}. ${products} ${services}`.trim();
}

function buildAspectSummary(
  aspect: RecommendationPerformanceAspect,
  stats: RecommendationPerformanceSummary,
  periodDays: number,
  surface?: string,
): string {
  if (aspect === 'ctr') return buildCtrSummary(stats, periodDays, surface);
  if (aspect === 'byProduct') return buildByProductSummary(stats, periodDays);
  if (aspect === 'byService') return buildByServiceSummary(stats, periodDays);
  if (aspect === 'bookings') {
    return buildBookingsSummary(stats, periodDays, surface);
  }
  return buildAllSummary(stats, periodDays, surface);
}

export async function handleSummarizeRecommendationPerformanceLogic(
  deps: SummarizeRecommendationPerformanceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseSummarizeRecommendationPerformanceFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'summarize_recommendation_performance',
      'Ask about checkout recommendation performance (e.g. "Summarize recommendation performance" or "What is the checkout recommendation CTR?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure(
      'summarize_recommendation_performance',
      'Business not found.',
    );
  }

  const periodDays = resolvePeriodDays(parsed);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - periodDays);

  const events = await deps.eventStore.getEvents({
    businessId,
    aggregateType: 'product_recommendation',
    startDate,
    endDate: new Date(),
    limit: 10_000,
  });

  const products = await deps.inventoryService.listProducts(
    businessId,
    undefined,
    true,
  );
  const productNameById = new Map(
    products.map((product) => [product.id, product.name]),
  );

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    select: { id: true, name: true },
  });
  const serviceNameById = new Map(
    services.map((service) => [service.id, service.name]),
  );

  let stats = aggregateRecommendationPerformanceEvents(events, parsed.surface);
  stats = attachProductNames(stats, productNameById);
  stats = attachServiceNames(stats, serviceNameById);

  const summary = buildAspectSummary(
    parsed.aspect,
    stats,
    periodDays,
    parsed.surface,
  );

  return success('summarize_recommendation_performance', summary, {
    aspect: parsed.aspect,
    surface: parsed.surface,
    daysAhead: periodDays,
    overallCtr: stats.overallCtr,
    totalImpressions: stats.totalImpressions,
    totalClicks: stats.totalClicks,
    bookingsWithRecommendationsShown: stats.bookingsWithRecommendationsShown,
    byProduct: stats.byProduct,
    byService: stats.byService,
    topProductsByCtr: stats.topProductsByCtr,
    topServicesByCtr: stats.topServicesByCtr,
  });
}
