import { allowsNonEssentialTracking } from './cookie-consent';
import { recordProductRecommendationEvent } from './public-api';

export type ProductRecommendationAnalyticsEvent = 'shown' | 'clicked';

export type ProductRecommendationSurface = 'web_checkout' | 'consumer_app';

export interface ProductRecommendationAnalyticsContext {
  slug: string;
  serviceId: string;
  categoryId?: string;
  bookingId?: string;
  surface?: ProductRecommendationSurface;
  /** When false, recommendation analytics may run without a banner choice. */
  cookieBannerEnabled?: boolean;
}

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
  if (
    !allowsNonEssentialTracking(context.slug, {
      cookieBannerEnabled: context.cookieBannerEnabled,
    })
  ) {
    return;
  }
  void recordProductRecommendationEvent(
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
