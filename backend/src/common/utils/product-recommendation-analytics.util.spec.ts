import { EventType } from '../../events/event-types.js';
import {
  buildProductRecommendationAnalyticsPayload,
  collectNewImpressionProductIds,
  eventTypeForProductRecommendationAnalytics,
  isProductInRecommendationList,
  resolveProductRecommendationAnalyticsEvent,
} from './product-recommendation-analytics.util.js';

describe('product-recommendation-analytics.util', () => {
  it('resolves analytics event names', () => {
    expect(resolveProductRecommendationAnalyticsEvent('shown')).toBe('shown');
    expect(resolveProductRecommendationAnalyticsEvent('clicked')).toBe(
      'clicked',
    );
    expect(resolveProductRecommendationAnalyticsEvent('dismissed')).toBeNull();
  });

  it('maps analytics events to domain event types', () => {
    expect(eventTypeForProductRecommendationAnalytics('shown')).toBe(
      EventType.PRODUCT_RECOMMENDATION_SHOWN,
    );
    expect(eventTypeForProductRecommendationAnalytics('clicked')).toBe(
      EventType.PRODUCT_RECOMMENDATION_CLICKED,
    );
  });

  it('builds analytics payload with optional context', () => {
    expect(
      buildProductRecommendationAnalyticsPayload({
        productId: ' prod-1 ',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingId: 'bk-1',
        surface: 'web_checkout',
      }),
    ).toEqual({
      productId: 'prod-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingId: 'bk-1',
      surface: 'web_checkout',
    });
    expect(
      buildProductRecommendationAnalyticsPayload({ productId: 'prod-2' }),
    ).toEqual({ productId: 'prod-2' });
  });

  it('omits whitespace-only optional payload fields', () => {
    expect(
      buildProductRecommendationAnalyticsPayload({
        productId: 'prod-1',
        serviceId: '  ',
        categoryId: '',
        bookingId: '   ',
        surface: ' ',
      }),
    ).toEqual({ productId: 'prod-1' });
  });

  it('checks recommendation membership and dedupes impressions', () => {
    expect(
      isProductInRecommendationList('prod-1', [
        { id: 'prod-1' },
        { id: 'prod-2' },
      ]),
    ).toBe(true);
    expect(isProductInRecommendationList('prod-9', [{ id: 'prod-1' }])).toBe(
      false,
    );

    const seen = new Set<string>();
    expect(
      collectNewImpressionProductIds(['prod-1', 'prod-1', 'prod-2'], seen),
    ).toEqual(['prod-1', 'prod-2']);
    expect(collectNewImpressionProductIds(['prod-1'], seen)).toEqual([]);
    expect(
      collectNewImpressionProductIds(['', '  ', ' prod-3 '], seen),
    ).toEqual(['prod-3']);
  });
});
