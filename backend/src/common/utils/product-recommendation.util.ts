export interface RecommendationLink {
  productId: string;
  sortOrder: number;
}

export interface RecommendationProduct {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  externalLink?: string | null;
  retailPrice?: number | null;
  isActive: boolean;
}

export interface PublicRecommendationProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  externalLink?: string;
  price?: number;
}

export function resolveCheckoutRecommendations(input: {
  maxCount: number;
  serviceLinks: RecommendationLink[];
  categoryLinks: RecommendationLink[];
  products: RecommendationProduct[];
}): RecommendationProduct[] {
  const productMap = new Map(
    input.products
      .filter((product) => product.isActive)
      .map((product) => [product.id, product]),
  );

  const fromService = pickLinkedProducts(
    input.serviceLinks,
    productMap,
    input.maxCount,
  );
  if (fromService.length > 0) return fromService;

  return pickLinkedProducts(input.categoryLinks, productMap, input.maxCount);
}

export function mapPublicRecommendationProduct(
  product: RecommendationProduct,
): PublicRecommendationProduct {
  const mapped: PublicRecommendationProduct = {
    id: product.id,
    name: product.name,
  };
  const description = product.description?.trim();
  if (description) mapped.description = description;
  const imageUrl = product.imageUrl?.trim();
  if (imageUrl) mapped.imageUrl = imageUrl;
  const externalLink = product.externalLink?.trim();
  if (externalLink) mapped.externalLink = externalLink;
  const price = Number(product.retailPrice);
  if (Number.isFinite(price) && price > 0) mapped.price = price;
  return mapped;
}

function pickLinkedProducts(
  links: RecommendationLink[],
  productMap: Map<string, RecommendationProduct>,
  maxCount: number,
): RecommendationProduct[] {
  const sorted = [...links].sort((a, b) => a.sortOrder - b.sortOrder);
  const picked: RecommendationProduct[] = [];
  const seen = new Set<string>();

  for (const link of sorted) {
    if (picked.length >= maxCount) break;
    if (seen.has(link.productId)) continue;
    const product = productMap.get(link.productId);
    if (!product) continue;
    seen.add(link.productId);
    picked.push(product);
  }

  return picked;
}

export function normalizeRecommendationProductIds(
  productIds: string[] | undefined,
): RecommendationLink[] {
  if (!Array.isArray(productIds)) return [];
  const links: RecommendationLink[] = [];
  const seen = new Set<string>();
  productIds.forEach((rawId, index) => {
    const productId = String(rawId ?? '').trim();
    if (!productId || seen.has(productId)) return;
    seen.add(productId);
    links.push({ productId, sortOrder: index });
  });
  return links;
}
