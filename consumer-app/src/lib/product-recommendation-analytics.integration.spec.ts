import { describe, expect, it } from 'vitest';
import { collectNewImpressionProductIds } from './checkout-recommendations.js';
import { buildProductRecommendationEventBody } from './product-recommendation-analytics.js';

describe('Sprint 32 — rec-1.8 consumer analytics scenario matrix', () => {
  it('dedupes impressions across success-screen re-renders', () => {
    const seen = new Set<string>();
    expect(collectNewImpressionProductIds(['prod-1', 'prod-1'], seen)).toEqual(['prod-1']);
    expect(collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)).toEqual(['prod-2']);
  });

  it('includes booking id on consumer checkout shown events', () => {
    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', {
        slug: 'glow-salon',
        serviceId: 'svc-1',
        bookingId: 'bk-77',
        surface: 'consumer_app',
      }),
    ).toMatchObject({
      event: 'shown',
      bookingId: 'bk-77',
      surface: 'consumer_app',
    });
  });

  it('builds clicked payload for external product links', () => {
    expect(
      buildProductRecommendationEventBody('clicked', 'prod-3', {
        slug: 'glow-salon',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        surface: 'consumer_app',
      }),
    ).toEqual({
      event: 'clicked',
      productId: 'prod-3',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      surface: 'consumer_app',
    });
  });
});
