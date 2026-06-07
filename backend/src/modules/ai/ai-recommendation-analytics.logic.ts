import type { Repository } from 'typeorm';
import type { EventStoreService } from '../../events/store/event-store.service.js';
import type { InventoryService } from '../inventory/inventory.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  aggregateProductRecommendationAnalyticsEvents,
  formatProductAnalyticsRows,
  formatRecommendationSurfaceLabel,
  parseExplainRecommendationAnalyticsFromPrompt,
  type ParsedExplainRecommendationAnalytics,
  type ProductRecommendationAnalyticsSummary,
  type RecommendationAnalyticsAspect,
} from './ai-recommendation-analytics.util.js';

export interface ExplainRecommendationAnalyticsLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  eventStore: Pick<EventStoreService, 'getEvents'>;
  inventoryService: Pick<InventoryService, 'listProducts'>;
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
  parsed: ParsedExplainRecommendationAnalytics,
): number {
  return parsed.daysAhead ?? DEFAULT_DAYS_AHEAD;
}

function attachProductNames<
  T extends { productId: string; productName?: string },
>(rows: T[], productNameById: Map<string, string>): T[] {
  return rows.map((row) => ({
    ...row,
    productName: productNameById.get(row.productId) ?? row.productId,
  }));
}

function filterBySurface<T extends { surface: string }>(
  rows: T[],
  surface?: string,
): T[] {
  if (!surface) return rows;
  return rows.filter((row) => row.surface === surface);
}

function buildImpressionsSummary(
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
  surface?: string,
): string {
  const surfaceRows = filterBySurface(stats.bySurface, surface);
  const impressions = surface
    ? surfaceRows.reduce((sum, row) => sum + row.impressions, 0)
    : stats.totalImpressions;
  const surfaceLabel = surface
    ? formatRecommendationSurfaceLabel(surface)
    : 'all surfaces';
  return `Over the last ${periodDays} days, checkout recommendations recorded ${impressions} product_recommendation.shown impression(s) on ${surfaceLabel}.`;
}

function buildClicksSummary(
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
  surface?: string,
): string {
  const surfaceRows = filterBySurface(stats.bySurface, surface);
  const clicks = surface
    ? surfaceRows.reduce((sum, row) => sum + row.clicks, 0)
    : stats.totalClicks;
  const surfaceLabel = surface
    ? formatRecommendationSurfaceLabel(surface)
    : 'all surfaces';
  return `Over the last ${periodDays} days, checkout recommendations recorded ${clicks} product_recommendation.clicked event(s) on ${surfaceLabel}.`;
}

function buildSurfacesSummary(
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
): string {
  if (stats.bySurface.length === 0) {
    return `No product_recommendation.shown or product_recommendation.clicked events were recorded in the last ${periodDays} days.`;
  }
  const lines = stats.bySurface.map(
    (row) => `${row.label}: ${row.impressions} shown / ${row.clicks} clicked`,
  );
  return `Checkout recommendation surfaces in the last ${periodDays} days — ${lines.join('; ')}.`;
}

function buildTopProductsSummary(
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
): string {
  const byImpressions = formatProductAnalyticsRows(
    stats.topProductsByImpressions,
    'impressions',
  );
  const byClicks = formatProductAnalyticsRows(
    stats.topProductsByClicks,
    'clicks',
  );
  return `Top checkout recommendation products in the last ${periodDays} days — by impressions: ${byImpressions}; by clicks: ${byClicks}.`;
}

function buildAllSummary(
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
  surface?: string,
): string {
  const impressions = buildImpressionsSummary(stats, periodDays, surface);
  const clicks = buildClicksSummary(stats, periodDays, surface);
  const surfaces =
    surface === undefined ? ` ${buildSurfacesSummary(stats, periodDays)}` : '';
  const tops =
    surface === undefined
      ? ` ${buildTopProductsSummary(stats, periodDays)}`
      : '';
  return `${impressions} ${clicks}${surfaces}${tops}`.trim();
}

function buildAspectSummary(
  aspect: RecommendationAnalyticsAspect,
  stats: ProductRecommendationAnalyticsSummary,
  periodDays: number,
  surface?: string,
): string {
  if (aspect === 'impressions') {
    return buildImpressionsSummary(stats, periodDays, surface);
  }
  if (aspect === 'clicks') {
    return buildClicksSummary(stats, periodDays, surface);
  }
  if (aspect === 'surfaces') {
    return buildSurfacesSummary(stats, periodDays);
  }
  if (aspect === 'topProducts') {
    return buildTopProductsSummary(stats, periodDays);
  }
  return buildAllSummary(stats, periodDays, surface);
}

export async function handleExplainRecommendationAnalyticsLogic(
  deps: ExplainRecommendationAnalyticsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainRecommendationAnalyticsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_recommendation_analytics',
      'Ask about checkout recommendation analytics (e.g. "Explain recommendation analytics" or "How many recommendation impressions do we have?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_recommendation_analytics', 'Business not found.');
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

  let stats = aggregateProductRecommendationAnalyticsEvents(events);
  stats = {
    ...stats,
    byProduct: attachProductNames(stats.byProduct, productNameById),
    topProductsByImpressions: attachProductNames(
      stats.topProductsByImpressions,
      productNameById,
    ),
    topProductsByClicks: attachProductNames(
      stats.topProductsByClicks,
      productNameById,
    ),
  };

  const summary = buildAspectSummary(
    parsed.aspect,
    stats,
    periodDays,
    parsed.surface,
  );

  return success('explain_recommendation_analytics', summary, {
    aspect: parsed.aspect,
    surface: parsed.surface,
    daysAhead: periodDays,
    totalImpressions: stats.totalImpressions,
    totalClicks: stats.totalClicks,
    byProduct: stats.byProduct,
    bySurface: stats.bySurface,
    topProductsByImpressions: stats.topProductsByImpressions,
    topProductsByClicks: stats.topProductsByClicks,
  });
}
