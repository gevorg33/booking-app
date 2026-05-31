import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service.js';

describe('ServicePackagesService', () => {
  const packageRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
  const itemRepo = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const purchaseRepo = {
    count: jest.fn(),
    find: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({ id: 'purchase-1', ...v })),
  };
  const serviceRepo = { find: jest.fn() };
  const bookingRepo = {
    createQueryBuilder: jest.fn(),
  };

  const service = new ServicePackagesService(
    packageRepo as any,
    itemRepo as any,
    purchaseRepo as any,
    serviceRepo as any,
    bookingRepo as any,
  );

  const baseItems = [
    {
      id: 'item-1',
      serviceId: 'svc-1',
      quantity: 1,
      sortOrder: 0,
      service: { id: 'svc-1', name: 'Massage', price: 80, currency: 'USD', durationMinutes: 60 },
    },
    {
      id: 'item-2',
      serviceId: 'svc-2',
      quantity: 1,
      sortOrder: 1,
      service: { id: 'svc-2', name: 'Facial', price: 60, currency: 'USD', durationMinutes: 45 },
    },
  ];

  const basePackage = {
    id: 'pkg-1',
    businessId: 'biz-1',
    name: 'Spa day',
    description: 'Relax',
    imageUrl: null,
    discountType: 'percent',
    discountValue: 15,
    displayOrder: 0,
    isActive: true,
    expiresAt: null,
    items: baseItems,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    packageRepo.create.mockImplementation((v) => v);
    packageRepo.save.mockImplementation(async (v) => ({ id: 'pkg-1', ...v }));
    itemRepo.create.mockImplementation((v) => v);
    itemRepo.save.mockResolvedValue([]);
    serviceRepo.find.mockImplementation(async (opts: { where: { id: any } }) => {
      const ids = opts.where.id?.value ?? opts.where.id;
      const all = [
        { id: 'svc-1', businessId: 'biz-1', isActive: true },
        { id: 'svc-2', businessId: 'biz-1', isActive: true },
      ];
      return all.filter((svc) => ids.includes(svc.id));
    });
    packageRepo.findOne.mockImplementation(async () => ({
      ...basePackage,
      items: baseItems.map((item) => ({
        ...item,
        service: { ...item.service },
      })),
    }));
    packageRepo.find.mockResolvedValue([basePackage]);
    purchaseRepo.count.mockResolvedValue(0);
    purchaseRepo.find.mockResolvedValue([]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });
  });

  it('updates package expiration and discount validation', async () => {
    await service.updatePackage('biz-1', 'pkg-1', {
      expiresAt: '2099-12-31T23:59:59.000Z',
      discountValue: 20,
    });
    expect(packageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        discountValue: 20,
        expiresAt: new Date('2099-12-31T23:59:59.000Z'),
      }),
    );

    await expect(
      service.updatePackage('biz-1', 'pkg-1', { discountValue: 150, discountType: 'percent' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates package with items and preview', async () => {
    const created = await service.createPackage('biz-1', {
      name: 'Spa day',
      discountType: 'percent',
      discountValue: 15,
      items: [
        { serviceId: 'svc-1', quantity: 1 },
        { serviceId: 'svc-2', quantity: 1 },
      ],
    });
    expect(created.preview.pricing.packagePrice).toBe(119);
    expect(packageRepo.save).toHaveBeenCalled();
  });

  it('creates package with optional fields trimmed', async () => {
    await service.createPackage('biz-1', {
      name: '  Spa day  ',
      description: '  Nice  ',
      imageUrl: '  https://img.example/p.jpg  ',
      items: [{ serviceId: 'svc-1', quantity: 1 }],
    });
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spa day',
        description: 'Nice',
        imageUrl: 'https://img.example/p.jpg',
      }),
    );
  });

  it('rejects empty items, duplicate services, and invalid quantities', async () => {
    await expect(
      service.createPackage('biz-1', { name: 'Bad', items: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createPackage('biz-1', {
        name: 'Bad',
        items: [
          { serviceId: 'svc-1', quantity: 1 },
          { serviceId: 'svc-1', quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createPackage('biz-1', {
        name: 'Bad',
        items: [{ serviceId: 'svc-1', quantity: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing services and invalid discounts', async () => {
    serviceRepo.find.mockResolvedValue([{ id: 'svc-1', businessId: 'biz-1', isActive: true }]);
    await expect(
      service.createPackage('biz-1', {
        name: 'Bad',
        items: [
          { serviceId: 'svc-1', quantity: 1 },
          { serviceId: 'svc-2', quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.createPackage('biz-1', {
        name: 'Bad',
        discountType: 'percent',
        discountValue: 120,
        items: [{ serviceId: 'svc-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    serviceRepo.find.mockResolvedValue([{ id: 'svc-1', businessId: 'biz-1', isActive: true }]);
    await expect(
      service.createPackage('biz-1', {
        name: 'Bad',
        discountType: 'fixed',
        discountValue: -1,
        items: [{ serviceId: 'svc-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists packages with active and expired filters', async () => {
    const expiredPkg = {
      ...basePackage,
      id: 'pkg-2',
      expiresAt: new Date('2020-01-01'),
    };
    packageRepo.find.mockResolvedValue([basePackage, expiredPkg]);

    const active = await service.listPackages('biz-1', 'active');
    expect(active).toHaveLength(1);
    expect(active[0].status).toBe('active');

    const expired = await service.listPackages('biz-1', 'expired');
    expect(expired).toHaveLength(1);
    expect(expired[0].status).toBe('expired');
  });

  it('lists inactive packages', async () => {
    packageRepo.find.mockResolvedValue([{ ...basePackage, isActive: false }]);
    const result = await service.listPackages('biz-1', 'inactive');
    expect(result[0].status).toBe('inactive');
  });

  it('updates package and replaces items', async () => {
    await service.updatePackage('biz-1', 'pkg-1', {
      name: 'Updated spa',
      items: [{ serviceId: 'svc-1', quantity: 2 }],
    });
    expect(itemRepo.delete).toHaveBeenCalledWith({ packageId: 'pkg-1' });
    expect(itemRepo.save).toHaveBeenCalled();
  });

  it('deactivates and activates packages', async () => {
    await service.deactivatePackage('biz-1', 'pkg-1');
    expect(packageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));

    packageRepo.findOne.mockImplementation(async () => ({
      ...basePackage,
      isActive: false,
      items: baseItems,
    }));
    await service.activatePackage('biz-1', 'pkg-1');
    expect(packageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });

  it('rejects activating already active or expired packages', async () => {
    await expect(service.activatePackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    packageRepo.findOne.mockImplementationOnce(async () => ({
      ...basePackage,
      isActive: false,
      expiresAt: new Date('2020-01-01'),
      items: baseItems,
    }));
    await expect(service.activatePackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deletes inactive package without purchases or bookings', async () => {
    packageRepo.findOne.mockResolvedValue({ ...basePackage, isActive: false });
    const result = await service.deletePackage('biz-1', 'pkg-1');
    expect(result.deleted).toBe(true);
    expect(packageRepo.remove).toHaveBeenCalled();
  });

  it('blocks delete when active, has purchases, or future bookings', async () => {
    await expect(service.deletePackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    packageRepo.findOne.mockResolvedValue({ ...basePackage, isActive: false });
    purchaseRepo.count.mockResolvedValue(2);
    await expect(service.deletePackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    purchaseRepo.count.mockResolvedValue(0);
    purchaseRepo.find.mockResolvedValue([{ id: 'purchase-1' }]);
    bookingRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    });
    await expect(service.deletePackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('duplicates package as copy', async () => {
    packageRepo.findOne
      .mockImplementationOnce(async () => ({
        ...basePackage,
        items: baseItems.map((item) => ({ ...item, service: { ...item.service } })),
      }))
      .mockImplementationOnce(async () => ({
        ...basePackage,
        id: 'pkg-2',
        name: 'Spa day (Copy)',
        items: baseItems,
      }));
    packageRepo.save.mockImplementation(async (v) => ({
      id: 'pkg-2',
      ...v,
      items: baseItems,
    }));
    const copy = await service.duplicatePackage('biz-1', 'pkg-1');
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Spa day (Copy)' }),
    );
    expect(copy.name).toBe('Spa day (Copy)');
  });

  it('previews package pricing', async () => {
    const preview = await service.previewPackagePricing('biz-1', 'pkg-1');
    expect(preview.pricing.regularTotal).toBe(140);
    expect(preview.pricing.packagePrice).toBe(119);
  });

  it('throws when package is missing or has no items', async () => {
    packageRepo.findOne.mockResolvedValue(null);
    await expect(service.getPackage('biz-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);

    packageRepo.findOne.mockResolvedValue({ ...basePackage, items: [] });
    await expect(service.getPackage('biz-1', 'pkg-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enriches package status and visibility', () => {
    expect(service.resolveStatus({ ...basePackage, isActive: false } as any)).toBe('inactive');
    expect(
      service.resolveStatus({
        ...basePackage,
        expiresAt: new Date('2099-01-01'),
      } as any),
    ).toBe('active');
    expect(
      service.resolveStatus({
        ...basePackage,
        expiresAt: new Date('2020-01-01'),
      } as any),
    ).toBe('expired');
  });

  it('previewFromPackage handles missing service fields', () => {
    const preview = service.previewFromPackage({
      ...basePackage,
      items: [{ serviceId: 'svc-1', quantity: 1, service: null }],
    } as any);
    expect(preview.pricing.regularTotal).toBe(0);
    expect(preview.currency).toBe('USD');
  });

  it('updates package fields without replacing items', async () => {
    await service.updatePackage('biz-1', 'pkg-1', {
      name: 'Renamed spa',
      expiresAt: null,
    });
    expect(itemRepo.delete).not.toHaveBeenCalled();
    expect(packageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Renamed spa', expiresAt: null }),
    );
  });

  it('lists all packages when includeInactive is true', async () => {
    await service.listPackages('biz-1', 'all', true);
    expect(packageRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1' } }),
    );
  });

  it('creates package with expiration date', async () => {
    await service.createPackage('biz-1', {
      name: 'Limited offer',
      expiresAt: '2099-06-01T23:59:59.000Z',
      items: [{ serviceId: 'svc-1', quantity: 1 }],
    });
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expiresAt: new Date('2099-06-01T23:59:59.000Z'),
      }),
    );
  });

  it('duplicates package preserving expiration', async () => {
    packageRepo.findOne
      .mockImplementationOnce(async () => ({
        ...basePackage,
        expiresAt: new Date('2099-06-01T23:59:59.000Z'),
        items: baseItems,
      }))
      .mockImplementationOnce(async () => ({
        ...basePackage,
        id: 'pkg-2',
        name: 'Spa day (Copy)',
        items: baseItems,
      }));
    await service.duplicatePackage('biz-1', 'pkg-1');
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expiresAt: new Date('2099-06-01T23:59:59.000Z'),
      }),
    );
  });

  it('lists active-only packages by default for all filter', async () => {
    await service.listPackages('biz-1', 'all', false);
    expect(packageRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1', isActive: true } }),
    );
  });

  it('validates discount type changes using existing value', async () => {
    await expect(
      service.updatePackage('biz-1', 'pkg-1', { discountType: 'percent' }),
    ).resolves.toBeDefined();
  });

  it('preview includes service metadata defaults', () => {
    const preview = service.previewFromPackage({
      ...basePackage,
      items: [
        {
          serviceId: 'svc-1',
          quantity: 2,
          service: { name: 'Massage', price: 80, currency: 'USD', durationMinutes: 90 },
        },
      ],
    } as any);
    expect(preview.items[0].serviceName).toBe('Massage');
    expect(preview.items[0].durationMinutes).toBe(90);
    expect(preview.items[0].quantity).toBe(2);
  });

  it('lists all packages including inactive when requested', async () => {
    packageRepo.find.mockResolvedValue([
      basePackage,
      { ...basePackage, id: 'pkg-2', isActive: false },
    ]);
    const all = await service.listPackages('biz-1', 'all', true);
    expect(all).toHaveLength(2);
    expect(packageRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'biz-1' } }),
    );
  });

  it('clears optional text fields on update', async () => {
    await service.updatePackage('biz-1', 'pkg-1', {
      description: '   ',
      imageUrl: '',
    });
    expect(packageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, imageUrl: null }),
    );
  });

  it('creates package with default discount settings', async () => {
    await service.createPackage('biz-1', {
      name: 'Basics',
      items: [{ serviceId: 'svc-1', quantity: 1 }],
    });
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        discountType: 'percent',
        discountValue: 0,
      }),
    );
  });

  it('preview uses service currency when available', () => {
    const preview = service.previewFromPackage({
      ...basePackage,
      items: [
        {
          serviceId: 'svc-1',
          quantity: 1,
          service: { name: 'Massage', price: 80, currency: 'EUR', durationMinutes: 60 },
        },
      ],
    } as any);
    expect(preview.currency).toBe('EUR');
  });

  it('gets single package by id', async () => {
    const pkg = await service.getPackage('biz-1', 'pkg-1');
    expect(pkg.id).toBe('pkg-1');
  });

  it('lists public packages and filters expired offers', async () => {
    packageRepo.find.mockResolvedValue([
      basePackage,
      {
        ...basePackage,
        id: 'pkg-expired',
        expiresAt: new Date('2020-01-01'),
      },
      {
        ...basePackage,
        id: 'pkg-empty',
        items: [],
      },
    ]);
    const visible = await service.listPublicPackages('biz-1', 0);
    expect(visible).toHaveLength(1);
    expect(visible[0].kind).toBe('package');
    expect(visible[0].totalDurationMinutes).toBeGreaterThan(0);
  });

  it('includes expired packages during checkout grace window', async () => {
    const hourAgo = new Date(Date.now() - 3_600_000);
    packageRepo.find.mockResolvedValue([
      {
        ...basePackage,
        expiresAt: hourAgo,
      },
    ]);
    const visible = await service.listPublicPackages('biz-1', 24);
    expect(visible).toHaveLength(1);
  });

  it('gets public package and rejects unavailable offers', async () => {
    packageRepo.findOne.mockResolvedValueOnce(basePackage);
    const pkg = await service.getPublicPackage('biz-1', 'pkg-1', 0);
    expect(pkg.name).toBe('Spa day');

    packageRepo.findOne.mockResolvedValueOnce({
      ...basePackage,
      expiresAt: new Date('2020-01-01'),
    });
    await expect(service.getPublicPackage('biz-1', 'pkg-1', 0)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    packageRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.getPublicPackage('biz-1', 'missing', 0)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('asserts package is bookable for checkout', async () => {
    packageRepo.findOne.mockResolvedValueOnce(basePackage);
    const pkg = await service.assertPackageBookable('biz-1', 'pkg-1', 0);
    expect(pkg.id).toBe('pkg-1');

    packageRepo.findOne.mockResolvedValueOnce({
      ...basePackage,
      isActive: false,
    });
    await expect(service.assertPackageBookable('biz-1', 'pkg-1', 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    packageRepo.findOne.mockResolvedValueOnce({ ...basePackage, items: [] });
    await expect(service.assertPackageBookable('biz-1', 'pkg-1', 0)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('expands expected line service ids and creates purchases', async () => {
    expect(service.expectedLineServiceIds(basePackage as any)).toEqual(['svc-1', 'svc-2']);
    const purchase = await service.createPackagePurchase(
      'biz-1',
      'pkg-1',
      'cust-1',
      153,
      'USD',
    );
    expect(purchase.id).toBe('purchase-1');
    expect(purchaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        packageId: 'pkg-1',
        customerId: 'cust-1',
        pricePaid: 153,
        currency: 'USD',
      }),
    );
  });
});
