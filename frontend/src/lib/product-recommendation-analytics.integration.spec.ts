import { describe, expect, it } from 'vitest';
import {
  buildProductRecommendationEventBody,
  collectNewImpressionProductIds,
  trackProductRecommendationImpressions,
} from './product-recommendation-analytics';

describe('Sprint 32 — rec-1.8 recommendation analytics scenario matrix', () => {
  const webContext = {
    slug: 'glow-salon',
    serviceId: 'svc-haircut',
    categoryId: 'cat-hair',
    bookingId: 'bk-42',
    surface: 'web_checkout' as const,
  };

  const consumerContext = {
    slug: 'glow-salon',
    serviceId: 'svc-haircut',
    categoryId: 'cat-hair',
    bookingId: 'bk-99',
    surface: 'consumer_app' as const,
  };

  it('tracks one shown impression per product per session', () => {
    const seen = new Set<string>();
    const first = collectNewImpressionProductIds(['prod-1', 'prod-2'], seen);
    const second = collectNewImpressionProductIds(['prod-1', 'prod-3'], seen);
    expect(first).toEqual(['prod-1', 'prod-2']);
    expect(second).toEqual(['prod-3']);
  });

  it('builds web checkout shown payload with booking id', () => {
    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', webContext),
    ).toMatchObject({
      event: 'shown',
      productId: 'prod-1',
      bookingId: 'bk-42',
      surface: 'web_checkout',
    });
  });

  it('builds consumer app clicked payload', () => {
    expect(
      buildProductRecommendationEventBody('clicked', 'prod-2', consumerContext),
    ).toEqual({
      event: 'clicked',
      productId: 'prod-2',
      serviceId: 'svc-haircut',
      categoryId: 'cat-hair',
      bookingId: 'bk-99',
      surface: 'consumer_app',
    });
  });

  it('skips duplicate impressions when cards re-render', () => {
    const seen = new Set<string>();
    const calls: string[] = [];
    const track = (productId: string) => calls.push(productId);
    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)) {
      track(id);
    }
    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)) {
      track(id);
    }
    expect(calls).toEqual(['prod-1', 'prod-2']);
  });

  it('does not throw when impression tracking is invoked', () => {
    expect(() =>
      trackProductRecommendationImpressions(webContext, [], new Set()),
    ).not.toThrow();
  });
});
