import {
  mapPublicRecommendationProduct,
  normalizeRecommendationProductIds,
  resolveCheckoutRecommendations,
} from './product-recommendation.util.js';

const products = [
  {
    id: 'p1',
    name: 'Shampoo',
    description: 'Daily care',
    imageUrl: '/img/shampoo.jpg',
    externalLink: 'https://shop.test/shampoo',
    retailPrice: 25,
    isActive: true,
  },
  {
    id: 'p2',
    name: 'Conditioner',
    description: '  ',
    imageUrl: '',
    externalLink: null,
    retailPrice: 0,
    isActive: true,
  },
  {
    id: 'p3',
    name: 'Inactive',
    isActive: false,
  },
];

describe('product-recommendation.util', () => {
  it('prefers service-level links over category fallback', () => {
    const result = resolveCheckoutRecommendations({
      maxCount: 5,
      serviceLinks: [{ productId: 'p1', sortOrder: 0 }],
      categoryLinks: [{ productId: 'p2', sortOrder: 0 }],
      products,
    });
    expect(result.map((p) => p.id)).toEqual(['p1']);
  });

  it('falls back to category links when service has none', () => {
    const result = resolveCheckoutRecommendations({
      maxCount: 5,
      serviceLinks: [],
      categoryLinks: [
        { productId: 'p2', sortOrder: 1 },
        { productId: 'p1', sortOrder: 0 },
      ],
      products,
    });
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('deduplicates duplicate product ids in link lists', () => {
    const result = resolveCheckoutRecommendations({
      maxCount: 5,
      serviceLinks: [
        { productId: 'p1', sortOrder: 0 },
        { productId: 'p1', sortOrder: 1 },
      ],
      categoryLinks: [],
      products,
    });
    expect(result.map((p) => p.id)).toEqual(['p1']);
  });

  it('respects max product count and skips inactive products', () => {
    const result = resolveCheckoutRecommendations({
      maxCount: 1,
      serviceLinks: [
        { productId: 'p3', sortOrder: 0 },
        { productId: 'p1', sortOrder: 1 },
      ],
      categoryLinks: [],
      products,
    });
    expect(result.map((p) => p.id)).toEqual(['p1']);
  });

  it('skips links whose product id is missing from the catalog', () => {
    const result = resolveCheckoutRecommendations({
      maxCount: 5,
      serviceLinks: [
        { productId: 'missing', sortOrder: 0 },
        { productId: 'p1', sortOrder: 1 },
      ],
      categoryLinks: [],
      products,
    });
    expect(result.map((p) => p.id)).toEqual(['p1']);
  });

  it('returns empty when no active linked products exist', () => {
    expect(
      resolveCheckoutRecommendations({
        maxCount: 5,
        serviceLinks: [{ productId: 'p3', sortOrder: 0 }],
        categoryLinks: [],
        products,
      }),
    ).toEqual([]);
  });

  it('stops picking after max count even with more links', () => {
    const manyProducts = [
      { id: 'p1', name: 'One', isActive: true },
      { id: 'p2', name: 'Two', isActive: true },
      { id: 'p3', name: 'Three', isActive: true },
    ];
    const result = resolveCheckoutRecommendations({
      maxCount: 2,
      serviceLinks: [
        { productId: 'p1', sortOrder: 0 },
        { productId: 'p2', sortOrder: 1 },
        { productId: 'p3', sortOrder: 2 },
      ],
      categoryLinks: [],
      products: manyProducts,
    });
    expect(result).toHaveLength(2);
  });

  it('maps public recommendation fields and omits empty optional values', () => {
    expect(mapPublicRecommendationProduct(products[0])).toEqual({
      id: 'p1',
      name: 'Shampoo',
      description: 'Daily care',
      imageUrl: '/img/shampoo.jpg',
      externalLink: 'https://shop.test/shampoo',
      price: 25,
    });
    expect(mapPublicRecommendationProduct(products[1])).toEqual({
      id: 'p2',
      name: 'Conditioner',
    });
    expect(
      mapPublicRecommendationProduct({
        id: 'p4',
        name: 'Serum',
        externalLink: '   ',
        isActive: true,
      }),
    ).toEqual({ id: 'p4', name: 'Serum' });
  });

  it('normalizes recommendation product ids with order and dedupe', () => {
    expect(
      normalizeRecommendationProductIds(['p2', ' p1 ', 'p2', '', 'p1']),
    ).toEqual([
      { productId: 'p2', sortOrder: 0 },
      { productId: 'p1', sortOrder: 1 },
    ]);
    expect(normalizeRecommendationProductIds(undefined)).toEqual([]);
    expect(
      normalizeRecommendationProductIds([null as unknown as string, 'p1']),
    ).toEqual([{ productId: 'p1', sortOrder: 1 }]);
  });
});
