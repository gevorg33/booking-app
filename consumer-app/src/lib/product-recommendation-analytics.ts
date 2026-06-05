import { recordCheckoutRecommendationEvent } from '../services/public-api.js';
import { collectNewImpressionProductIds } from './checkout-recommendations.js';

export type ProductRecommendationAnalyticsEvent = 'shown' | 'clicked';

export interface ProductRecommendationAnalyticsContext {
  slug: string;
  serviceId: string;
  categoryId?: string;
  bookingId?: string;
  surface?: 'web_checkout' | 'consumer_app';
}

export function buildProductRecommendationEventBody(
  event: ProductRecommendationAnalyticsEvent,
  productId: string,
  context: ProductRecommendationAnalyticsContext,
) {
  return {
    event,
    productId,
    serviceId: context.serviceId,
    ...(context.categoryId ? { categoryId: context.categoryId } : {}),
    ...(context.bookingId ? { bookingId: context.bookingId } : {}),
    ...(context.surface ? { surface: context.surface } : {}),
  };
}

export function trackProductRecommendationEvent(
  context: ProductRecommendationAnalyticsContext,
  event: ProductRecommendationAnalyticsEvent,
  productId: string,
): void {
  void recordCheckoutRecommendationEvent(
    context.slug,
    buildProductRecommendationEventBody(event, productId, context),
  ).catch(() => undefined);
}

export function trackProductRecommendationImpressions(
  context: ProductRecommendationAnalyticsContext,
  productIds: string[],
  seen: Set<string>,
): void {
  for (const productId of collectNewImpressionProductIds(productIds, seen)) {
    trackProductRecommendationEvent(context, 'shown', productId);
  }
}
