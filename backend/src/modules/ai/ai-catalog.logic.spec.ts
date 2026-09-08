import { PackageDiscountType } from '../service-packages/entities/service-package.entity.js';
import {
  handleAssignSubscriptionToCustomerLogic,
  handleBulkCreateCatalogLogic,
  handleCatalogCompoundLogic,
  handleConfigureGiftCardProductsLogic,
  handleConfigureMultiServiceSettingsLogic,
  handleCreateGiftCardBundleLogic,
  handleCreatePackageLogic,
  handleCreateServiceCategoryLogic,
  handleUpdateServiceCategoryLogic,
  handleDeleteServiceCategoryLogic,
  handleCreateSubscriptionPlanLogic,
  handleActivatePackageLogic,
  handleDeactivatePackageLogic,
  handleDeactivateServiceLogic,
  handleUpdateServiceLogic,
  handleDeactivateSubscriptionPlanLogic,
  handleActivateSubscriptionPlanLogic,
  handleDuplicatePackageLogic,
  handleListPackagesLogic,
  handleListSubscriptionPlansLogic,
  handleSetServiceCompatibilityLogic,
  handleUpdatePackageLogic,
  handleUpdateSubscriptionPlanLogic,
  type CatalogLogicDeps,
} from './ai-catalog.logic.js';

const services = [
  {
    id: 's1',
    name: 'Massage',
    price: 80,
    durationMinutes: 60,
    currency: 'USD',
  },
  { id: 's2', name: 'Facial', price: 60, durationMinutes: 45, currency: 'USD' },
  {
    id: 's3',
    name: 'Chemical Peel',
    price: 90,
    durationMinutes: 30,
    currency: 'USD',
  },
] as any[];
const customers = [{ id: 'c1', name: 'Anna Lopez' }] as any[];
const resolveCustomer = (list: any[], name: string) =>
  list.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));

function buildDeps(
  overrides: Partial<CatalogLogicDeps> = {},
): CatalogLogicDeps {
  const business = {
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
  };
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(business),
      save: jest.fn(async (b) => b),
    } as any,
    categoryService: {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(async (_b, dto) => ({ id: 'cat-1', name: dto.name })),
      update: jest.fn(async (id, _businessId, dto) => ({ id, ...dto })),
      remove: jest.fn(async () => undefined),
    } as any,
    serviceService: {
      findAll: jest.fn().mockImplementation(async () => [...services]),
      create: jest.fn(async (_b, dto) => ({ id: `svc-${dto.name}`, ...dto })),
      update: jest.fn(async (id, dto) => {
        const service = services.find((entry) => entry.id === id);
        return { ...service, ...dto };
      }),
      remove: jest.fn(),
    } as any,
    packagesService: {
      listPackages: jest
        .fn()
        .mockResolvedValue([{ id: 'pkg-1', name: 'Spa Day' }]),
      createPackage: jest.fn(async () => ({ id: 'pkg-1', name: 'Spa Day' })),
      updatePackage: jest.fn(async (_b, _id, _dto) => ({
        id: 'pkg-1',
        name: 'Spa Day Updated',
      })),
      deactivatePackage: jest.fn(),
      activatePackage: jest.fn(),
      duplicatePackage: jest.fn(async () => ({
        id: 'pkg-2',
        name: 'Spa Day (Copy)',
      })),
    } as any,
    subscriptionsService: {
      listPlans: jest
        .fn()
        .mockResolvedValue([{ id: 'plan-1', name: 'Nail Plan' }]),
      createPlan: jest.fn(async () => ({ id: 'plan-1', name: 'Nail Plan' })),
      updatePlan: jest.fn(async (p) => p),
      deactivatePlan: jest.fn(),
      activatePlan: jest.fn(async () => ({ id: 'plan-1', isActive: true })),
      assignSubscription: jest.fn(async () => ({ id: 'sub-1' })),
    } as any,
    ...overrides,
  };
}

describe('ai-catalog.logic', () => {
  describe('handleCreateServiceCategoryLogic', () => {
    it('fails when name missing or duplicate', async () => {
      expect(
        (await handleCreateServiceCategoryLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      const deps = buildDeps({
        categoryService: {
          findAll: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Color' }]),
          create: jest.fn(),
        } as any,
      });
      expect(
        (
          await handleCreateServiceCategoryLogic(deps, 'biz-1', {
            categoryName: 'Color',
          })
        ).success,
      ).toBe(false);
    });

    it('creates category with and without placeholders', async () => {
      const plain = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        {
          categoryName: 'Color',
        },
      );
      expect(plain.success).toBe(true);

      const withPlaceholders = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        {
          categoryName: 'Nails',
          placeholderCount: 2,
        },
      );
      expect(withPlaceholders.success).toBe(true);
      expect((withPlaceholders.details as any).serviceIds).toHaveLength(2);
    });

    // e2e-bug.312 — deterministic locale on success summary (no LLM-enrich flake).
    it('returns a deterministic Russian success summary for RU prompts', async () => {
      const result = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Цвет' },
        'Добавь категорию каталога с названием Цвет, пожалуйста',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Категория «Цвет» успешно создана.');
    });

    it('returns a deterministic Armenian success summary for HY prompts', async () => {
      const result = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Գույն' },
        'Ավելացրու «Գույն» կատալոգի կատեգորիա',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Ստեղծվեց «Գույն» կատեգորիան։');
    });

    it('returns a deterministic English success summary by default', async () => {
      const result = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Color' },
        'Add a catalog category named Color',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Created category "Color".');
    });

    it('localizes the placeholder-service variant of the success summary too', async () => {
      const result = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Цвет', placeholderCount: 2 },
        'Добавь категорию каталога с названием Цвет и 2 услугами',
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe(
        'Категория «Цвет» успешно создана, с 2 пробной услугой(ями).',
      );
    });

    it('falls back to params.locale when the prompt has no detectable script', async () => {
      const result = await handleCreateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Color', locale: 'ru' },
      );
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Категория «Color» успешно создана.');
    });
  });

  describe('handleUpdateServiceCategoryLogic', () => {
    function depsWithCategory() {
      return buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-1', name: 'Color' }]),
          update: jest.fn(async (id, _businessId, dto) => ({
            id,
            name: dto.name || 'Color',
          })),
          remove: jest.fn(async () => undefined),
        } as any,
      });
    }

    it('asks for clarification when categoryName is missing', async () => {
      const result = await handleUpdateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('fails when category not found', async () => {
      const result = await handleUpdateServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Missing' },
      );
      expect(result.success).toBe(false);
    });

    it('updates the category', async () => {
      const deps = depsWithCategory();
      const result = await handleUpdateServiceCategoryLogic(deps, 'biz-1', {
        categoryName: 'Color',
        newName: 'Hair Color',
      });
      expect(result.success).toBe(true);
      expect(deps.categoryService.update).toHaveBeenCalledWith(
        'cat-1',
        'biz-1',
        expect.objectContaining({ name: 'Hair Color' }),
      );
    });
  });

  describe('handleDeleteServiceCategoryLogic', () => {
    function depsWithCategory() {
      return buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-1', name: 'Color' }]),
          remove: jest.fn(async () => undefined),
        } as any,
      });
    }

    it('asks for clarification when categoryName is missing', async () => {
      const result = await handleDeleteServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('fails when category not found', async () => {
      const result = await handleDeleteServiceCategoryLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Missing' },
      );
      expect(result.success).toBe(false);
    });

    it('deletes the category', async () => {
      const deps = depsWithCategory();
      const result = await handleDeleteServiceCategoryLogic(deps, 'biz-1', {
        categoryName: 'Color',
      });
      expect(result.success).toBe(true);
      expect(deps.categoryService.remove).toHaveBeenCalledWith(
        'cat-1',
        'biz-1',
      );
    });
  });

  describe('handleBulkCreateCatalogLogic', () => {
    it('fails when draft missing', async () => {
      expect(
        (
          await handleBulkCreateCatalogLogic(
            buildDeps(),
            'biz-1',
            {},
            'no catalog here',
          )
        ).success,
      ).toBe(false);
    });

    it('uses catalogDraft and categoryName params', async () => {
      const draft = {
        categoryName: 'Hair',
        services: [
          { serviceName: "Women's cut", durationMinutes: 60, price: 65 },
        ],
      };
      const fromDraft = await handleBulkCreateCatalogLogic(
        buildDeps(),
        'biz-1',
        { catalogDraft: draft },
        '',
      );
      expect(fromDraft.success).toBe(true);

      const fromName = await handleBulkCreateCatalogLogic(
        buildDeps(),
        'biz-1',
        {
          categoryName: 'Brows',
          services: [{ serviceName: 'Tint', durationMinutes: 20, price: 25 }],
        },
        '',
      );
      expect(fromName.success).toBe(true);

      const fromCategoryOnly = await handleBulkCreateCatalogLogic(
        buildDeps(),
        'biz-1',
        {
          categoryName: 'Lashes',
          services: [{ serviceName: 'Lift' }],
        },
        '',
      );
      expect(fromCategoryOnly.success).toBe(true);

      expect(
        (
          await handleBulkCreateCatalogLogic(
            buildDeps(),
            'biz-1',
            { categoryName: 'Empty' },
            '',
          )
        ).success,
      ).toBe(false);
    });

    it('reuses existing category and skips duplicate services', async () => {
      const deps = buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-existing', name: 'Hair' }]),
          create: jest.fn(),
        } as any,
        serviceService: {
          findAll: jest.fn().mockResolvedValue([{ id: 's0', name: 'Massage' }]),
          create: jest.fn(async (_b, dto) => ({ id: 'new', ...dto })),
          remove: jest.fn(),
        } as any,
      });
      const result = await handleBulkCreateCatalogLogic(
        deps,
        'biz-1',
        {
          catalogDraft: {
            categoryName: 'Hair',
            services: [
              { serviceName: 'Massage', durationMinutes: 60, price: 80 },
              { serviceName: 'Facial', durationMinutes: 45, price: 60 },
              { serviceName: '', durationMinutes: 30, price: 0 },
            ],
          },
        },
        '',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).skipped).toContain('Massage');
    });

    it('fails when all services already exist', async () => {
      const deps = buildDeps({
        serviceService: {
          findAll: jest.fn().mockResolvedValue(services),
          create: jest.fn(),
          remove: jest.fn(),
        } as any,
      });
      const result = await handleBulkCreateCatalogLogic(
        deps,
        'biz-1',
        {
          catalogDraft: {
            categoryName: 'Spa',
            services: [
              { serviceName: 'Massage', durationMinutes: 60, price: 80 },
            ],
          },
        },
        '',
      );
      expect(result.success).toBe(false);
    });
  });

  describe('handleUpdateServiceLogic', () => {
    it('moves a service into a category', async () => {
      const catalogServices = [
        {
          id: 'svc-neck',
          name: 'Neck Massage',
          price: 40,
          durationMinutes: 30,
        },
        ...services,
      ] as any[];
      const update = jest.fn(async (id, dto) => ({
        id,
        name: 'Neck Massage',
        categoryId: dto.categoryId,
      }));
      const deps = buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-massage', name: 'Massage' }]),
          create: jest.fn(),
        } as any,
        serviceService: {
          findAll: jest.fn(),
          create: jest.fn(),
          remove: jest.fn(),
          update,
        } as any,
      });
      const result = await handleUpdateServiceLogic(
        deps,
        'biz-1',
        { serviceName: 'Neck Massage', categoryName: 'Massage' },
        catalogServices,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Massage');
      expect(update).toHaveBeenCalledWith(
        'svc-neck',
        { categoryId: 'cat-massage' },
        undefined,
      );
    });

    it('clarifies when category is missing', async () => {
      const result = await handleUpdateServiceLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'Neck Massage' },
        services,
      );
      expect(result.success).toBe(false);
      expect((result.details as any).clarify).toBe(true);
      expect((result.details as any).missing).toContain('categoryName');
    });

    it('clarifies when service name is missing', async () => {
      const result = await handleUpdateServiceLogic(
        buildDeps(),
        'biz-1',
        { categoryName: 'Massage' },
        services,
      );
      expect(result.success).toBe(false);
      expect((result.details as any).missing).toContain('serviceName');
    });

    it('parses service and category names from prompt text', async () => {
      const catalogServices = [
        {
          id: 'svc-neck',
          name: 'Neck Massage',
          price: 40,
          durationMinutes: 30,
        },
      ] as any[];
      const update = jest.fn(async (id, dto) => ({
        id,
        name: 'Neck Massage',
        categoryId: dto.categoryId,
      }));
      const deps = buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-massage', name: 'Massage' }]),
          create: jest.fn(),
        } as any,
        serviceService: {
          findAll: jest.fn(),
          create: jest.fn(),
          remove: jest.fn(),
          update,
        } as any,
      });
      const result = await handleUpdateServiceLogic(
        deps,
        'biz-1',
        {},
        catalogServices,
        'move Neck Massage under service category: Massage',
      );
      expect(result.success).toBe(true);
    });

    it('fails when service or category cannot be resolved', async () => {
      const missingService = await handleUpdateServiceLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'Missing', categoryName: 'Massage' },
        services,
      );
      expect(missingService.success).toBe(false);

      const missingCategory = await handleUpdateServiceLogic(
        buildDeps({
          categoryService: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn(),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage', categoryName: 'Spa' },
        services,
      );
      expect(missingCategory.success).toBe(false);
      expect((missingCategory.details as any).missing).toContain(
        'categoryName',
      );
    });
  });

  describe('handleDeactivateServiceLogic', () => {
    it('requires service name and resolves by partial match', async () => {
      expect(
        (await handleDeactivateServiceLogic(buildDeps(), 'biz-1', {}, services))
          .success,
      ).toBe(false);
      expect(
        (
          await handleDeactivateServiceLogic(
            buildDeps(),
            'biz-1',
            { serviceName: 'Missing' },
            services,
          )
        ).success,
      ).toBe(false);
      const ok = await handleDeactivateServiceLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'mass' },
        services,
      );
      expect(ok.success).toBe(true);
    });

    it('deactivates all services in a category', async () => {
      const deps = buildDeps();
      const categoryServices = [
        {
          id: 'd1',
          name: 'Dental A',
          isActive: true,
          category: { name: 'Dental' },
        },
        {
          id: 'd2',
          name: 'Dental B',
          isActive: true,
          category: { name: 'Dental' },
        },
        {
          id: 'h1',
          name: 'Haircut',
          isActive: true,
          category: { name: 'Hair' },
        },
      ] as any[];
      const result = await handleDeactivateServiceLogic(
        deps,
        'biz-1',
        { categoryName: 'Dental', allInCategory: true },
        categoryServices,
        'Deactivate all dental services',
      );
      expect(result.success).toBe(true);
      expect(deps.serviceService.remove).toHaveBeenCalledTimes(2);
      expect((result.details as any).count).toBe(2);
    });
  });

  describe('handleListPackagesLogic', () => {
    it('lists packages including empty state', async () => {
      const withPkgs = await handleListPackagesLogic(buildDeps(), 'biz-1');
      expect(withPkgs.success).toBe(true);
      expect((withPkgs.details as any).count).toBe(1);

      const empty = await handleListPackagesLogic(
        {
          packagesService: {
            listPackages: jest.fn().mockResolvedValue([]),
          } as any,
        },
        'biz-1',
      );
      expect(empty.summary).toContain('No active packages');
    });
  });

  describe('package handlers', () => {
    it('create package validates and applies discount', async () => {
      expect(
        (await handleCreatePackageLogic(buildDeps(), 'biz-1', {}, services))
          .success,
      ).toBe(false);
      expect(
        (
          await handleCreatePackageLogic(
            buildDeps(),
            'biz-1',
            { packageName: 'X' },
            services,
          )
        ).success,
      ).toBe(false);

      const pkgDeps = buildDeps();
      const noDiscount = await handleCreatePackageLogic(
        pkgDeps,
        'biz-1',
        { packageName: 'Day Spa', serviceNames: ['Massage'] },
        services,
      );
      expect(noDiscount.success).toBe(true);
      expect(pkgDeps.packagesService.createPackage).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({
          discountValue: 0,
          discountType: PackageDiscountType.PERCENT,
        }),
      );

      const withDiscount = await handleCreatePackageLogic(
        buildDeps(),
        'biz-1',
        {
          packageName: 'Spa Day',
          serviceNames: ['Massage', 'Facial'],
          discountValue: 10,
          discountType: PackageDiscountType.FIXED,
        },
        services,
      );
      expect(withDiscount.success).toBe(true);

      const percentDefaultType = await handleCreatePackageLogic(
        buildDeps(),
        'biz-1',
        { packageName: 'Glow', serviceNames: ['Facial'], discountValue: 5 },
        services,
      );
      expect(percentDefaultType.success).toBe(true);
    });

    it('passes notify payload when notifyCustomers is true', async () => {
      const deps = buildDeps();
      deps.businessRepo.findOne = jest.fn().mockResolvedValue({
        id: 'biz-1',
        settings: { enabledLocales: ['en', 'hy'], defaultLocale: 'en' },
      });
      const result = await handleCreatePackageLogic(
        deps,
        'biz-1',
        {
          packageName: 'Spa Day',
          serviceNames: ['Massage'],
          notifyCustomers: true,
        },
        services,
      );
      expect(result.success).toBe(true);
      expect(result.summary).toContain('announcement');
      expect(deps.packagesService.createPackage).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({
          notifyCustomers: true,
          notificationTemplate: expect.objectContaining({
            en: expect.objectContaining({ subject: expect.any(String) }),
            hy: expect.objectContaining({ subject: expect.any(String) }),
          }),
        }),
      );
    });
  });

  describe('package update/deactivate', () => {
    it('update, deactivate, and duplicate packages', async () => {
      expect(
        (await handleUpdatePackageLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleUpdatePackageLogic(
            {
              packagesService: {
                listPackages: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { packageName: 'X' },
          )
        ).success,
      ).toBe(false);

      const byName = await handleUpdatePackageLogic(buildDeps(), 'biz-1', {
        packageName: 'Spa',
        discountValue: 5,
      });
      expect(byName.success).toBe(true);

      const byId = await handleUpdatePackageLogic(buildDeps(), 'biz-1', {
        packageId: 'pkg-1',
      });
      expect(byId.success).toBe(true);

      expect(
        (
          await handleDeactivatePackageLogic(
            {
              packagesService: {
                listPackages: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { packageName: 'X' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleDeactivatePackageLogic(buildDeps(), 'biz-1', {
            packageName: 'Spa Day',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleDeactivatePackageLogic(buildDeps(), 'biz-1', {
            packageId: 'pkg-1',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleActivatePackageLogic(
            {
              packagesService: {
                listPackages: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { packageName: 'X' },
          )
        ).success,
      ).toBe(false);
      const activated = await handleActivatePackageLogic(buildDeps(), 'biz-1', {
        packageName: 'Spa Day',
      });
      expect(activated.success).toBe(true);
      expect(activated.details).toMatchObject({ packageId: 'pkg-1' });

      expect(
        (
          await handleDuplicatePackageLogic(
            {
              packagesService: {
                listPackages: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { packageName: 'Missing' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleDuplicatePackageLogic(buildDeps(), 'biz-1', {
            packageId: 'pkg-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleDuplicatePackageLogic(buildDeps(), 'biz-1', {
            packageName: 'Spa',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('subscription handlers', () => {
    it('lists plans with optional service filter', async () => {
      const all = await handleListSubscriptionPlansLogic(
        buildDeps(),
        'biz-1',
        {},
        services,
      );
      expect(all.success).toBe(true);

      const filtered = await handleListSubscriptionPlansLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'Massage' },
        services,
      );
      expect(filtered.success).toBe(true);

      const empty = await handleListSubscriptionPlansLogic(
        {
          subscriptionsService: {
            listPlans: jest.fn().mockResolvedValue([]),
          } as any,
        },
        'biz-1',
        {},
        services,
      );
      expect(empty.summary).toContain('No subscription plans');
    });

    it('create plan validates inputs', async () => {
      expect(
        (
          await handleCreateSubscriptionPlanLogic(
            buildDeps(),
            'biz-1',
            {},
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCreateSubscriptionPlanLogic(
            buildDeps(),
            'biz-1',
            {
              planName: 'X',
              serviceName: 'Missing',
              durationMonths: 12,
              includedAppointments: 24,
            },
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCreateSubscriptionPlanLogic(
            buildDeps(),
            'biz-1',
            {
              planName: 'X',
              serviceName: 'Massage',
              durationMonths: 0,
              includedAppointments: 0,
            },
            services,
          )
        ).success,
      ).toBe(false);

      const ok = await handleCreateSubscriptionPlanLogic(
        buildDeps(),
        'biz-1',
        {
          planName: 'Nail Plan',
          serviceName: 'Massage',
          durationMonths: 12,
          includedAppointments: 24,
          discountValue: 20,
        },
        services,
      );
      expect(ok.success).toBe(true);
    });

    it('update and deactivate plans', async () => {
      expect(
        (
          await handleUpdateSubscriptionPlanLogic(
            {
              subscriptionsService: {
                listPlans: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { planName: 'X' },
          )
        ).success,
      ).toBe(false);

      const updated = await handleUpdateSubscriptionPlanLogic(
        buildDeps(),
        'biz-1',
        {
          planId: 'plan-1',
          discountValue: 10,
        },
      );
      expect(updated.success).toBe(true);

      expect(
        (
          await handleUpdateSubscriptionPlanLogic(buildDeps(), 'biz-1', {
            planId: 'missing',
          })
        ).success,
      ).toBe(false);

      const byEmptyPlanId = await handleUpdateSubscriptionPlanLogic(
        buildDeps(),
        'biz-1',
        {
          planId: '',
          planName: 'Nail Plan',
        },
      );
      expect(byEmptyPlanId.success).toBe(true);

      const byMissingPlanName = await handleUpdateSubscriptionPlanLogic(
        buildDeps(),
        'biz-1',
        {
          planId: '',
        },
      );
      expect(byMissingPlanName.success).toBe(true);

      const byName = await handleUpdateSubscriptionPlanLogic(
        {
          subscriptionsService: {
            listPlans: jest
              .fn()
              .mockResolvedValue([{ id: 'plan-1', name: 'Nail Plan' }]),
            updatePlan: jest.fn(async (p) => p),
          } as any,
        } as any,
        'biz-1',
        { planName: 'Nail Plan', includedAppointments: 30 },
      );
      expect(byName.success).toBe(true);

      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(
            {
              subscriptionsService: {
                listPlans: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { planName: 'X' },
          )
        ).success,
      ).toBe(false);
      const deactivateDeps = buildDeps();
      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(deactivateDeps, 'biz-1', {
            planName: 'Nail',
          })
        ).success,
      ).toBe(true);
      expect(
        deactivateDeps.subscriptionsService.deactivatePlan,
      ).toHaveBeenCalledWith('biz-1', 'plan-1');

      const byPlanIdOnly = buildDeps();
      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(byPlanIdOnly, 'biz-1', {
            planId: 'plan-1',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(buildDeps(), 'biz-1', {
            planId: 'missing',
          })
        ).success,
      ).toBe(false);

      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(buildDeps(), 'biz-1', {
            planId: '',
            planName: 'Nail',
          })
        ).success,
      ).toBe(true);

      expect(
        (
          await handleDeactivateSubscriptionPlanLogic(buildDeps(), 'biz-1', {
            planId: '',
          })
        ).success,
      ).toBe(true);
    });

    it('activates a subscription plan (ai-cmd-dashboard-6.11.3)', async () => {
      expect(
        (
          await handleActivateSubscriptionPlanLogic(
            {
              subscriptionsService: {
                listPlans: jest.fn().mockResolvedValue([]),
              } as any,
            } as any,
            'biz-1',
            { planName: 'X' },
          )
        ).success,
      ).toBe(false);

      const activateDeps = buildDeps();
      const activated = await handleActivateSubscriptionPlanLogic(
        activateDeps,
        'biz-1',
        { planName: 'Nail' },
      );
      expect(activated.success).toBe(true);
      expect(
        activateDeps.subscriptionsService.activatePlan,
      ).toHaveBeenCalledWith('biz-1', 'plan-1');

      const byPlanId = buildDeps();
      expect(
        (
          await handleActivateSubscriptionPlanLogic(byPlanId, 'biz-1', {
            planId: 'plan-1',
          })
        ).success,
      ).toBe(true);

      const errorDeps = buildDeps({
        subscriptionsService: {
          listPlans: jest
            .fn()
            .mockResolvedValue([{ id: 'plan-1', name: 'Nail Plan' }]),
          activatePlan: jest.fn(async () => {
            throw new Error('Subscription plan is already active');
          }),
        } as any,
      });
      const errored = await handleActivateSubscriptionPlanLogic(
        errorDeps,
        'biz-1',
        { planId: 'plan-1' },
      );
      expect(errored.success).toBe(false);
      expect(errored.summary).toContain('already active');
    });

    it('assigns subscription to customer', async () => {
      expect(
        (
          await handleAssignSubscriptionToCustomerLogic(
            buildDeps(),
            'biz-1',
            {},
            services,
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleAssignSubscriptionToCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Nobody', planName: 'Nail' },
            services,
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleAssignSubscriptionToCustomerLogic(
            buildDeps(),
            'biz-1',
            { customerName: 'Anna', planName: 'Missing' },
            services,
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(false);

      const byName = await handleAssignSubscriptionToCustomerLogic(
        buildDeps(),
        'biz-1',
        { customerName: 'Anna', planName: 'Nail' },
        services,
        customers,
        resolveCustomer,
      );
      expect(byName.success).toBe(true);

      const byId = await handleAssignSubscriptionToCustomerLogic(
        buildDeps(),
        'biz-1',
        { customerId: 'c1', customerName: 'Anna', planName: 'Nail Plan' },
        services,
        customers,
        resolveCustomer,
      );
      expect(byId.success).toBe(true);
    });
  });

  describe('gift card handlers', () => {
    it('configure gift card products', async () => {
      expect(
        (
          await handleConfigureGiftCardProductsLogic(
            {
              businessRepo: {
                findOne: jest.fn().mockResolvedValue(null),
              } as any,
            } as any,
            'biz-1',
            {},
            services,
          )
        ).success,
      ).toBe(false);

      expect(
        (
          await handleConfigureGiftCardProductsLogic(
            buildDeps(),
            'biz-1',
            { serviceName: 'Missing' },
            services,
          )
        ).success,
      ).toBe(false);

      const addService = await handleConfigureGiftCardProductsLogic(
        buildDeps(),
        'biz-1',
        { presetAmounts: [50, 100], serviceName: 'Massage' },
        services,
      );
      expect(addService.success).toBe(true);

      const existingService = await handleConfigureGiftCardProductsLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: {
                giftCards: {
                  purchaseEnabled: true,
                  presetAmounts: [25],
                  purchasableServices: [{ serviceId: 's1', price: 80 }],
                  bundles: [],
                },
              },
            }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
        services,
      );
      expect(existingService.success).toBe(true);

      const presetsOnly = await handleConfigureGiftCardProductsLogic(
        buildDeps(),
        'biz-1',
        {},
        services,
      );
      expect(presetsOnly.success).toBe(true);

      const purchaseOff = await handleConfigureGiftCardProductsLogic(
        buildDeps(),
        'biz-1',
        {
          purchaseEnabled: false,
        },
        services,
      );
      expect(purchaseOff.success).toBe(true);

      const nullSettings = await handleConfigureGiftCardProductsLogic(
        buildDeps({
          businessRepo: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'biz-1', settings: undefined }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { presetAmounts: [75] },
        services,
      );
      expect(nullSettings.success).toBe(true);
    });

    it('create gift card bundle', async () => {
      const clarify = await handleCreateGiftCardBundleLogic(
        buildDeps(),
        'biz-1',
        {},
        services,
      );
      expect(clarify.success).toBe(false);
      // e2e-bug.157 — clarify must say gift card and redirect package phrasing
      expect(clarify.summary).toMatch(/gift card/i);
      expect(clarify.summary).toMatch(/Create a package called/i);
      expect(
        (
          await handleCreateGiftCardBundleLogic(
            {
              businessRepo: {
                findOne: jest.fn().mockResolvedValue(null),
              } as any,
            } as any,
            'biz-1',
            { bundleName: 'Combo', serviceNames: ['Massage', 'Facial'] },
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCreateGiftCardBundleLogic(
            buildDeps(),
            'biz-1',
            {
              bundleName: 'Combo',
              serviceNames: ['Missing', 'Also Missing'],
            },
            services,
          )
        ).success,
      ).toBe(false);

      const computedPrice = await handleCreateGiftCardBundleLogic(
        buildDeps(),
        'biz-1',
        { bundleName: 'Spa Combo', serviceNames: ['Massage', 'Facial'] },
        services,
      );
      expect(computedPrice.success).toBe(true);

      const explicitPrice = await handleCreateGiftCardBundleLogic(
        buildDeps(),
        'biz-1',
        { bundleName: 'Deal', serviceNames: ['Massage', 'Facial'], price: 99 },
        services,
      );
      expect(explicitPrice.success).toBe(true);

      const noPriceServices = [
        { id: 's1', name: 'Massage', durationMinutes: 60, currency: 'USD' },
        { id: 's2', name: 'Facial', durationMinutes: 45, currency: 'USD' },
      ] as any[];
      const computedNoPrice = await handleCreateGiftCardBundleLogic(
        buildDeps({
          businessRepo: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'biz-1', settings: undefined }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { bundleName: 'Bare', serviceNames: ['Massage', 'Facial'] },
        noPriceServices,
      );
      expect(computedNoPrice.success).toBe(true);
    });
  });

  describe('multi-service settings handlers', () => {
    it('configure multi-service settings', async () => {
      expect(
        (
          await handleConfigureMultiServiceSettingsLogic(
            {
              businessRepo: {
                findOne: jest.fn().mockResolvedValue(null),
              } as any,
            } as any,
            'biz-1',
            {},
          )
        ).success,
      ).toBe(false);

      const enabled = await handleConfigureMultiServiceSettingsLogic(
        buildDeps(),
        'biz-1',
        {
          enabled: true,
          maxServiceCount: 3,
          maxDurationMinutes: 180,
          turnoverBufferMinutes: 10,
        },
      );
      expect(enabled.success).toBe(true);

      const disabled = await handleConfigureMultiServiceSettingsLogic(
        buildDeps(),
        'biz-1',
        {
          enabled: false,
        },
      );
      expect(disabled.success).toBe(true);

      const noSettings = await handleConfigureMultiServiceSettingsLogic(
        buildDeps({
          businessRepo: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'biz-1', settings: undefined }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { schedulingMode: 'sequential' },
      );
      expect(noSettings.success).toBe(true);
    });

    it('set service compatibility', async () => {
      expect(
        (
          await handleSetServiceCompatibilityLogic(
            buildDeps(),
            'biz-1',
            {},
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleSetServiceCompatibilityLogic(
            buildDeps(),
            'biz-1',
            {
              incompatibleServiceNames: ['Missing', 'Also'],
            },
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleSetServiceCompatibilityLogic(
            {
              businessRepo: {
                findOne: jest.fn().mockResolvedValue(null),
              } as any,
            } as any,
            'biz-1',
            { incompatibleServiceNames: ['Massage', 'Facial'] },
            services,
          )
        ).success,
      ).toBe(false);

      const newPair = await handleSetServiceCompatibilityLogic(
        buildDeps(),
        'biz-1',
        { incompatibleServiceNames: ['Massage', 'Chemical Peel'] },
        services,
      );
      expect(newPair.success).toBe(true);

      const massageFirstNew = await handleSetServiceCompatibilityLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: {
                publicBooking: {
                  multiService: { enabled: true, incompatiblePairs: [] },
                },
              },
            }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { incompatibleServiceNames: ['Massage', 'Facial'] },
        services,
      );
      expect(massageFirstNew.success).toBe(true);

      const reversedIds = await handleSetServiceCompatibilityLogic(
        buildDeps(),
        'biz-1',
        { serviceNames: ['Chemical Peel', 'Massage'] },
        services,
      );
      expect(reversedIds.success).toBe(true);

      const existingPair = await handleSetServiceCompatibilityLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: {
                publicBooking: {
                  multiService: {
                    enabled: true,
                    incompatiblePairs: [['s1', 's3']],
                    incompatiblePairMode: 'service',
                  },
                },
              },
            }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { incompatibleServiceNames: ['Massage', 'Chemical Peel'] },
        services,
      );
      expect(existingPair.success).toBe(true);

      const reversedStoredPair = await handleSetServiceCompatibilityLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: {
                publicBooking: {
                  multiService: {
                    enabled: true,
                    incompatiblePairs: [['s3', 's1']],
                    incompatiblePairMode: 'service',
                  },
                },
              },
            }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { incompatibleServiceNames: ['Massage', 'Chemical Peel'] },
        services,
      );
      expect(reversedStoredPair.success).toBe(true);

      const peelFirst = await handleSetServiceCompatibilityLogic(
        buildDeps({
          businessRepo: {
            findOne: jest.fn().mockResolvedValue({
              id: 'biz-1',
              settings: {
                publicBooking: {
                  multiService: {
                    enabled: true,
                    incompatiblePairs: [['s3', 's1']],
                    incompatiblePairMode: 'service',
                  },
                },
              },
            }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { incompatibleServiceNames: ['Chemical Peel', 'Massage'] },
        services,
      );
      expect(peelFirst.success).toBe(true);

      const noBizSettings = await handleSetServiceCompatibilityLogic(
        buildDeps({
          businessRepo: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'biz-1', settings: null }),
            save: jest.fn(async (b) => b),
          } as any,
        }),
        'biz-1',
        { incompatibleServiceNames: ['Massage', 'Facial'] },
        services,
      );
      expect(noBizSettings.success).toBe(true);
    });
  });

  describe('handleCatalogCompoundLogic', () => {
    it('fails when fewer than two steps', async () => {
      const result = await handleCatalogCompoundLogic(
        buildDeps(),
        'biz-1',
        'Add category Color',
        {},
        services,
        customers,
        resolveCustomer,
      );
      expect(result.success).toBe(false);
    });

    it('stops on failed step and unsupported action', async () => {
      const failStep = await handleCatalogCompoundLogic(
        buildDeps(),
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'bulk_create_catalog', params: {}, segment: 'x' },
            { action: 'create_package', params: {}, segment: 'y' },
          ],
        },
        services,
        customers,
        resolveCustomer,
        'user-1',
      );
      expect(failStep.success).toBe(false);
      expect((failStep.details as any).failedStep).toBe('bulk_create_catalog');

      const unsupported = await handleCatalogCompoundLogic(
        buildDeps(),
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
            { action: 'list_packages' as any, params: {}, segment: 'b' },
          ],
        },
        services,
        customers,
        resolveCustomer,
      );
      expect(unsupported.success).toBe(false);
      expect((unsupported.details as any).failedStep).toBe('list_packages');
    });

    describe('e2e-bug.448(b) — the online-payment tail no longer fails the compound', () => {
      /**
       * Both e2e-bug.348's and e2e-bug.349's reported prompts end with "Turn on
       * online payment for …". That is a payments action, so it hit the
       * executor's `default` branch, which fails the WHOLE compound — reporting
       * failure on top of catalog work that had already been written. This is
       * the shared reason both tickets lingered as "partial" long after their
       * named root causes were fixed.
       */
      const catalogStep = {
        action: 'bulk_create_catalog',
        params: {
          catalogDraft: {
            categoryName: 'Hair',
            services: [{ serviceName: 'Cut', durationMinutes: 30, price: 40 }],
          },
        },
        segment: 'a',
      };

      const run = (delegate?: any, action = 'enable_online_payment') =>
        handleCatalogCompoundLogic(
          buildDeps(),
          'biz-1',
          'compound',
          {
            compoundSteps: [
              catalogStep,
              { action: action as any, params: {}, segment: 'turn on online payment' },
            ],
          },
          services,
          customers,
          resolveCustomer,
          'user-1',
          delegate,
        );

      it('delegates the step instead of failing on `default`', async () => {
        const delegate = jest.fn().mockResolvedValue({
          success: true,
          action: 'configure_service_online_payment',
          summary: 'Online payment enabled.',
        });

        const result = await run(delegate);

        expect(delegate).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect((result.details as any).failedStep).toBeUndefined();
      });

      it('accepts the canonical spec id as well as the planner shape', async () => {
        const delegate = jest.fn().mockResolvedValue({
          success: true,
          action: 'configure_service_online_payment',
          summary: 'ok',
        });

        await run(delegate, 'configure_service_online_payment');

        expect(delegate).toHaveBeenCalled();
      });

      it('still fails cleanly when no delegate is supplied', async () => {
        // A caller that cannot provide the payments service is not broken by
        // this change — it reports the step as unsupported, as before.
        const result = await run(undefined);

        expect(result.success).toBe(false);
        expect((result.details as any).failedStep).toBe('enable_online_payment');
      });

      it('reports the catalog work that landed before a delegate failure', async () => {
        // e2e-bug.448(a) — the completed-steps report must survive.
        const delegate = jest
          .fn()
          .mockResolvedValue({ success: false, action: 'x', summary: 'nope' });

        const result = await run(delegate);

        expect(result.success).toBe(false);
        expect(result.summary).toContain('Completed before stopping');
      });
    });

    it('runs each compound step type', async () => {
      const deps = buildDeps();
      const runTwo = async (steps: any[]) => {
        const extra = {
          action: 'bulk_create_catalog' as const,
          params: {
            catalogDraft: {
              categoryName: 'Extra',
              services: [
                { serviceName: 'Tint', durationMinutes: 20, price: 25 },
              ],
            },
          },
          segment: 'pad',
        };
        return handleCatalogCompoundLogic(
          deps,
          'biz-1',
          'compound',
          { compoundSteps: [extra, ...steps] },
          services,
          customers,
          resolveCustomer,
          'user-1',
        );
      };

      expect(
        (
          await runTwo([
            {
              action: 'create_service_category',
              params: { categoryName: 'Brows' },
              segment: 'c',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'create_package',
              params: { packageName: 'Spa Day', serviceNames: ['Massage'] },
              segment: 'p',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'create_subscription_plan',
              params: {
                planName: 'Nail Plan',
                serviceName: 'Massage',
                durationMonths: 12,
                includedAppointments: 24,
              },
              segment: 's',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'configure_gift_card_products',
              params: { presetAmounts: [50] },
              segment: 'g',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'configure_multi_service_settings',
              params: { maxServiceCount: 2 },
              segment: 'm',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'set_service_compatibility',
              params: { incompatibleServiceNames: ['Massage', 'Facial'] },
              segment: 'x',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'configure_service_featured',
              params: {},
              segment: 'Mark Massage as featured',
            },
          ])
        ).success,
      ).toBe(true);
      deps.packagesService.listPackages.mockResolvedValue([
        {
          id: 'pkg-1',
          name: 'Spa Day',
          isActive: true,
          items: [{ serviceId: 's1', service: { id: 's1' } }],
        },
      ]);
      expect(
        (
          await runTwo([
            {
              action: 'configure_package_online_payment',
              params: {},
              segment: 'Require 50% online prepayment for Spa Day package',
            },
          ])
        ).success,
      ).toBe(true);
      const categoryDeps = buildDeps({
        categoryService: {
          findAll: jest
            .fn()
            .mockResolvedValue([{ id: 'cat-massage', name: 'Massage' }]),
          create: jest.fn(async (_b, dto) => ({
            id: `cat-${dto.name}`,
            name: dto.name,
          })),
        } as any,
        serviceService: {
          findAll: jest.fn().mockImplementation(async () => [...services]),
          create: jest.fn(async (_b, dto) => ({
            id: `svc-${dto.name}`,
            ...dto,
          })),
          remove: jest.fn(),
          update: jest.fn(async (id, dto) => ({
            id,
            name: 'Massage',
            categoryId: dto.categoryId,
          })),
        } as any,
      });
      expect(
        (
          await handleCatalogCompoundLogic(
            categoryDeps,
            'biz-1',
            'compound',
            {
              compoundSteps: [
                {
                  action: 'bulk_create_catalog',
                  params: {
                    catalogDraft: {
                      categoryName: 'Extra',
                      services: [
                        { serviceName: 'Tint', durationMinutes: 20, price: 25 },
                      ],
                    },
                  },
                  segment: 'pad',
                },
                {
                  action: 'update_service',
                  params: {
                    serviceName: 'Massage',
                    categoryName: 'Massage',
                  },
                  segment: 'move Massage under Massage category',
                },
              ],
            },
            services,
            customers,
            resolveCustomer,
            'user-1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'deactivate_service',
              params: { serviceName: 'Facial' },
              segment: 'd',
            },
          ])
        ).success,
      ).toBe(true);
      expect(
        (
          await runTwo([
            {
              action: 'assign_subscription_to_customer',
              params: { customerName: 'Anna', planName: 'Nail Plan' },
              segment: 'a',
            },
          ])
        ).success,
      ).toBe(true);
    });

    it('decomposes natural compound prompt', async () => {
      const prompt =
        "Create category Hair with Women's cut 60m $65 and add Spa Day package with massage + facial 15% off";
      const result = await handleCatalogCompoundLogic(
        buildDeps(),
        'biz-1',
        prompt,
        {},
        services,
        customers,
        resolveCustomer,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).catalogCompound).toBe(true);
    });
  });
});
