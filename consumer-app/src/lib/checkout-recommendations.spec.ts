import { describe, expect, it } from 'vitest';
import {
  buildCheckoutRecommendationParams,
  buildCheckoutRecommendationsPath,
  buildCheckoutRecommendationsQuery,
  buildRecommendationCardViewModel,
  collectNewImpressionProductIds,
  computeBookingSuccessEndTime,
  resolveRecommendationProductsFromQuery,
} from './checkout-recommendations.js';
import type { PublicRecommendationProduct } from './types.js';

const shampoo: PublicRecommendationProduct = {
  id: 'prod-1',
  name: 'Shampoo',
  description: 'Color-safe',
  imageUrl: '/uploads/shampoo.jpg',
  externalLink: 'https://shop.example/shampoo',
  price: 28,
};

describe('checkout-recommendations', () => {
  it('builds recommendation API query and path', () => {
    expect(
      buildCheckoutRecommendationsQuery({
        serviceId: 'svc-1',
        categoryId: 'cat-1',
      }),
    ).toBe('serviceId=svc-1&categoryId=cat-1');
    expect(buildCheckoutRecommendationsQuery({ serviceId: 'svc-1' })).toBe(
      'serviceId=svc-1',
    );
    expect(buildCheckoutRecommendationsQuery({})).toBe('');
    expect(
      buildCheckoutRecommendationsPath('glow-salon', {
        serviceId: 'svc-1',
        categoryId: 'cat-1',
      }),
    ).toBe('/public/glow-salon/checkout/recommendations?serviceId=svc-1&categoryId=cat-1');
    expect(buildCheckoutRecommendationsPath('glow-salon', {})).toBe(
      '/public/glow-salon/checkout/recommendations',
    );
  });

  it('maps booked service to checkout recommendation params', () => {
    expect(
      buildCheckoutRecommendationParams({
        id: 'svc-haircut',
        category: { id: 'cat-hair', name: 'Hair' },
      }),
    ).toEqual({ serviceId: 'svc-haircut', categoryId: 'cat-hair' });
    expect(buildCheckoutRecommendationParams({ id: 'svc-solo' })).toEqual({
      serviceId: 'svc-solo',
      categoryId: undefined,
    });
  });

  it('computes booking success end time from duration', () => {
    expect(
      computeBookingSuccessEndTime('2026-08-15T10:00:00.000Z', 90),
    ).toBe('2026-08-15T11:30:00.000Z');
    expect(
      computeBookingSuccessEndTime('2026-08-15T10:00:00.000Z', 60),
    ).toBe('2026-08-15T11:00:00.000Z');
  });

  it('resolves products from query data and errors', () => {
    expect(resolveRecommendationProductsFromQuery(undefined, false)).toEqual([]);
    expect(
      resolveRecommendationProductsFromQuery({ products: [shampoo] }, false),
    ).toEqual([shampoo]);
    expect(
      resolveRecommendationProductsFromQuery({ products: [shampoo] }, true),
    ).toEqual([]);
  });

  it('dedupes impression product ids for analytics tracking', () => {
    const seen = new Set<string>();
    expect(collectNewImpressionProductIds(['prod-1', 'prod-2'], seen)).toEqual([
      'prod-1',
      'prod-2',
    ]);
    expect(collectNewImpressionProductIds(['prod-1', '', ' prod-3 '], seen)).toEqual(['prod-3']);
  });

  it('builds card view models with optional fields', () => {
    const formatPrice = (amount: number) => `$${amount}`;
    const resolveImage = (url?: string | null) =>
      url ? `https://api.test${url}` : undefined;

    expect(
      buildRecommendationCardViewModel(shampoo, formatPrice, resolveImage),
    ).toEqual({
      id: 'prod-1',
      name: 'Shampoo',
      imageUrl: 'https://api.test/uploads/shampoo.jpg',
      priceLabel: '$28',
      description: 'Color-safe',
      externalLink: 'https://shop.example/shampoo',
    });

    expect(
      buildRecommendationCardViewModel(
        { id: 'prod-2', name: 'Comb' },
        formatPrice,
        resolveImage,
      ),
    ).toEqual({
      id: 'prod-2',
      name: 'Comb',
      imageUrl: undefined,
      priceLabel: null,
      description: undefined,
      externalLink: undefined,
    });
  });
});
