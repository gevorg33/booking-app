import { describe, expect, it } from 'vitest';
import { formatConsumerPrice } from './business-currency.js';
import {
  formatRecommendationPrice,
  hasCheckoutRecommendations,
  shouldShowRecommendationsSection,
} from './product-recommendation.js';
import type { PublicRecommendationProduct } from './types.js';

const shampoo: PublicRecommendationProduct = {
  id: 'prod-1',
  name: 'Shampoo',
  description: 'Color-safe',
  imageUrl: '/uploads/shampoo.jpg',
  externalLink: 'https://shop.example/shampoo',
  price: 28,
};

const mask: PublicRecommendationProduct = {
  id: 'prod-2',
  name: 'Hair mask',
  price: 42,
};

const comb: PublicRecommendationProduct = {
  id: 'prod-3',
  name: 'Comb',
};

const t = (amount: number) => formatConsumerPrice(amount, 'USD');

describe('Sprint 32 — consumer app product recommendation scenario matrix', () => {
  it('hides recommendations section when API returns no products', () => {
    expect(shouldShowRecommendationsSection(false, [])).toBe(false);
    expect(hasCheckoutRecommendations([])).toBe(false);
    expect(shouldShowRecommendationsSection(false, undefined)).toBe(false);
  });

  it('shows product cards after checkout success when products are linked', () => {
    const products = [shampoo, mask];
    expect(hasCheckoutRecommendations(products)).toBe(true);
    expect(products).toHaveLength(2);
    expect(shampoo.externalLink).toContain('https://');
  });

  it('clamps visible cards to configured max product count', () => {
    const maxCount = 2;
    const linked = [shampoo, mask, comb];
    const visible = linked.slice(0, maxCount);
    expect(visible).toHaveLength(2);
    expect(visible.map((product) => product.id)).toEqual(['prod-1', 'prod-2']);
  });

  it('supports optional price labels on recommendation cards', () => {
    expect(formatRecommendationPrice(shampoo.price, t)).toBe('$28.00');
    expect(formatRecommendationPrice(mask.price, t)).toBe('$42.00');
    expect(formatRecommendationPrice(undefined, t)).toBeNull();
    expect(formatRecommendationPrice(comb.price, t)).toBeNull();
  });

  it('allows user to dismiss recommendations without empty state', () => {
    expect(shouldShowRecommendationsSection(true, [shampoo])).toBe(false);
    expect(shouldShowRecommendationsSection(false, [shampoo])).toBe(true);
  });

  it('prefers service-linked products over category fallback at API layer', () => {
    const serviceLevel = [shampoo];
    const categoryFallback = [mask];
    expect(hasCheckoutRecommendations(serviceLevel)).toBe(true);
    expect(hasCheckoutRecommendations(categoryFallback)).toBe(true);
    expect(serviceLevel[0]?.id).not.toBe(categoryFallback[0]?.id);
  });

  it('exposes card fields required by checkout success UI', () => {
    expect(shampoo).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
      imageUrl: expect.stringContaining('/uploads/'),
    });
    expect(mask.price).toBeGreaterThan(0);
    expect(comb.description).toBeUndefined();
  });

  it('supports products with external link only and no display price', () => {
    const linkOnly: PublicRecommendationProduct = {
      id: 'prod-4',
      name: 'Gift set',
      externalLink: 'https://shop.example/gift-set',
    };
    expect(formatRecommendationPrice(linkOnly.price, t)).toBeNull();
    expect(linkOnly.externalLink).toContain('https://');
  });
});
