import { describe, expect, it } from 'vitest';
import {
  formatRecommendationPrice,
  hasCheckoutRecommendations,
  shouldShowRecommendationsSection,
} from './product-recommendation';

describe('product-recommendation', () => {
  it('detects when recommendations exist', () => {
    expect(hasCheckoutRecommendations([{ id: 'p1', name: 'Shampoo' }])).toBe(true);
    expect(hasCheckoutRecommendations([])).toBe(false);
    expect(hasCheckoutRecommendations(null)).toBe(false);
    expect(hasCheckoutRecommendations(undefined)).toBe(false);
  });

  it('shows section only when not dismissed and products exist', () => {
    expect(
      shouldShowRecommendationsSection(false, [{ id: 'p1', name: 'Shampoo' }]),
    ).toBe(true);
    expect(shouldShowRecommendationsSection(true, [{ id: 'p1', name: 'Shampoo' }])).toBe(
      false,
    );
    expect(shouldShowRecommendationsSection(false, [])).toBe(false);
    expect(shouldShowRecommendationsSection(false, undefined)).toBe(false);
  });

  it('formats optional display prices', () => {
    const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;
    expect(formatRecommendationPrice(25, formatPrice)).toBe('$25.00');
    expect(formatRecommendationPrice(0, formatPrice)).toBeNull();
    expect(formatRecommendationPrice(undefined, formatPrice)).toBeNull();
    expect(formatRecommendationPrice(Number.NaN, formatPrice)).toBeNull();
  });
});
