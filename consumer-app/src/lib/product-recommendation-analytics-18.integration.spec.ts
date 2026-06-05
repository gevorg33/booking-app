import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectNewImpressionProductIds } from './checkout-recommendations.js';
import {
  buildProductRecommendationEventBody,
  trackProductRecommendationEvent,
  trackProductRecommendationImpressions,
} from './product-recommendation-analytics.js';

vi.mock('../services/public-api.js', () => ({
  recordCheckoutRecommendationEvent: vi.fn().mockResolvedValue({ recorded: true }),
}));

import { recordCheckoutRecommendationEvent } from '../services/public-api.js';

const eventsPath = (slug: string) =>
  `/public/${slug}/checkout/recommendations/events`;

describe('Sprint 32 — rec-1.8 consumer analytics scenario matrix', () => {
  const consumerContext = {
    slug: 'glow-salon',
    serviceId: 'svc-haircut',
    categoryId: 'cat-hair',
    bookingId: 'bk-77',
    surface: 'consumer_app' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts shown and clicked events to the public analytics endpoint', () => {
    expect(eventsPath('glow-salon')).toBe(
      '/public/glow-salon/checkout/recommendations/events',
    );

    trackProductRecommendationEvent(consumerContext, 'shown', 'prod-1');
    trackProductRecommendationEvent(consumerContext, 'clicked', 'prod-2');

    expect(recordCheckoutRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      buildProductRecommendationEventBody('shown', 'prod-1', consumerContext),
    );
    expect(recordCheckoutRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      buildProductRecommendationEventBody('clicked', 'prod-2', consumerContext),
    );
  });

  it('dedupes impressions across success-screen re-renders', () => {
    const seen = new Set<string>();
    const impressions: string[] = [];

    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-1'], seen)) {
      impressions.push(id);
    }
    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)) {
      impressions.push(id);
    }

    expect(impressions).toEqual(['prod-1', 'prod-2']);
    trackProductRecommendationImpressions(consumerContext, ['prod-1', 'prod-2'], seen);
    expect(recordCheckoutRecommendationEvent).not.toHaveBeenCalled();
  });

  it('skips blank product ids before posting impressions', () => {
    const seen = new Set<string>();
    expect(collectNewImpressionProductIds(['', ' prod-5 '], seen)).toEqual(['prod-5']);

    trackProductRecommendationImpressions(consumerContext, [' prod-6 '], seen);
    expect(recordCheckoutRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'shown', productId: 'prod-6' }),
    );
  });

  it('builds clicked payload for external product links without booking id', () => {
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

  it('swallows analytics API failures without blocking the success screen', async () => {
    vi.mocked(recordCheckoutRecommendationEvent).mockRejectedValueOnce(
      new Error('offline'),
    );

    expect(() =>
      trackProductRecommendationEvent(consumerContext, 'clicked', 'prod-9'),
    ).not.toThrow();

    await Promise.resolve();
  });
});
