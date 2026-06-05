import { describe, expect, it, vi } from 'vitest';
import {
  buildProductRecommendationEventBody,
  trackProductRecommendationEvent,
  trackProductRecommendationImpressions,
} from './product-recommendation-analytics.js';

vi.mock('../services/public-api.js', () => ({
  recordCheckoutRecommendationEvent: vi.fn().mockResolvedValue({ recorded: true }),
}));

import { recordCheckoutRecommendationEvent } from '../services/public-api.js';

const context = {
  slug: 'glow-salon',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  bookingId: 'bk-1',
  surface: 'consumer_app' as const,
};

describe('product-recommendation-analytics', () => {
  it('builds consumer app analytics payloads', () => {
    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', context),
    ).toEqual({
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-1',
      surface: 'consumer_app',
    });
  });

  it('omits optional fields when only service context is provided', () => {
    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', {
        slug: 'glow-salon',
        serviceId: 'svc-1',
      }),
    ).toEqual({
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-1',
    });
  });

  it('swallows analytics API failures', async () => {
    vi.mocked(recordCheckoutRecommendationEvent).mockRejectedValueOnce(
      new Error('offline'),
    );
    expect(() => trackProductRecommendationEvent(context, 'clicked', 'prod-1')).not.toThrow();
    await Promise.resolve();
  });

  it('posts shown and clicked events without blocking UI', () => {
    trackProductRecommendationEvent(context, 'clicked', 'prod-1');
    trackProductRecommendationImpressions(context, ['prod-2'], new Set());

    expect(recordCheckoutRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'clicked', productId: 'prod-1' }),
    );
    expect(recordCheckoutRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'shown', productId: 'prod-2' }),
    );
  });
});
