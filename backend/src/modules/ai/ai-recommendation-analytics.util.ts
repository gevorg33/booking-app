import { EventType } from '../../events/event-types.js';
import {
  PRODUCT_RECOMMENDATION_SURFACES,
  type ProductRecommendationSurface,
} from '../../common/utils/product-recommendation-analytics.util.js';

export const RECOMMENDATION_ANALYTICS_INTENTS = [
  'explain_recommendation_analytics',
] as const;

export type RecommendationAnalyticsIntent =
  (typeof RECOMMENDATION_ANALYTICS_INTENTS)[number];

export type RecommendationAnalyticsAspect =
  | 'impressions'
  | 'clicks'
  | 'surfaces'
  | 'topProducts'
  | 'all';

export interface ParsedExplainRecommendationAnalytics {
  aspect: RecommendationAnalyticsAspect;
  surface?: ProductRecommendationSurface;
  productName?: string;
  daysAhead?: number;
}

export interface ProductRecommendationAnalyticsRow {
  productId: string;
  productName?: string;
  impressions: number;
  clicks: number;
}

export interface ProductRecommendationSurfaceStats {
  surface: string;
  label: string;
  impressions: number;
  clicks: number;
}

export interface ProductRecommendationAnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  byProduct: ProductRecommendationAnalyticsRow[];
  bySurface: ProductRecommendationSurfaceStats[];
  topProductsByImpressions: ProductRecommendationAnalyticsRow[];
  topProductsByClicks: ProductRecommendationAnalyticsRow[];
}

export function isRecommendationAnalyticsIntent(
  action: string,
): action is RecommendationAnalyticsIntent {
  return (RECOMMENDATION_ANALYTICS_INTENTS as readonly string[]).includes(action);
}

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|show|describe|what|which|how many|tell me|give me|break down|summarize|list|counts?|stats?)\b/i.test(
      prompt,
    ) ||
    /(?:բացատրիր|ցույց\s+տուր|քանի|որքան)/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|сколько|разбей)/i.test(prompt) ||
    /\?\s*$/.test(prompt.trim())
  );
}

function hasRecommendationAnalyticsTopic(prompt: string): boolean {
  return (
    /\brecommendation\s+analytics\b/i.test(prompt) ||
    /\bproduct_recommendation\.(?:shown|clicked)\b/i.test(prompt) ||
    /\b(?:recommendation|checkout recommendation)\s+(?:impressions?|clicks?|events?|stats?|metrics?|analytics)\b/i.test(
      prompt,
    ) ||
    /\b(?:impressions?|clicks?)\b.+\b(?:recommendation|you might also like|post[- ]?checkout)\b/i.test(
      prompt,
    ) ||
    /\b(?:top|most)\b.+\b(?:recommended|recommendation)\s+products?\b/i.test(
      prompt,
    ) ||
    /\b(?:web|public)\s+(?:booking\s+)?checkout\b.+\b(?:recommendation|shown|impression)/i.test(
      prompt,
    ) ||
    /\bconsumer\s+app\b.+\b(?:recommendation|click|impression)/i.test(prompt) ||
    (/\bconsumer\s+app\b/i.test(prompt) &&
      /\b(?:recommendation|click counts?)\b/i.test(prompt)) ||
    (/\bweb\s+checkout\b/i.test(prompt) && /\bconsumer\s+app\b/i.test(prompt)) ||
    /\brecommendation\b.+\bclicks?\b/i.test(prompt) ||
    /\bshop[- ]?link clicks?\b/i.test(prompt) ||
    /\b(?:web_checkout|consumer_app)\b/i.test(prompt) ||
    /\b(?:surface|surfaces)\b.+\b(?:recommendation|checkout)\b/i.test(prompt) ||
    /\bpost[- ]?checkout\s+recommendation\s+event\b/i.test(prompt) ||
    /անալիտիկ/i.test(prompt) ||
    (/խորհուրդ|recommendation/i.test(prompt) &&
      /(?:impressions?|clicks?|shown|stats?|counts?)/i.test(prompt)) ||
    (/рекомендац/i.test(prompt) &&
      /(?:аналитик|показ|impressions?|клик|событ|stats?)/i.test(prompt)) ||
    (/после\s+checkout/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /(?:показ|impressions?|клик|событ)/i.test(prompt))
  );
}

function isPerformanceSummaryPrompt(prompt: string): boolean {
  return (
    /\bctr\b/i.test(prompt) ||
    /\bclick[- ]?through\b/i.test(prompt) ||
    /\bsummarize_recommendation_performance\b/i.test(prompt) ||
    /\brecommendation\s+performance\b/i.test(prompt) ||
    /\bbookings?\s+with\s+recommendations?\s+shown\b/i.test(prompt) ||
    /ամփոփիր\s+recommendation\s+performance/i.test(prompt) ||
    (/արդյունավետություն|ctr/i.test(prompt) && /recommendation|խորհուրդ/i.test(prompt)) ||
    (/booking/i.test(prompt) && /recommendations?\s+shown/i.test(prompt)) ||
    (/сводк/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /(?:эффективност|performance|ctr)/i.test(prompt)) ||
    (/ctr/i.test(prompt) && /рекомендац/i.test(prompt)) ||
    (/бронирован/i.test(prompt) &&
      /рекомендац/i.test(prompt) &&
      /показан/i.test(prompt))
  );
}

function extractAspect(prompt: string): RecommendationAnalyticsAspect {
  if (
    /\bproduct_recommendation\.(?:shown|clicked)\b/i.test(prompt) &&
    /\b(?:shown|clicked)\b/i.test(prompt) &&
    /\b(?:and|&)\b/i.test(prompt)
  ) {
    return 'all';
  }
  if (
    /\b(?:break down|split|vs|versus|by surface|surfaces)\b/i.test(prompt) ||
    /\bweb\b.+\bconsumer\s+app\b/i.test(prompt) ||
    /разбей/i.test(prompt) &&
      /(?:surface|клик|рекомендац)/i.test(prompt)
  ) {
    return 'surfaces';
  }
  if (
    /\b(?:top|most)\b.+\b(?:products?|recommended|impressions?|clicks?)\b/i.test(
      prompt,
    ) ||
    /\bwhich\s+products?\s+get\b/i.test(prompt)
  ) {
    return 'topProducts';
  }
  if (
    /\bclicks?\b/i.test(prompt) &&
    !/\b(?:shown|impressions?|product_recommendation\.shown)\b/i.test(prompt) &&
    !/показ/i.test(prompt)
  ) {
    return 'clicks';
  }
  if (
    (/\b(?:impressions?|shown|product_recommendation\.shown)\b/i.test(prompt) ||
      /показ/i.test(prompt)) &&
    !/\b(?:clicked|clicks?|product_recommendation\.clicked)\b/i.test(prompt) &&
    !/\bклик/i.test(prompt)
  ) {
    return 'impressions';
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
  if (/\blast\s+30\s+days?\b/i.test(prompt)) return 30;
  if (/\bthis\s+month\b/i.test(prompt)) return 30;
  return undefined;
}

export function isExplainRecommendationAnalyticsPrompt(
  prompt: string,
): boolean {
  if (!hasExplainReadCue(prompt)) return false;
  if (
    /\b(?:recommendation\s+setup|checkout\s+recommendation\s+configuration|which\s+products?\s+(?:are\s+)?linked)\b/i.test(
      prompt,
    ) &&
    !/\b(?:analytics|impressions?|clicks?|product_recommendation\.|stats?|metrics?|events?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isPerformanceSummaryPrompt(prompt)) return false;
  if (!hasRecommendationAnalyticsTopic(prompt)) return false;
  return true;
}

export function parseExplainRecommendationAnalyticsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainRecommendationAnalytics | null {
  if (!isExplainRecommendationAnalyticsPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams &&
    ['impressions', 'clicks', 'surfaces', 'topProducts', 'all'].includes(
      aspectFromParams,
    )
      ? (aspectFromParams as RecommendationAnalyticsAspect)
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
    productName,
    daysAhead,
  };
}

export function rescueExplainRecommendationAnalyticsIntent(
  prompt: string,
  action: string,
): { action: RecommendationAnalyticsIntent; rescueReason: string } | null {
  if (isRecommendationAnalyticsIntent(action)) return null;
  if (!isExplainRecommendationAnalyticsPrompt(prompt)) return null;
  return {
    action: 'explain_recommendation_analytics',
    rescueReason: 'explain_recommendation_analytics',
  };
}

export function formatRecommendationSurfaceLabel(surface: string): string {
  if (surface === 'web_checkout') return 'public web checkout';
  if (surface === 'consumer_app') return 'consumer app';
  if (surface === 'unknown') return 'unspecified surface';
  return surface;
}

export function aggregateProductRecommendationAnalyticsEvents(
  events: Array<{ eventType: string; payload?: Record<string, unknown> }>,
): ProductRecommendationAnalyticsSummary {
  const byProduct = new Map<string, { impressions: number; clicks: number }>();
  const bySurface = new Map<string, { impressions: number; clicks: number }>();
  let totalImpressions = 0;
  let totalClicks = 0;

  for (const event of events) {
    const productId =
      typeof event.payload?.productId === 'string'
        ? event.payload.productId.trim()
        : '';
    if (!productId) continue;

    const surface =
      typeof event.payload?.surface === 'string' &&
      event.payload.surface.trim()
        ? event.payload.surface.trim()
        : 'unknown';
    const productRow = byProduct.get(productId) ?? {
      impressions: 0,
      clicks: 0,
    };
    const surfaceRow = bySurface.get(surface) ?? {
      impressions: 0,
      clicks: 0,
    };

    if (event.eventType === EventType.PRODUCT_RECOMMENDATION_SHOWN) {
      productRow.impressions += 1;
      surfaceRow.impressions += 1;
      totalImpressions += 1;
    } else if (event.eventType === EventType.PRODUCT_RECOMMENDATION_CLICKED) {
      productRow.clicks += 1;
      surfaceRow.clicks += 1;
      totalClicks += 1;
    }

    byProduct.set(productId, productRow);
    bySurface.set(surface, surfaceRow);
  }

  const byProductRows = [...byProduct.entries()].map(([productId, counts]) => ({
    productId,
    ...counts,
  }));
  const topProductsByImpressions = [...byProductRows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);
  const topProductsByClicks = [...byProductRows]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return {
    totalImpressions,
    totalClicks,
    byProduct: byProductRows,
    bySurface: [...bySurface.entries()].map(([surface, counts]) => ({
      surface,
      label: formatRecommendationSurfaceLabel(surface),
      ...counts,
    })),
    topProductsByImpressions,
    topProductsByClicks,
  };
}

export function formatProductAnalyticsRows(
  rows: ProductRecommendationAnalyticsRow[],
  mode: 'impressions' | 'clicks',
): string {
  const filtered = rows.filter((row) =>
    mode === 'impressions' ? row.impressions > 0 : row.clicks > 0,
  );
  if (filtered.length === 0) return 'none recorded';
  return filtered
    .map((row) => {
      const label = row.productName ?? row.productId;
      const count = mode === 'impressions' ? row.impressions : row.clicks;
      return `${label} (${count})`;
    })
    .join(', ');
}
