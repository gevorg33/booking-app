import { AiCatalogService } from './ai-catalog.service.js';

describe('AiCatalogService (thin wrapper)', () => {
  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      settings: {
        publicBooking: {
          multiService: { enabled: false, incompatiblePairs: [] },
        },
        giftCards: {
          purchaseEnabled: false,
          presetAmounts: [25],
          purchasableServices: [],
          bundles: [],
        },
      },
    }),
    save: jest.fn(async (b) => b),
  };
  const categoryService = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(async (_b, dto) => ({ id: 'cat-1', name: dto.name })),
  };
  const serviceService = {
    // e2e-bug.347 — return a FRESH array per call, like the real repository.
    // `handleBulkCreateCatalogLogic` pushes newly-created services onto the
    // array it gets back from `findAll`; with a single shared `mockResolvedValue`
    // array that push leaked across handler calls inside one test, so a service
    // created by an earlier assertion made a later one report "All listed
    // services already exist in the catalog."
    findAll: jest.fn(async () => [
      {
        id: 's1',
        name: 'Massage',
        price: 80,
        durationMinutes: 60,
        currency: 'USD',
      },
      {
        id: 's2',
        name: 'Facial',
        price: 60,
        durationMinutes: 45,
        currency: 'USD',
      },
    ]),
    create: jest.fn(async (_b, dto) => ({ id: 'svc-1', ...dto })),
    remove: jest.fn(),
  };
  const packagesService = {
    listPackages: jest
      .fn()
      .mockResolvedValue([{ id: 'pkg-1', name: 'Spa Day' }]),
    createPackage: jest.fn(async () => ({ id: 'pkg-1', name: 'Spa Day' })),
    updatePackage: jest.fn(async () => ({
      id: 'pkg-1',
      name: 'Spa Day Updated',
    })),
    deactivatePackage: jest.fn(),
    duplicatePackage: jest.fn(async () => ({
      id: 'pkg-2',
      name: 'Spa Day (Copy)',
    })),
  };
  const subscriptionsService = {
    listPlans: jest
      .fn()
      .mockResolvedValue([{ id: 'plan-1', name: 'Nail Plan' }]),
    createPlan: jest.fn(async () => ({ id: 'plan-1', name: 'Plan' })),
    updatePlan: jest.fn(async (p) => p),
    deactivatePlan: jest.fn(),
    assignSubscription: jest.fn(async () => ({ id: 'sub-1' })),
  };

  const service = new AiCatalogService(
    businessRepo as any,
    categoryService as any,
    serviceService as any,
    packagesService as any,
    subscriptionsService as any,
  );

  const services = [
    {
      id: 's1',
      name: 'Massage',
      price: 80,
      durationMinutes: 60,
      currency: 'USD',
    },
    {
      id: 's2',
      name: 'Facial',
      price: 60,
      durationMinutes: 45,
      currency: 'USD',
    },
  ] as any[];
  const customers = [{ id: 'c1', name: 'Anna Lopez' }] as any[];
  const resolveCustomer = (list: any[], name: string) =>
    list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));

  beforeEach(() => jest.clearAllMocks());

  it('rescues and decomposes catalog intents', () => {
    expect(
      service.rescueCatalogIntent('list packages', 'unknown')?.action,
    ).toBe('list_packages');
    expect(service.rescueCatalogIntent('hello', 'unknown')).toBeNull();
    expect(
      service.isCatalogCompound(
        'Create category Hair with Cut 60m $65 and add Spa Day package with massage + facial',
      ),
    ).toBe(true);
    expect(service.isCatalogCompound('short')).toBe(false);
    expect(
      service.decomposeCatalogCompound(
        'Create category Hair with Cut 60m $65 and add Spa Day package with massage + facial',
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('delegates all catalog handlers', async () => {
    expect(
      (
        await service.handleCreateServiceCategory('biz-1', {
          categoryName: 'Color',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleBulkCreateCatalog(
          'biz-1',
          'Create category Hair with Cut 60m $65',
          {},
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleDeactivateService(
          'biz-1',
          { serviceName: 'Massage' },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect((await service.handleListPackages('biz-1')).action).toBe(
      'list_packages',
    );
    expect(
      (
        await service.handleCreatePackage(
          'biz-1',
          { packageName: 'Spa', serviceNames: ['Massage'] },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect(
      (await service.handleUpdatePackage('biz-1', { packageName: 'Spa Day' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleDeactivatePackage('biz-1', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleDuplicatePackage('biz-1', {
          packageName: 'Spa Day',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleListSubscriptionPlans('biz-1', {}, services as any))
        .action,
    ).toBe('list_subscription_plans');
    expect(
      (
        await service.handleCreateSubscriptionPlan(
          'biz-1',
          {
            planName: 'Nail',
            serviceName: 'Massage',
            durationMonths: 12,
            includedAppointments: 24,
          },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleUpdateSubscriptionPlan('biz-1', {
          planName: 'Nail Plan',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleDeactivateSubscriptionPlan('biz-1', {
          planName: 'Nail Plan',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAssignSubscription(
          'biz-1',
          { customerName: 'Anna', planName: 'Nail Plan' },
          services as any,
          customers,
          resolveCustomer,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleConfigureGiftCardProducts(
          'biz-1',
          { presetAmounts: [50] },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCreateGiftCardBundle(
          'biz-1',
          { bundleName: 'Combo', serviceNames: ['Massage', 'Facial'] },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleConfigureMultiServiceSettings('biz-1', {
          enabled: true,
          maxServiceCount: 3,
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleSetServiceCompatibility(
          'biz-1',
          { incompatibleServiceNames: ['Massage', 'Facial'] },
          services as any,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCatalogCompound(
          'biz-1',
          'compound',
          {
            compoundSteps: [
              {
                action: 'bulk_create_catalog',
                params: {
                  catalogDraft: {
                    categoryName: 'Hair',
                    services: [
                      { serviceName: 'Cut', durationMinutes: 30, price: 40 },
                    ],
                  },
                },
                segment: 'a',
              },
              {
                action: 'create_package',
                params: {
                  packageName: 'Spa Day',
                  serviceNames: ['Massage', 'Facial'],
                },
                segment: 'b',
              },
            ],
          },
          services as any,
          customers,
          resolveCustomer,
          'user-1',
        )
      ).success,
    ).toBe(true);
  });
});
