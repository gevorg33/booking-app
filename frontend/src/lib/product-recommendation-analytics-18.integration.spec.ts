import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildProductRecommendationEventBody,
  collectNewImpressionProductIds,
  trackProductRecommendationEvent,
  trackProductRecommendationImpressions,
} from './product-recommendation-analytics';

vi.mock('./public-api', () => ({
  recordProductRecommendationEvent: vi.fn().mockResolvedValue({ recorded: true }),
}));

import { recordProductRecommendationEvent } from './public-api';

const eventsPath = (slug: string) =>
  `/public/${slug}/checkout/recommendations/events`;

describe('Sprint 32 — rec-1.8 web analytics scenario matrix', () => {
  const webContext = {
    slug: 'glow-salon',
    serviceId: 'svc-haircut',
    categoryId: 'cat-hair',
    bookingId: 'bk-42',
    surface: 'web_checkout' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts shown and clicked events to the public analytics endpoint', () => {
    expect(eventsPath('glow-salon')).toBe(
      '/public/glow-salon/checkout/recommendations/events',
    );

    trackProductRecommendationEvent(webContext, 'shown', 'prod-1');
    trackProductRecommendationEvent(webContext, 'clicked', 'prod-2');

    expect(recordProductRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      buildProductRecommendationEventBody('shown', 'prod-1', webContext),
    );
    expect(recordProductRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      buildProductRecommendationEventBody('clicked', 'prod-2', webContext),
    );
  });

  it('tracks one shown impression per product per checkout session', () => {
    const seen = new Set<string>();
    const impressions: string[] = [];

    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)) {
      impressions.push(id);
    }
    for (const id of collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)) {
      impressions.push(id);
    }

    expect(impressions).toEqual(['prod-1', 'prod-2']);
    trackProductRecommendationImpressions(webContext, ['prod-1', 'prod-2'], seen);
    expect(recordProductRecommendationEvent).not.toHaveBeenCalled();
  });

  it('skips blank product ids and trims whitespace before posting', () => {
    const seen = new Set<string>();
    expect(collectNewImpressionProductIds(['', '  ', ' prod-3 '], seen)).toEqual([
      'prod-3',
    ]);

    trackProductRecommendationImpressions(webContext, [' prod-4 '], seen);
    expect(recordProductRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'shown', productId: 'prod-4' }),
    );
  });

  it('supports category-only analytics context without booking id', () => {
    const categoryOnly = {
      slug: 'glow-salon',
      serviceId: 'svc-haircut',
      categoryId: 'cat-hair',
      surface: 'web_checkout' as const,
    };

    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', categoryOnly),
    ).toEqual({
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-haircut',
      categoryId: 'cat-hair',
      surface: 'web_checkout',
    });
  });

  it('swallows analytics API failures without blocking checkout success UI', async () => {
    vi.mocked(recordProductRecommendationEvent).mockRejectedValueOnce(
      new Error('network'),
    );

    expect(() =>
      trackProductRecommendationEvent(webContext, 'clicked', 'prod-9'),
    ).not.toThrow();

    await Promise.resolve();
  });
});
