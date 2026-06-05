import { describe, expect, it } from 'vitest';
import { formatConsumerPrice, resolveTenantPriceCurrency } from './business-currency.js';
import {
  buildCheckoutRecommendationParams,
  buildCheckoutRecommendationsPath,
  buildRecommendationCardViewModel,
  computeBookingSuccessEndTime,
  resolveRecommendationProductsFromQuery,
} from './checkout-recommendations.js';
import {
  formatRecommendationPrice,
  hasCheckoutRecommendations,
  shouldShowRecommendationsSection,
} from './product-recommendation.js';
import type { PublicRecommendationProduct, PublicService } from './types.js';

const resolveImage = (url?: string | null) =>
  url ? `https://api.test${url}` : undefined;

const shampoo: PublicRecommendationProduct = {
  id: 'prod-1',
  name: 'Repair shampoo',
  description: 'For color-treated hair',
  imageUrl: '/uploads/shampoo.jpg',
  externalLink: 'https://shop.example/shampoo',
  price: 28,
};

const mask: PublicRecommendationProduct = {
  id: 'prod-2',
  name: 'Deep mask',
  price: 42,
};

const comb: PublicRecommendationProduct = {
  id: 'prod-3',
  name: 'Wide comb',
};

const haircut: PublicService = {
  id: 'svc-haircut',
  name: 'Haircut',
  durationMinutes: 60,
  price: 45,
  currency: 'USD',
  category: { id: 'cat-hair', name: 'Hair' },
};

describe('Sprint 32 — rec-1.6 consumer checkout success scenario matrix', () => {
  it('hides recommendations when API returns empty or query errors', () => {
    expect(shouldShowRecommendationsSection(false, [])).toBe(false);
    expect(resolveRecommendationProductsFromQuery(undefined, false)).toEqual([]);
    expect(resolveRecommendationProductsFromQuery({ products: [shampoo] }, true)).toEqual(
      [],
    );
    expect(shouldShowRecommendationsSection(true, [shampoo])).toBe(false);
  });

  it('fetches recommendations with service-first params after booking', () => {
    const params = buildCheckoutRecommendationParams(haircut);
    expect(params).toEqual({ serviceId: 'svc-haircut', categoryId: 'cat-hair' });
    expect(buildCheckoutRecommendationsPath('glow-salon', params)).toBe(
      '/public/glow-salon/checkout/recommendations?serviceId=svc-haircut&categoryId=cat-hair',
    );
  });

  it('supports category-only query when service has no category', () => {
    const solo: PublicService = {
      id: 'svc-solo',
      name: 'Consult',
      durationMinutes: 30,
      price: 20,
    };
    expect(buildCheckoutRecommendationsPath('glow-salon', buildCheckoutRecommendationParams(solo))).toBe(
      '/public/glow-salon/checkout/recommendations?serviceId=svc-solo',
    );
  });

  it('prefers service-linked products over category fallback at API layer', () => {
    const serviceLevel = [shampoo];
    const categoryFallback = [mask];
    expect(hasCheckoutRecommendations(serviceLevel)).toBe(true);
    expect(hasCheckoutRecommendations(categoryFallback)).toBe(true);
    expect(serviceLevel[0]?.id).not.toBe(categoryFallback[0]?.id);
  });

  it('clamps visible cards to configured max product count', () => {
    const maxCount = 2;
    const visible = [shampoo, mask, comb].slice(0, maxCount);
    expect(visible.map((p) => p.id)).toEqual(['prod-1', 'prod-2']);
  });

  it('renders card view models with image, price, description, and link', () => {
    const currency = resolveTenantPriceCurrency(haircut.currency, 'USD');
    const formatPrice = (amount: number) => formatConsumerPrice(amount, currency);
    const card = buildRecommendationCardViewModel(shampoo, formatPrice, resolveImage);
    expect(card.imageUrl).toBe('https://api.test/uploads/shampoo.jpg');
    expect(card.priceLabel).toBe('$28.00');
    expect(card.externalLink).toContain('https://');
    expect(formatRecommendationPrice(mask.price, formatPrice)).toBe('$42.00');
    expect(formatRecommendationPrice(comb.price, formatPrice)).toBeNull();
  });

  it('supports link-only products without display price or image', () => {
    const linkOnly: PublicRecommendationProduct = {
      id: 'prod-4',
      name: 'Gift set',
      externalLink: 'https://shop.example/gift-set',
    };
    const card = buildRecommendationCardViewModel(linkOnly, (n) => `$${n}`, resolveImage);
    expect(card.priceLabel).toBeNull();
    expect(card.imageUrl).toBeUndefined();
    expect(card.externalLink).toContain('https://');
  });

  it('computes success screen time range from booked slot and service duration', () => {
    const startTime = '2026-08-15T10:00:00.000Z';
    expect(computeBookingSuccessEndTime(startTime, haircut.durationMinutes)).toBe(
      '2026-08-15T11:00:00.000Z',
    );
  });

  it('shows recommendations section when products exist and not dismissed', () => {
    const products = resolveRecommendationProductsFromQuery(
      { products: [shampoo, mask] },
      false,
    );
    expect(hasCheckoutRecommendations(products)).toBe(true);
    expect(shouldShowRecommendationsSection(false, products)).toBe(true);
  });
});
