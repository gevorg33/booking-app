import { EventType } from '../../events/event-types.js';

export type ProductRecommendationAnalyticsEvent = 'shown' | 'clicked';

export const PRODUCT_RECOMMENDATION_ANALYTICS_EVENTS = [
  'shown',
  'clicked',
] as const;

export const PRODUCT_RECOMMENDATION_SURFACES = [
  'web_checkout',
  'consumer_app',
] as const;

export type ProductRecommendationSurface =
  (typeof PRODUCT_RECOMMENDATION_SURFACES)[number];

export interface ProductRecommendationAnalyticsInput {
  productId: string;
  serviceId?: string;
  categoryId?: string;
  bookingId?: string;
  surface?: string;
}

export function resolveProductRecommendationAnalyticsEvent(
  event: string,
): ProductRecommendationAnalyticsEvent | null {
  if (event === 'shown' || event === 'clicked') return event;
  return null;
}

export function eventTypeForProductRecommendationAnalytics(
  event: ProductRecommendationAnalyticsEvent,
): EventType {
  return event === 'shown'
    ? EventType.PRODUCT_RECOMMENDATION_SHOWN
    : EventType.PRODUCT_RECOMMENDATION_CLICKED;
}

export function buildProductRecommendationAnalyticsPayload(
  input: ProductRecommendationAnalyticsInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    productId: input.productId.trim(),
  };
  const serviceId = input.serviceId?.trim();
  if (serviceId) payload.serviceId = serviceId;
  const categoryId = input.categoryId?.trim();
  if (categoryId) payload.categoryId = categoryId;
  const bookingId = input.bookingId?.trim();
  if (bookingId) payload.bookingId = bookingId;
  const surface = input.surface?.trim();
  if (surface) payload.surface = surface;
  return payload;
}

export function isProductInRecommendationList(
  productId: string,
  recommendations: Array<{ id: string }>,
): boolean {
  return recommendations.some((product) => product.id === productId);
}

/** Returns product ids not yet recorded as impressions in this session. */
export function collectNewImpressionProductIds(
  productIds: string[],
  seen: Set<string>,
): string[] {
  const fresh: string[] = [];
  for (const id of productIds) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    fresh.push(trimmed);
  }
  return fresh;
}
