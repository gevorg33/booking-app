import { SUPPORTED_LOCALES } from '../../common/i18n/messages.js';
import { ServicePackagesService } from './service-packages.service.js';

describe('Sprint 29 — package localized names integration', () => {
  const packages: Array<Record<string, unknown>> = [];

  const packageRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `pkg-${packages.length + 1}`;
      const saved = {
        isActive: true,
        metadata: {},
        displayOrder: 0,
        discountType: 'percent',
        discountValue: 0,
        ...value,
        id,
      };
      const existing = packages.findIndex((pkg) => pkg.id === id);
      if (existing >= 0) packages[existing] = saved;
      else packages.push(saved);
      return saved;
    }),
    find: jest.fn(async () =>
      packages.map((pkg) => ({
        ...pkg,
        items: pkg.items ?? [],
      })),
    ),
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const match = packages.find(
        (pkg) =>
          pkg.id === where.id &&
          (!where.businessId || pkg.businessId === where.businessId),
      );
      if (!match) return null;
      return {
        ...match,
        items: match.items ?? [],
      };
    }),
    remove: jest.fn(),
  };

  const itemRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    delete: jest.fn(),
  };

  const serviceRepo = {
    find: jest.fn(async () => [
      { id: 'svc-1', businessId: 'biz-1', isActive: true, price: 80 },
    ]),
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
      },
    })),
  };

  const service = new ServicePackagesService(
    packageRepo as never,
    itemRepo as never,
    {
      count: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as never,
    serviceRepo as never,
    { createQueryBuilder: jest.fn() } as never,
    businessRepo as never,
  
    undefined as never);

  const baseItems = [{ serviceId: 'svc-1', quantity: 1 }];

  beforeEach(() => {
    jest.clearAllMocks();
    packages.length = 0;
    itemRepo.create.mockImplementation((value) => value);
    itemRepo.save.mockResolvedValue([]);
    serviceRepo.find.mockResolvedValue([
      { id: 'svc-1', businessId: 'biz-1', isActive: true, price: 80 },
    ]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
      },
    });
  });

  it('stores localizedNames only for enabled locales on create', async () => {
    const created = await service.createPackage('biz-1', {
      name: 'Spa bundle',
      localizedNames: {
        en: ['Spa Day'],
        hy: ['Սպա օր'],
        ru: ['Спа день'],
      },
      items: baseItems,
    });

    expect(created.localizedNames).toEqual({
      en: ['Spa Day'],
      hy: ['Սպա օր'],
    });
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          localizedNames: {
            en: ['Spa Day'],
            hy: ['Սպա օր'],
          },
        },
      }),
    );
  });

  it('drops localizedNames for disabled locales on create', async () => {
    const created = await service.createPackage('biz-1', {
      name: 'Spa bundle',
      localizedNames: { ru: ['Спа'] },
      items: baseItems,
    });

    expect(created.localizedNames).toBeUndefined();
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {},
      }),
    );
  });

  it('strips disabled locale keys on update', async () => {
    await service.createPackage('biz-1', {
      name: 'Spa bundle',
      localizedNames: { en: ['Spa Day'], hy: ['Սպա'] },
      items: baseItems,
    });

    const updated = await service.updatePackage('biz-1', 'pkg-1', {
      localizedNames: { en: ['Updated'], ru: ['Спа'] },
    });

    expect(updated.localizedNames).toEqual({ en: ['Updated'] });
  });

  it('resolves public package name from visitor locale', async () => {
    packages.push({
      id: 'pkg-1',
      businessId: 'biz-1',
      name: 'Spa bundle',
      description: null,
      imageUrl: null,
      discountType: 'percent',
      discountValue: 10,
      displayOrder: 0,
      isActive: true,
      expiresAt: null,
      metadata: {
        localizedNames: {
          en: ['Spa Day'],
          hy: ['Սպա օր'],
        },
      },
      items: [
        {
          serviceId: 'svc-1',
          quantity: 1,
          service: {
            id: 'svc-1',
            name: 'Massage',
            price: 80,
            currency: 'USD',
            durationMinutes: 60,
            bufferMinutes: 0,
          },
        },
      ],
    });

    const publicHy = await service.listPublicPackages('biz-1', 0, 'hy');
    expect(publicHy[0]?.name).toBe('Սպա օր');

    const publicEn = await service.getPublicPackage('biz-1', 'pkg-1', 0, 'en');
    expect(publicEn.name).toBe('Spa Day');
  });

  it('falls back to primary package name when locale has no translation', async () => {
    packages.push({
      id: 'pkg-2',
      businessId: 'biz-1',
      name: 'Primary name',
      description: null,
      imageUrl: null,
      discountType: 'percent',
      discountValue: 0,
      displayOrder: 0,
      isActive: true,
      expiresAt: null,
      metadata: { localizedNames: { en: ['English only'] } },
      items: [
        {
          serviceId: 'svc-1',
          quantity: 1,
          service: {
            id: 'svc-1',
            name: 'Massage',
            price: 80,
            currency: 'USD',
            durationMinutes: 60,
            bufferMinutes: 0,
          },
        },
      ],
    });

    const publicRu = await service.listPublicPackages('biz-1', 0, 'ru');
    expect(publicRu[0]?.name).toBe('Primary name');
  });

  it.each(SUPPORTED_LOCALES.map((locale) => ({ locale })))(
    'resolves public package display name for visitor locale $locale',
    async ({ locale }) => {
      packages.push({
        id: 'pkg-matrix',
        businessId: 'biz-1',
        name: 'Primary',
        description: null,
        imageUrl: null,
        discountType: 'percent',
        discountValue: 0,
        displayOrder: 0,
        isActive: true,
        expiresAt: null,
        metadata: {
          localizedNames: {
            en: ['English'],
            hy: ['Հայերեն'],
            ru: ['Русский'],
          },
        },
        items: [
          {
            serviceId: 'svc-1',
            quantity: 1,
            service: {
              id: 'svc-1',
              name: 'Massage',
              price: 80,
              currency: 'USD',
              durationMinutes: 60,
              bufferMinutes: 0,
            },
          },
        ],
      });

      const expected =
        locale === 'en' ? 'English' : locale === 'hy' ? 'Հայերեն' : 'Русский';
      const [publicPkg] = await service.listPublicPackages('biz-1', 0, locale);
      expect(publicPkg?.name).toBe(expected);
    },
  );

  it('clears localizedNames when update sends an empty object', async () => {
    await service.createPackage('biz-1', {
      name: 'Spa bundle',
      localizedNames: { en: ['Spa Day'] },
      items: baseItems,
    });

    const cleared = await service.updatePackage('biz-1', 'pkg-1', {
      localizedNames: {},
    });

    expect(cleared.localizedNames).toBeUndefined();
    expect(
      (packages[0]?.metadata as { localizedNames?: unknown })?.localizedNames,
    ).toBeUndefined();
  });

  it('updates localizedNames when package metadata was previously unset', async () => {
    await service.createPackage('biz-1', {
      name: 'No meta',
      items: baseItems,
    });
    const saved = packages[0];
    delete saved.metadata;

    const updated = await service.updatePackage('biz-1', 'pkg-1', {
      localizedNames: { hy: ['Սպա'] },
    });

    expect(updated.localizedNames).toEqual({ hy: ['Սպա'] });
  });

  it('uses second localized name slot when first is blank', async () => {
    packages.push({
      id: 'pkg-slots',
      businessId: 'biz-1',
      name: 'Primary',
      description: null,
      imageUrl: null,
      discountType: 'percent',
      discountValue: 0,
      displayOrder: 0,
      isActive: true,
      expiresAt: null,
      metadata: { localizedNames: { en: ['  ', 'Alt English'] } },
      items: [
        {
          serviceId: 'svc-1',
          quantity: 1,
          service: {
            id: 'svc-1',
            name: 'Massage',
            price: 80,
            currency: 'USD',
            durationMinutes: 60,
            bufferMinutes: 0,
          },
        },
      ],
    });

    const [publicPkg] = await service.listPublicPackages('biz-1', 0, 'en');
    expect(publicPkg?.name).toBe('Alt English');
  });

  it('duplicates package with localizedNames and optional fields', async () => {
    packages.push({
      id: 'pkg-src',
      businessId: 'biz-1',
      name: 'Source',
      description: 'Nice',
      imageUrl: 'https://img.example/p.jpg',
      discountType: 'percent',
      discountValue: 10,
      displayOrder: 3,
      isActive: true,
      expiresAt: new Date('2099-06-01T23:59:59.000Z'),
      metadata: { localizedNames: { en: ['Source EN'], hy: ['Աղբյուր'] } },
      items: [
        {
          serviceId: 'svc-1',
          quantity: 2,
          service: {
            id: 'svc-1',
            name: 'Massage',
            price: 80,
            currency: 'USD',
            durationMinutes: 60,
            bufferMinutes: 0,
          },
        },
      ],
    });
    packageRepo.findOne.mockImplementation(async ({ where }) => {
      const match = packages.find((pkg) => pkg.id === where.id);
      return match ? { ...match, items: match.items ?? [] } : null;
    });

    const copy = await service.duplicatePackage('biz-1', 'pkg-src');

    expect(copy.name).toBe('Source (Copy)');
    expect(copy.localizedNames).toEqual({
      en: ['Source EN'],
      hy: ['Աղբյուր'],
    });
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          localizedNames: {
            en: ['Source EN'],
            hy: ['Աղբյուր'],
          },
        },
      }),
    );
  });

  it('duplicates package without metadata or optional fields', async () => {
    packages.push({
      id: 'pkg-min',
      businessId: 'biz-1',
      name: 'Minimal',
      description: null,
      imageUrl: null,
      discountType: 'fixed',
      discountValue: 5,
      displayOrder: 0,
      isActive: true,
      expiresAt: null,
      items: [
        {
          serviceId: 'svc-1',
          quantity: 1,
          service: {
            id: 'svc-1',
            name: 'Massage',
            price: 80,
            currency: 'USD',
            durationMinutes: 60,
            bufferMinutes: 0,
          },
        },
      ],
    });
    packageRepo.findOne.mockImplementation(async ({ where }) => {
      const match = packages.find((pkg) => pkg.id === where.id);
      return match ? { ...match, items: match.items ?? [] } : null;
    });

    const copy = await service.duplicatePackage('biz-1', 'pkg-min');

    expect(copy.localizedNames).toBeUndefined();
    expect(packageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {},
        description: null,
        imageUrl: null,
        expiresAt: null,
      }),
    );
  });

  it('exposes localizedNames on dashboard list and getPackage', async () => {
    await service.createPackage('biz-1', {
      name: 'Dashboard pkg',
      localizedNames: { en: ['EN label'], hy: ['HY label'] },
      items: baseItems,
    });

    const listed = await service.listPackages('biz-1', 'all', true);
    expect(listed[0]?.localizedNames).toEqual({
      en: ['EN label'],
      hy: ['HY label'],
    });

    const one = await service.getPackage('biz-1', 'pkg-1');
    expect(one.localizedNames).toEqual({
      en: ['EN label'],
      hy: ['HY label'],
    });
  });
});
