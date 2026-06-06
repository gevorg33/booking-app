import type { PublicRecommendationProduct } from './types.js';

export function hasCheckoutRecommendations(
  products: PublicRecommendationProduct[] | undefined | null,
): boolean {
  return Array.isArray(products) && products.length > 0;
}

export function shouldShowRecommendationsSection(
  dismissed: boolean,
  products: PublicRecommendationProduct[] | undefined | null,
): boolean {
  return !dismissed && hasCheckoutRecommendations(products);
}

export function formatRecommendationPrice(
  price: number | undefined,
  formatPrice: (amount: number) => string,
): string | null {
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  return formatPrice(price);
}
