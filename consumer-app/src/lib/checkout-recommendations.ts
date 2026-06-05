import { formatRecommendationPrice } from './product-recommendation.js';
import type { PublicRecommendationProduct, PublicService } from './types.js';

export function buildCheckoutRecommendationsQuery(params: {
  serviceId?: string;
  categoryId?: string;
}): string {
  const q = new URLSearchParams();
  if (params.serviceId) q.set('serviceId', params.serviceId);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  return q.toString();
}

export function buildCheckoutRecommendationsPath(
  slug: string,
  params: { serviceId?: string; categoryId?: string },
): string {
  const query = buildCheckoutRecommendationsQuery(params);
  return `/public/${slug}/checkout/recommendations${query ? `?${query}` : ''}`;
}

export function buildCheckoutRecommendationParams(
  service: Pick<PublicService, 'id' | 'category'>,
): { serviceId: string; categoryId?: string } {
  return {
    serviceId: service.id,
    categoryId: service.category?.id,
  };
}

export function computeBookingSuccessEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const startMs = new Date(startTime).getTime();
  return new Date(startMs + durationMinutes * 60_000).toISOString();
}

export function resolveRecommendationProductsFromQuery(
  data: { products?: PublicRecommendationProduct[] } | undefined,
  isError: boolean,
): PublicRecommendationProduct[] {
  if (isError) return [];
  return data?.products ?? [];
}

export interface RecommendationCardViewModel {
  id: string;
  name: string;
  imageUrl?: string;
  priceLabel: string | null;
  description?: string;
  externalLink?: string;
}

export function buildRecommendationCardViewModel(
  product: PublicRecommendationProduct,
  formatPrice: (amount: number) => string,
  resolveImage: (url?: string | null) => string | undefined,
): RecommendationCardViewModel {
  return {
    id: product.id,
    name: product.name,
    imageUrl: resolveImage(product.imageUrl),
    priceLabel: formatRecommendationPrice(product.price, formatPrice),
    description: product.description,
    externalLink: product.externalLink,
  };
}

export function collectNewImpressionProductIds(
  productIds: string[],
  seen: Set<string>,
): string[] {
  const fresh: string[] = [];
  for (const id of productIds) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    fresh.push(trimmed);
  }
  return fresh;
}
