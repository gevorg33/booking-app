import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

describe('InventoryService', () => {
  const productRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const linkRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const serviceRepo = { findOne: jest.fn() };

  const service = new InventoryService(
    productRepo as any,
    linkRepo as any,
    serviceRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    productRepo.create.mockImplementation((v) => v);
    productRepo.save.mockImplementation(async (v) => ({ id: 'prod-1', ...v }));
    linkRepo.create.mockImplementation((v) => v);
    linkRepo.save.mockImplementation(async (v) => ({ id: 'link-1', ...v }));
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', businessId: 'biz-1', name: 'Cut' });
    productRepo.findOne.mockResolvedValue({
      id: 'prod-1',
      businessId: 'biz-1',
      name: 'Shampoo',
      quantityOnHand: 10,
      isActive: true,
    });
  });

  it('lists products for business', async () => {
    productRepo.find.mockResolvedValue([{ id: 'p1' }]);
    await expect(service.listProducts('biz-1')).resolves.toEqual([{ id: 'p1' }]);
    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1', isActive: true } }),
    );
  });

  it('creates product', async () => {
    const created = await service.createProduct('biz-1', { name: 'Gloves', unitCost: 2 });
    expect(created.name).toBe('Gloves');
  });

  it('links product to service and upserts quantity', async () => {
    linkRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'link-1',
        serviceId: 'svc-1',
        productId: 'prod-1',
        quantityPerService: 2,
      });
    linkRepo.save.mockImplementation(async (v) => v);

    await service.linkToService('biz-1', 'svc-1', 'prod-1', 2);
    expect(linkRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: 'svc-1', productId: 'prod-1', quantityPerService: 2 }),
    );

    await service.linkToService('biz-1', 'svc-1', 'prod-1', 3);
    expect(linkRepo.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ quantityPerService: 3 }),
    );
  });

  it('rejects link when product missing', async () => {
    productRepo.findOne.mockResolvedValue(null);
    await expect(service.linkToService('biz-1', 'svc-1', 'prod-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects link when service missing', async () => {
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(service.linkToService('biz-1', 'svc-x', 'prod-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists service links for business', async () => {
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 'link-1',
        serviceId: 'svc-1',
        productId: 'prod-1',
        quantityPerService: 2,
        service: { name: 'Cut' },
        product: { name: 'Color' },
      },
    ]);
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    linkRepo.createQueryBuilder.mockReturnValue(qb);

    const links = await service.listServiceLinks('biz-1', { serviceId: 'svc-1' });
    expect(links).toEqual([
      expect.objectContaining({
        serviceName: 'Cut',
        productName: 'Color',
        quantityPerService: 2,
      }),
    ]);
    expect(qb.andWhere).toHaveBeenCalledWith('link.service_id = :serviceId', { serviceId: 'svc-1' });
  });

  it('filters service links by product id', async () => {
    const getMany = jest.fn().mockResolvedValue([]);
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany,
    };
    linkRepo.createQueryBuilder.mockReturnValue(qb);
    await service.listServiceLinks('biz-1', { productId: 'prod-1' });
    expect(qb.andWhere).toHaveBeenCalledWith('link.product_id = :productId', { productId: 'prod-1' });
  });

  it('unlinks service product for business', async () => {
    linkRepo.findOne.mockResolvedValue({
      id: 'link-1',
      product: { businessId: 'biz-1' },
    });
    await expect(service.unlinkServiceProduct('link-1', 'biz-1')).resolves.toEqual({ removed: true });
    expect(linkRepo.delete).toHaveBeenCalledWith('link-1');
  });

  it('rejects unlink for foreign business', async () => {
    linkRepo.findOne.mockResolvedValue({
      id: 'link-1',
      product: { businessId: 'other' },
    });
    await expect(service.unlinkServiceProduct('link-1', 'biz-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deducts linked stock on completed service', async () => {
    linkRepo.find.mockResolvedValue([
      {
        quantityPerService: 1.5,
        product: { id: 'prod-1', quantityOnHand: 10 },
      },
    ]);
    productRepo.save.mockImplementation(async (p) => p);

    await service.deductForService('svc-1');
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityOnHand: 8 }),
    );
  });

  it('skips deduct when linked product missing', async () => {
    linkRepo.find.mockResolvedValue([{ quantityPerService: 1, product: null }]);
    await service.deductForService('svc-1');
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('lists products filtered by location', async () => {
    productRepo.find.mockResolvedValue([]);
    await service.listProducts('biz-1', 'loc-1');
    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1', isActive: true, locationId: 'loc-1' } }),
    );
  });

  it('throws when adjusting missing product', async () => {
    productRepo.findOne.mockResolvedValue(null);
    await expect(service.adjustStock('prod-x', 'biz-1', 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adjusts stock and floors at zero', async () => {
    productRepo.findOne.mockResolvedValue({ id: 'prod-1', businessId: 'biz-1', quantityOnHand: 2 });
    productRepo.save.mockImplementation(async (p) => p);
    await service.adjustStock('prod-1', 'biz-1', -5);
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityOnHand: 0 }),
    );
  });
});
