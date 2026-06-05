import { NotFoundException } from '@nestjs/common';
import { ProductRecommendationService } from './product-recommendation.service.js';

function extractIdList(idFilter: unknown): string[] {
  if (Array.isArray(idFilter)) return idFilter as string[];
  if (
    idFilter &&
    typeof idFilter === 'object' &&
    '_value' in idFilter &&
    Array.isArray(idFilter._value)
  ) {
    return (idFilter as { _value: string[] })._value;
  }
  if (typeof idFilter === 'string') return [idFilter];
  return [];
}

function createRecommendationHarness() {
  const products = [
    {
      id: 'prod-1',
      businessId: 'biz-1',
      name: 'Shampoo',
      description: 'Daily care',
      imageUrl: '/img/shampoo.jpg',
      externalLink: 'https://shop.test/shampoo',
      retailPrice: 25,
      isActive: true,
    },
    {
      id: 'prod-2',
      businessId: 'biz-1',
      name: 'Conditioner',
      retailPrice: 18,
      isActive: true,
    },
    {
      id: 'prod-3',
      businessId: 'biz-1',
      name: 'Serum',
      retailPrice: 45,
      isActive: true,
    },
  ];

  const serviceLinks: Array<{
    serviceId: string;
    productId: string;
    sortOrder: number;
  }> = [];
  const categoryLinks: Array<{
    categoryId: string;
    productId: string;
    sortOrder: number;
  }> = [];

  const serviceLinkRepo = {
    find: jest.fn(async ({ where }: { where: { serviceId: string } }) =>
      serviceLinks
        .filter((link) => link.serviceId === where.serviceId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((link) => ({ ...link })),
    ),
    delete: jest.fn(async ({ serviceId }: { serviceId: string }) => {
      for (let i = serviceLinks.length - 1; i >= 0; i -= 1) {
        if (serviceLinks[i]?.serviceId === serviceId) serviceLinks.splice(i, 1);
      }
    }),
    save: jest.fn(async (links: Array<Record<string, unknown>>) => {
      serviceLinks.push(
        ...(links as Array<{
          serviceId: string;
          productId: string;
          sortOrder: number;
        }>),
      );
      return links;
    }),
    create: jest.fn((value) => value),
  };

  const categoryLinkRepo = {
    find: jest.fn(async ({ where }: { where: { categoryId: string } }) =>
      categoryLinks
        .filter((link) => link.categoryId === where.categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((link) => ({ ...link })),
    ),
    delete: jest.fn(async ({ categoryId }: { categoryId: string }) => {
      for (let i = categoryLinks.length - 1; i >= 0; i -= 1) {
        if (categoryLinks[i]?.categoryId === categoryId)
          categoryLinks.splice(i, 1);
      }
    }),
    save: jest.fn(async (links: Array<Record<string, unknown>>) => {
      categoryLinks.push(
        ...(links as Array<{
          categoryId: string;
          productId: string;
          sortOrder: number;
        }>),
      );
      return links;
    }),
    create: jest.fn((value) => value),
  };

  const productRepo = {
    find: jest.fn(
      async ({ where }: { where: { businessId: string; id: unknown } }) => {
        const idList = extractIdList(where.id);
        return products.filter(
          (product) =>
            product.businessId === where.businessId &&
            idList.includes(product.id) &&
            product.isActive,
        );
      },
    ),
    count: jest.fn(
      async ({ where }: { where: { businessId: string; id: unknown } }) => {
        const idList = extractIdList(where.id);
        return products.filter(
          (product) =>
            product.businessId === where.businessId &&
            idList.includes(product.id),
        ).length;
      },
    ),
  };

  const serviceRepo = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string; businessId: string } }) => {
        if (where.id === 'svc-1' && where.businessId === 'biz-1') {
          return {
            id: 'svc-1',
            businessId: 'biz-1',
            categoryId: 'cat-hair',
            isActive: true,
          };
        }
        return null;
      },
    ),
  };

  const categoryRepo = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string; businessId: string } }) => {
        if (
          where.businessId === 'biz-1' &&
          ['cat-hair', 'cat-spa'].includes(where.id)
        ) {
          return { id: where.id, businessId: 'biz-1', name: where.id };
        }
        return null;
      },
    ),
  };

  const eventStore = { publish: jest.fn().mockResolvedValue({}) };

  const recommendationService = new ProductRecommendationService(
    productRepo as any,
    serviceLinkRepo as any,
    categoryLinkRepo as any,
    serviceRepo as any,
    categoryRepo as any,
    eventStore as any,
  );

  return {
    recommendationService,
    serviceLinks,
    categoryLinks,
    products,
    business: {
      id: 'biz-1',
      settings: {
        publicBooking: { recommendations: { maxProductCount: 2 } },
      },
    },
  };
}

describe('Product recommendation checkout integration', () => {
  it('resolves service-linked products in selection order', async () => {
    const harness = createRecommendationHarness();
    await harness.recommendationService.setServiceRecommendations(
      'biz-1',
      'svc-1',
      ['prod-2', 'prod-1'],
    );

    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
        'svc-1',
      );

    expect(result.map((product) => product.id)).toEqual(['prod-2', 'prod-1']);
    expect(result[0]?.name).toBe('Conditioner');
  });

  it('falls back to category products when service has no links', async () => {
    const harness = createRecommendationHarness();
    await harness.recommendationService.setCategoryRecommendations(
      'biz-1',
      'cat-hair',
      ['prod-3', 'prod-1'],
    );

    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
        'svc-1',
      );

    expect(result.map((product) => product.id)).toEqual(['prod-3', 'prod-1']);
  });

  it('uses category query directly when only categoryId is provided', async () => {
    const harness = createRecommendationHarness();
    await harness.recommendationService.setCategoryRecommendations(
      'biz-1',
      'cat-spa',
      ['prod-2'],
    );

    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
        undefined,
        'cat-spa',
      );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('prod-2');
  });

  it('respects configured max product count', async () => {
    const harness = createRecommendationHarness();
    await harness.recommendationService.setServiceRecommendations(
      'biz-1',
      'svc-1',
      ['prod-1', 'prod-2', 'prod-3'],
    );

    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
        'svc-1',
      );

    expect(result).toHaveLength(2);
  });

  it('returns empty list when service is unknown', async () => {
    const harness = createRecommendationHarness();
    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
        'svc-missing',
      );
    expect(result).toEqual([]);
  });

  it('returns empty list when no service or category id is provided', async () => {
    const harness = createRecommendationHarness();
    const result =
      await harness.recommendationService.getCheckoutRecommendations(
        harness.business as any,
      );
    expect(result).toEqual([]);
  });

  it('clears service links when saving an empty product list', async () => {
    const harness = createRecommendationHarness();
    await harness.recommendationService.setServiceRecommendations(
      'biz-1',
      'svc-1',
      ['prod-1'],
    );
    await harness.recommendationService.setServiceRecommendations(
      'biz-1',
      'svc-1',
      [],
    );

    const listed =
      await harness.recommendationService.listServiceRecommendations(
        'biz-1',
        'svc-1',
      );
    expect(listed).toEqual([]);
  });

  it('rejects unknown product ids when linking recommendations', async () => {
    const harness = createRecommendationHarness();
    await expect(
      harness.recommendationService.setCategoryRecommendations(
        'biz-1',
        'cat-hair',
        ['prod-missing'],
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
