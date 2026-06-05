import { describe, expect, it, vi } from 'vitest';
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

const context = {
  slug: 'glow-salon',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  bookingId: 'bk-1',
  surface: 'web_checkout' as const,
};

describe('product-recommendation-analytics', () => {
  it('builds event bodies with optional checkout context', () => {
    expect(
      buildProductRecommendationEventBody('shown', 'prod-1', context),
    ).toEqual({
      event: 'shown',
      productId: 'prod-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-1',
      surface: 'web_checkout',
    });
  });

  it('omits optional fields when checkout context is minimal', () => {
    expect(
      buildProductRecommendationEventBody('clicked', 'prod-1', {
        slug: 'glow-salon',
        serviceId: 'svc-1',
      }),
    ).toEqual({
      event: 'clicked',
      productId: 'prod-1',
      serviceId: 'svc-1',
    });
  });

  it('dedupes impression product ids per session', () => {
    const seen = new Set<string>();
    expect(collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)).toEqual([
      'prod-1',
      'prod-2',
    ]);
    expect(collectNewImpressionProductIds(['prod-1', 'prod-3'], seen)).toEqual(['prod-3']);
    expect(collectNewImpressionProductIds(['', ' prod-4 '], seen)).toEqual(['prod-4']);
  });

  it('swallows analytics API failures', async () => {
    vi.mocked(recordProductRecommendationEvent).mockRejectedValueOnce(
      new Error('network'),
    );
    expect(() => trackProductRecommendationEvent(context, 'clicked', 'prod-1')).not.toThrow();
    await Promise.resolve();
  });

  it('fires shown and clicked analytics without throwing', async () => {
    trackProductRecommendationEvent(context, 'clicked', 'prod-1');
    trackProductRecommendationImpressions(context, ['prod-2', 'prod-2'], new Set());

    expect(recordProductRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'clicked', productId: 'prod-1' }),
    );
    expect(recordProductRecommendationEvent).toHaveBeenCalledWith(
      'glow-salon',
      expect.objectContaining({ event: 'shown', productId: 'prod-2' }),
    );
  });
});
