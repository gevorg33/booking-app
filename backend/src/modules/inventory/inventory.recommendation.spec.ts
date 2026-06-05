import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

describe('InventoryService recommendation product fields', () => {
  const productRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
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
    productRepo.create.mockImplementation((value) => value);
    productRepo.save.mockImplementation(async (value) => ({
      id: 'prod-rec-1',
      ...value,
    }));
  });

  it('creates recommendation product with description, image, and external link', async () => {
    const created = await service.createProduct('biz-1', {
      name: 'Repair shampoo',
      retailPrice: 28,
      description: '  For color-treated hair  ',
      imageUrl: ' /uploads/shampoo.jpg ',
      externalLink: 'https://shop.test/shampoo',
      isActive: true,
    });

    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'For color-treated hair',
        imageUrl: '/uploads/shampoo.jpg',
        externalLink: 'https://shop.test/shampoo',
        isActive: true,
      }),
    );
    expect(created.name).toBe('Repair shampoo');
  });

  it('lists inactive products when includeInactive is true', async () => {
    productRepo.find.mockResolvedValue([]);
    await service.listProducts('biz-1', undefined, true);
    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: 'biz-1' },
      }),
    );
  });

  it('updates recommendation fields and clears empty strings', async () => {
    productRepo.findOne.mockResolvedValue({
      id: 'prod-rec-1',
      businessId: 'biz-1',
      name: 'Mask',
      description: 'Old',
      imageUrl: '/old.jpg',
      externalLink: 'https://old.test',
      isActive: true,
    });
    productRepo.save.mockImplementation(async (value) => value);

    const updated = await service.updateProduct('prod-rec-1', 'biz-1', {
      description: '  ',
      imageUrl: '',
      externalLink: '  ',
      isActive: false,
    });

    expect(updated.description).toBeNull();
    expect(updated.imageUrl).toBeNull();
    expect(updated.externalLink).toBeNull();
    expect(updated.isActive).toBe(false);
  });

  it('rejects update for missing product', async () => {
    productRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateProduct('missing', 'biz-1', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
