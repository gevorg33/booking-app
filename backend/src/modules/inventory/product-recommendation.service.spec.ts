import { NotFoundException } from '@nestjs/common';
import { ProductRecommendationService } from './product-recommendation.service.js';

describe('ProductRecommendationService', () => {
  const products = [
    {
      id: 'prod-1',
      businessId: 'biz-1',
      name: 'Shampoo',
      description: 'Daily care',
      imageUrl: '/img/shampoo.jpg',
      externalLink: 'https://shop.test',
      retailPrice: 25,
      isActive: true,
    },
    {
      id: 'prod-2',
      businessId: 'biz-1',
      name: 'Mask',
      retailPrice: 40,
      isActive: true,
    },
  ];

  const serviceLinkRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const categoryLinkRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value) => value),
  };
  const productRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const serviceRepo = {
    findOne: jest.fn(),
  };
  const categoryRepo = {
    findOne: jest.fn(),
  };
  const eventStore = {
    publish: jest.fn(),
  };

  const service = new ProductRecommendationService(
    productRepo as any,
    serviceLinkRepo as any,
    categoryLinkRepo as any,
    serviceRepo as any,
    categoryRepo as any,
    eventStore as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', businessId: 'biz-1' });
    categoryRepo.findOne.mockResolvedValue({
      id: 'cat-1',
      businessId: 'biz-1',
    });
  });

  it('returns service-linked products for checkout', async () => {
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      categoryId: 'cat-1',
      isActive: true,
    });
    serviceLinkRepo.find.mockResolvedValue([
      { productId: 'prod-1', sortOrder: 0 },
    ]);
    categoryLinkRepo.find.mockResolvedValue([]);
    productRepo.find.mockResolvedValue([products[0]]);

    const result = await service.getCheckoutRecommendations(
      {
        id: 'biz-1',
        settings: {
          publicBooking: { recommendations: { maxProductCount: 5 } },
        },
      } as any,
      'svc-1',
    );

    expect(result).toEqual([
      {
        id: 'prod-1',
        name: 'Shampoo',
        description: 'Daily care',
        imageUrl: '/img/shampoo.jpg',
        externalLink: 'https://shop.test',
        price: 25,
      },
    ]);
  });

  it('falls back to category recommendations when service has none', async () => {
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      categoryId: 'cat-1',
      isActive: true,
    });
    serviceLinkRepo.find.mockResolvedValue([]);
    categoryLinkRepo.find.mockResolvedValue([
      { productId: 'prod-2', sortOrder: 0 },
    ]);
    productRepo.find.mockResolvedValue([products[1]]);

    const result = await service.getCheckoutRecommendations(
      { id: 'biz-1', settings: {} } as any,
      'svc-1',
    );

    expect(result[0]?.id).toBe('prod-2');
  });

  it('lists and replaces service recommendation links', async () => {
    serviceLinkRepo.find.mockResolvedValue([
      { productId: 'prod-1', sortOrder: 0 },
    ]);
    productRepo.count.mockResolvedValue(2);
    serviceLinkRepo.delete.mockResolvedValue(undefined);
    serviceLinkRepo.save.mockResolvedValue([]);

    await expect(
      service.listServiceRecommendations('biz-1', 'svc-1'),
    ).resolves.toEqual(['prod-1']);

    const result = await service.setServiceRecommendations('biz-1', 'svc-1', [
      'prod-2',
      'prod-1',
    ]);

    expect(serviceLinkRepo.delete).toHaveBeenCalledWith({ serviceId: 'svc-1' });
    expect(serviceLinkRepo.save).toHaveBeenCalledWith([
      { serviceId: 'svc-1', productId: 'prod-2', sortOrder: 0 },
      { serviceId: 'svc-1', productId: 'prod-1', sortOrder: 1 },
    ]);
    expect(result).toEqual(['prod-2', 'prod-1']);
  });

  it('lists and replaces category recommendation links', async () => {
    categoryLinkRepo.find.mockResolvedValue([
      { productId: 'prod-2', sortOrder: 0 },
    ]);
    productRepo.count.mockResolvedValue(1);
    categoryLinkRepo.delete.mockResolvedValue(undefined);
    categoryLinkRepo.save.mockResolvedValue([]);

    await expect(
      service.listCategoryRecommendations('biz-1', 'cat-1'),
    ).resolves.toEqual(['prod-2']);

    const result = await service.setCategoryRecommendations('biz-1', 'cat-1', [
      'prod-1',
    ]);

    expect(categoryLinkRepo.delete).toHaveBeenCalledWith({
      categoryId: 'cat-1',
    });
    expect(result).toEqual(['prod-1']);
  });

  it('clears links without saving when product list is empty', async () => {
    productRepo.count.mockResolvedValue(0);
    const result = await service.setServiceRecommendations(
      'biz-1',
      'svc-1',
      [],
    );
    expect(serviceLinkRepo.save).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('returns empty checkout recommendations when no links exist', async () => {
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      categoryId: 'cat-1',
      isActive: true,
    });
    serviceLinkRepo.find.mockResolvedValue([]);
    categoryLinkRepo.find.mockResolvedValue([]);

    const result = await service.getCheckoutRecommendations(
      { id: 'biz-1', settings: {} } as any,
      'svc-1',
    );
    expect(result).toEqual([]);
    expect(productRepo.find).not.toHaveBeenCalled();
  });

  it('rejects missing service, category, and product references', async () => {
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(
      service.setServiceRecommendations('biz-1', 'svc-x', ['prod-1']),
    ).rejects.toBeInstanceOf(NotFoundException);

    categoryRepo.findOne.mockResolvedValue(null);
    await expect(
      service.setCategoryRecommendations('biz-1', 'cat-x', ['prod-1']),
    ).rejects.toBeInstanceOf(NotFoundException);

    productRepo.count.mockResolvedValue(0);
    await expect(
      service.setServiceRecommendations('biz-1', 'svc-1', ['prod-missing']),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
