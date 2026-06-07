import { EventType } from '../../events/event-types.js';
import {
  PRODUCT_RECOMMENDATION_SURFACES,
  type ProductRecommendationSurface,
} from '../../common/utils/product-recommendation-analytics.util.js';
import { isExplainRecommendationAnalyticsPrompt } from './ai-recommendation-analytics.util.js';
import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';

export const RECOMMENDATION_PERFORMANCE_INTENTS = [
  'summarize_recommendation_performance',
] as const;

export type RecommendationPerformanceIntent =
  (typeof RECOMMENDATION_PERFORMANCE_INTENTS)[number];

export type RecommendationPerformanceAspect =
  | 'ctr'
  | 'byProduct'
  | 'byService'
  | 'bookings'
  | 'all';

export interface ParsedSummarizeRecommendationPerformance {
  aspect: RecommendationPerformanceAspect;
  surface?: ProductRecommendationSurface;
  serviceName?: string;
  productName?: string;
  daysAhead?: number;
}

export interface RecommendationPerformanceProductRow {
  productId: string;
  productName?: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface RecommendationPerformanceServiceRow {
  serviceId: string;
  serviceName?: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface RecommendationPerformanceSummary {
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  bookingsWithRecommendationsShown: number;
  byProduct: RecommendationPerformanceProductRow[];
  byService: RecommendationPerformanceServiceRow[];
  topProductsByCtr: RecommendationPerformanceProductRow[];
  topServicesByCtr: RecommendationPerformanceServiceRow[];
}

export function isRecommendationPerformanceIntent(
  action: string,
): action is RecommendationPerformanceIntent {
  return (RECOMMENDATION_PERFORMANCE_INTENTS as readonly string[]).includes(
    action,
  );
}

function hasSummarizeReadCue(prompt: string): boolean {
  return (
    /\b(summarize|summary|overview|report|how\s+(?:is|are)|what(?:'s| is)|show me|give me|tell me|which)\b/i.test(
      prompt,
    ) ||
    /(?:ամփոփիր|ցույց\s+տուր|քանի|որքան)/i.test(prompt) ||
    /(?:сводк|объясни|покажи|сколько|какой)/i.test(prompt) ||
    (/\b(?:ctr|click[- ]?through|performance)\b/i.test(prompt) &&
      /\b(?:recommendations?|checkout recommendations?|post[- ]?checkout)\b/i.test(
        prompt,
      )) ||
    (/ctr/i.test(prompt) &&
      /(?:recommendation|խորհուրդ|рекомендац)/i.test(prompt)) ||
    /\bbookings?\s+with\b.+\b(?:recommendation|shown|cards?)\b/i.test(prompt) ||
    (/booking/i.test(prompt) && /recommendations?\s+shown/i.test(prompt)) ||
    (/бронирован/i.test(prompt) && /рекомендац/i.test(prompt)) ||
    /\?\s*$/.test(prompt.trim())
  );
}

function hasRecommendationPerformanceTopic(prompt: string): boolean {
  return (
    /\bsummarize_recommendation_performance\b/i.test(prompt) ||
    /\brecommendation\s+performance\b/i.test(prompt) ||
    /\b(?:checkout|post[- ]?checkout)\s+recommendations?\s+performance\b/i.test(
      prompt,
    ) ||
    /\b(?:recommendations?|checkout recommendations?)\s+ctr\b/i.test(prompt) ||
    /\bctr\b.+\b(?:recommendations?|checkout|post[- ]?checkout|product|service)\b/i.test(
      prompt,
    ) ||
    /\b(?:recommendations?|checkout recommendations?)\b.+\bctr\b/i.test(
      prompt,
    ) ||
    /\bclick[- ]?through\b.+\b(?:recommendations?|checkout|product|service)\b/i.test(
      prompt,
    ) ||
    /\b(?:recommendations?|checkout recommendations?)\b.+\bclick[- ]?through\b/i.test(
      prompt,
    ) ||
    /\bbookings?\s+with\s+(?:checkout\s+)?recommendations?\s+shown\b/i.test(
      prompt,
    ) ||
    /\bhow\s+many\s+bookings?\b.+\b(?:recommendation|shown|cards?)\b/i.test(
      prompt,
    ) ||
    (/\bctr\b/i.test(prompt) &&
      /\b(?:recommendations?|you might also like|post[- ]?checkout)\b/i.test(
        prompt,
      )) ||
    (/\bperformance\b/i.test(prompt) &&
      /\b(?:recommendations?|checkout recommendations?|post[- ]?checkout)\b/i.test(
        prompt,
      )) ||
    (/արդյունավետություն/i.test(prompt) &&
      /recommendation|խորհուրդ/i.test(prompt)) ||
    (/эффективност/i.test(prompt) && /рекомендац/i.test(prompt)) ||
    (/после\s+оплаты/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /ctr/i.test(prompt)) ||
    (/booking/i.test(prompt) && /recommendations?\s+shown/i.test(prompt)) ||
    (/ունեցավ/i.test(prompt) && /recommendations?\s+shown/i.test(prompt)) ||
    (/бронирован/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /показан/i.test(prompt)) ||
    (/сколько/i.test(prompt) &&
      /бронирован/i.test(prompt) &&
      /рекомендац/i.test(prompt))
  );
}

function extractAspect(prompt: string): RecommendationPerformanceAspect {
  if (
    (/\bctr\b/i.test(prompt) ||
      /\bclick[- ]?through\b/i.test(prompt) ||
      /\bperformance\b/i.test(prompt) ||
      /\boverall\b/i.test(prompt)) &&
    /\bbookings?\s+with\b/i.test(prompt)
  ) {
    return 'all';
  }
  if (
    /\bbookings?\s+with\b.+\b(?:recommendation|shown|cards?)\b/i.test(prompt) ||
    /\bhow\s+many\s+bookings?\b.+\b(?:recommendation|shown|cards?)\b/i.test(
      prompt,
    ) ||
    (/booking/i.test(prompt) && /recommendations?\s+shown/i.test(prompt)) ||
    (/бронирован/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /показан/i.test(prompt))
  ) {
    return 'bookings';
  }
  if (
    /\b(?:by|per)\s+service\b/i.test(prompt) ||
    /\bservice\b.+\b(?:ctr|click[- ]?through|performance)\b/i.test(prompt) ||
    /\bwhich\s+services?\b.+\b(?:ctr|click[- ]?through|best)\b/i.test(prompt)
  ) {
    return 'byService';
  }
  if (
    /\b(?:by|per)\s+product\b/i.test(prompt) ||
    /\bproduct\b.+\b(?:ctr|click[- ]?through)\b/i.test(prompt) ||
    /\bbroken\s+down\s+by\s+product\b/i.test(prompt) ||
    (/ctr/i.test(prompt) && /(?:ապրանք|product|продукт)/i.test(prompt)) ||
    (/ctr/i.test(prompt) && /ըստ/i.test(prompt))
  ) {
    return 'byProduct';
  }
  if (
    /\bctr\b/i.test(prompt) ||
    /\bclick[- ]?through\b/i.test(prompt) ||
    /\boverall\b.+\b(?:ctr|click[- ]?through)\b/i.test(prompt) ||
    (/ctr/i.test(prompt) && /(?:որքան|какой)/i.test(prompt))
  ) {
    return 'ctr';
  }
  return 'all';
}

function extractSurface(
  prompt: string,
): ProductRecommendationSurface | undefined {
  if (/\bconsumer\s+app\b/i.test(prompt) || /\bconsumer_app\b/i.test(prompt)) {
    return 'consumer_app';
  }
  if (
    /\b(?:web|public)\s+(?:booking\s+)?checkout\b/i.test(prompt) ||
    /\bweb_checkout\b/i.test(prompt) ||
    /\bpublic\s+booking\b/i.test(prompt)
  ) {
    return 'web_checkout';
  }
  return undefined;
}

function extractDaysAhead(prompt: string): number | undefined {
  const lastDays = prompt.match(/\blast\s+(\d{1,3})\s+days?\b/i);
  if (lastDays?.[1]) return Number(lastDays[1]);
  if (/\blast\s+(?:30\s+days?|month)\b/i.test(prompt)) return 30;
  if (/\bthis\s+month\b/i.test(prompt)) return 30;
  if (/\blast\s+week\b/i.test(prompt)) return 7;
  return undefined;
}

export function isSummarizeRecommendationPerformancePrompt(
  prompt: string,
): boolean {
  if (!hasSummarizeReadCue(prompt)) return false;
  if (isExplainRecommendationAnalyticsPrompt(prompt)) return false;
  if (
    isExplainRecommendationSetupPrompt(prompt) &&
    !/\b(?:ctr|click[- ]?through|performance|bookings?\s+with)\b/i.test(prompt)
  ) {
    return false;
  }
  if (!hasRecommendationPerformanceTopic(prompt)) return false;
  return true;
}

export function parseSummarizeRecommendationPerformanceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSummarizeRecommendationPerformance | null {
  if (!isSummarizeRecommendationPerformancePrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams &&
    ['ctr', 'byProduct', 'byService', 'bookings', 'all'].includes(
      aspectFromParams,
    )
      ? (aspectFromParams as RecommendationPerformanceAspect)
      : extractAspect(prompt);

  const surfaceFromParams =
    typeof params.surface === 'string' ? params.surface.trim() : undefined;
  const surface =
    surfaceFromParams &&
    (PRODUCT_RECOMMENDATION_SURFACES as readonly string[]).includes(
      surfaceFromParams,
    )
      ? (surfaceFromParams as ProductRecommendationSurface)
      : extractSurface(prompt);

  const serviceName =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const productName =
    typeof params.productName === 'string'
      ? params.productName.trim()
      : undefined;

  const daysAheadFromParams = Number(params.daysAhead);
  const daysAhead = Number.isFinite(daysAheadFromParams)
    ? Math.max(1, Math.floor(daysAheadFromParams))
    : extractDaysAhead(prompt);

  return {
    aspect,
    surface,
    serviceName,
    productName,
    daysAhead,
  };
}

export function rescueSummarizeRecommendationPerformanceIntent(
  prompt: string,
  action: string,
): { action: RecommendationPerformanceIntent; rescueReason: string } | null {
  if (isRecommendationPerformanceIntent(action)) return null;
  if (!isSummarizeRecommendationPerformancePrompt(prompt)) return null;
  return {
    action: 'summarize_recommendation_performance',
    rescueReason: 'summarize_recommendation_performance',
  };
}

export function computeCtr(clicks: number, impressions: number): number {
  if (impressions <= 0) return 0;
  return (clicks / impressions) * 100;
}

export function formatCtrPercent(ctr: number): string {
  return `${ctr.toFixed(1)}%`;
}

function eventMatchesSurface(
  payload: Record<string, unknown> | undefined,
  surface?: string,
): boolean {
  if (!surface) return true;
  const eventSurface =
    typeof payload?.surface === 'string' ? payload.surface.trim() : 'unknown';
  return eventSurface === surface;
}

export function aggregateRecommendationPerformanceEvents(
  events: Array<{ eventType: string; payload?: Record<string, unknown> }>,
  surface?: string,
): RecommendationPerformanceSummary {
  const byProduct = new Map<string, { impressions: number; clicks: number }>();
  const byService = new Map<string, { impressions: number; clicks: number }>();
  const bookingIds = new Set<string>();
  let totalImpressions = 0;
  let totalClicks = 0;

  for (const event of events) {
    if (!eventMatchesSurface(event.payload, surface)) continue;

    const productId =
      typeof event.payload?.productId === 'string'
        ? event.payload.productId.trim()
        : '';
    if (!productId) continue;

    const serviceId =
      typeof event.payload?.serviceId === 'string'
        ? event.payload.serviceId.trim()
        : '';
    const bookingId =
      typeof event.payload?.bookingId === 'string'
        ? event.payload.bookingId.trim()
        : '';

    const productRow = byProduct.get(productId) ?? {
      impressions: 0,
      clicks: 0,
    };
    const serviceRow = serviceId
      ? (byService.get(serviceId) ?? { impressions: 0, clicks: 0 })
      : null;

    if (event.eventType === EventType.PRODUCT_RECOMMENDATION_SHOWN) {
      productRow.impressions += 1;
      if (serviceRow) serviceRow.impressions += 1;
      totalImpressions += 1;
      if (bookingId) bookingIds.add(bookingId);
    } else if (event.eventType === EventType.PRODUCT_RECOMMENDATION_CLICKED) {
      productRow.clicks += 1;
      if (serviceRow) serviceRow.clicks += 1;
      totalClicks += 1;
    }

    byProduct.set(productId, productRow);
    if (serviceId && serviceRow) {
      byService.set(serviceId, serviceRow);
    }
  }

  const byProductRows = [...byProduct.entries()].map(([productId, counts]) => ({
    productId,
    impressions: counts.impressions,
    clicks: counts.clicks,
    ctr: computeCtr(counts.clicks, counts.impressions),
  }));
  const byServiceRows = [...byService.entries()].map(([serviceId, counts]) => ({
    serviceId,
    impressions: counts.impressions,
    clicks: counts.clicks,
    ctr: computeCtr(counts.clicks, counts.impressions),
  }));

  const topProductsByCtr = [...byProductRows]
    .filter((row) => row.impressions > 0)
    .sort((a, b) => b.ctr - a.ctr || b.clicks - a.clicks)
    .slice(0, 5);
  const topServicesByCtr = [...byServiceRows]
    .filter((row) => row.impressions > 0)
    .sort((a, b) => b.ctr - a.ctr || b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalImpressions,
    totalClicks,
    overallCtr: computeCtr(totalClicks, totalImpressions),
    bookingsWithRecommendationsShown: bookingIds.size,
    byProduct: byProductRows,
    byService: byServiceRows,
    topProductsByCtr,
    topServicesByCtr,
  };
}

export function formatPerformanceProductRows(
  rows: RecommendationPerformanceProductRow[],
): string {
  const filtered = rows.filter((row) => row.impressions > 0);
  if (filtered.length === 0) return 'none recorded';
  return filtered
    .map((row) => {
      const label = row.productName ?? row.productId;
      return `${label} (${formatCtrPercent(row.ctr)}, ${row.clicks}/${row.impressions})`;
    })
    .join(', ');
}

export function formatPerformanceServiceRows(
  rows: RecommendationPerformanceServiceRow[],
): string {
  const filtered = rows.filter((row) => row.impressions > 0);
  if (filtered.length === 0) return 'none recorded';
  return filtered
    .map((row) => {
      const label = row.serviceName ?? row.serviceId;
      return `${label} (${formatCtrPercent(row.ctr)}, ${row.clicks}/${row.impressions})`;
    })
    .join(', ');
}
