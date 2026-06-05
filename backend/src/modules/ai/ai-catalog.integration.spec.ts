import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceCategoryService } from '../service/service-category.service.js';
import { ServiceService } from '../service/service.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';

describe('Sprint 27 catalog & monetization AI scenarios', () => {
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
    findAll: jest.fn().mockResolvedValue(services),
    create: jest.fn(async (_b, dto) => ({ id: `svc-${dto.name}`, ...dto })),
    remove: jest.fn(),
  };
  const packagesService = {
    listPackages: jest
      .fn()
      .mockResolvedValue([{ id: 'pkg-1', name: 'Spa Day' }]),
    createPackage: jest.fn(async () => ({ id: 'pkg-2', name: 'Spa Day' })),
    updatePackage: jest.fn(async () => ({
      id: 'pkg-1',
      name: 'Spa Day Updated',
    })),
    deactivatePackage: jest.fn(),
    duplicatePackage: jest.fn(async () => ({
      id: 'pkg-3',
      name: 'Spa Day (Copy)',
    })),
  };
  const subscriptionsService = {
    listPlans: jest
      .fn()
      .mockResolvedValue([{ id: 'plan-1', name: 'Nail Plan' }]),
    createPlan: jest.fn(async () => ({ id: 'plan-2', name: 'Nail Plan' })),
    updatePlan: jest.fn(async (p) => p),
    deactivatePlan: jest.fn(),
    assignSubscription: jest.fn(async () => ({ id: 'sub-1' })),
  };

  let catalog: AiCatalogService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiCatalogService,
        AiIntentRescueService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: ServiceCategoryService, useValue: categoryService },
        { provide: ServiceService, useValue: serviceService },
        { provide: ServicePackagesService, useValue: packagesService },
        {
          provide: ServiceSubscriptionsService,
          useValue: subscriptionsService,
        },
      ],
    }).compile();

    catalog = module.get(AiCatalogService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('intent rescue (ai-cmd-c1/c2/c3)', () => {
    it('rescues bulk catalog, category, and deactivate service', () => {
      expect(
        rescue.rescue({
          prompt: "Create category Hair with services: Women's cut 60m $65",
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('bulk_create_catalog');
      expect(
        rescue.rescue({
          prompt: 'Add category Color',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_service_category');
      expect(
        rescue.rescue({
          prompt: 'Hide balayage from public catalog',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('deactivate_service');
    });

    it('rescues package CRUD and list intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Create Spa Day package with massage + facial 15% off',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_package');
      expect(
        rescue.rescue({
          prompt: 'update Spa package discount',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('update_package');
      expect(
        rescue.rescue({
          prompt: 'deactivate Spa package',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('deactivate_package');
      expect(
        rescue.rescue({
          prompt: 'duplicate Spa package',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('duplicate_package');
      expect(
        rescue.rescue({
          prompt: 'list packages',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_packages');
    });

    it('rescues subscription plan intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Add 12-month nail plan 24 visits for Nail Care',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_subscription_plan');
      expect(
        rescue.rescue({
          prompt: 'update nail subscription plan',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('update_subscription_plan');
      expect(
        rescue.rescue({
          prompt: 'deactivate nail subscription plan',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('deactivate_subscription_plan');
      expect(
        rescue.rescue({
          prompt: 'show subscription plans',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_subscription_plans');
      expect(
        rescue.rescue({
          prompt: 'Give Anna the massage plan',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('assign_subscription_to_customer');
    });

    it('rescues gift card, multi-service, and compatibility', () => {
      expect(
        rescue.rescue({
          prompt: 'Enable $50/$100 gift card presets',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_gift_card_products');
      expect(
        rescue.rescue({
          prompt: 'create gift card bundle haircut beard',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_gift_card_bundle');
      expect(
        rescue.rescue({
          prompt: 'Enable multi-service booking max 3 services 180 min',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_multi_service_settings');
      expect(
        rescue.rescue({
          prompt: 'Block massage same visit combo',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('set_service_compatibility');
    });

    it('does not rescue when catalog returns null for compound', () => {
      expect(
        catalog.rescueCatalogIntent(
          'Create category Hair with Cut 60m $65 and add Spa Day package with massage + facial',
          'unknown',
        ),
      ).toBeNull();
    });
  });

  describe('catalog handler flows', () => {
    it('updates and duplicates packages', async () => {
      expect(
        (await catalog.handleUpdatePackage('biz-1', { packageName: 'Spa Day' }))
          .success,
      ).toBe(true);
      expect(
        (
          await catalog.handleDuplicatePackage('biz-1', {
            packageName: 'Spa Day',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleDeactivatePackage('biz-1', {
            packageName: 'Spa Day',
          })
        ).success,
      ).toBe(true);
    });

    it('manages subscription plans and assignment', async () => {
      expect(
        (
          await catalog.handleCreateSubscriptionPlan(
            'biz-1',
            {
              planName: 'Nail',
              serviceName: 'Massage',
              durationMonths: 12,
              includedAppointments: 24,
            },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleUpdateSubscriptionPlan('biz-1', {
            planName: 'Nail Plan',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleDeactivateSubscriptionPlan('biz-1', {
            planName: 'Nail Plan',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleAssignSubscription(
            'biz-1',
            { customerName: 'Anna', planName: 'Nail Plan' },
            services,
            customers,
            resolveCustomer,
          )
        ).success,
      ).toBe(true);
    });

    it('configures gift cards and multi-service settings', async () => {
      expect(
        (
          await catalog.handleConfigureGiftCardProducts(
            'biz-1',
            { presetAmounts: [50, 100] },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleCreateGiftCardBundle(
            'biz-1',
            { bundleName: 'Spa Combo', serviceNames: ['Massage', 'Facial'] },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleConfigureMultiServiceSettings('biz-1', {
            maxServiceCount: 3,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await catalog.handleSetServiceCompatibility(
            'biz-1',
            { incompatibleServiceNames: ['Massage', 'Chemical Peel'] },
            services,
          )
        ).success,
      ).toBe(true);
    });
  });

  describe('multi-command catalog compound', () => {
    it('executes category + package in one command via natural decompose', async () => {
      const result = await catalog.handleCatalogCompound(
        'biz-1',
        "Create category Hair with Women's cut 60m $65 and add Spa Day package with massage + facial 15% off",
        {},
        services,
        customers,
        resolveCustomer,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).steps).toHaveLength(2);
      expect(packagesService.createPackage).toHaveBeenCalled();
      expect(categoryService.create).toHaveBeenCalled();
    });

    it('stops compound on failed step', async () => {
      const result = await catalog.handleCatalogCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'bulk_create_catalog', params: {}, segment: 'x' },
            {
              action: 'create_package',
              params: { packageName: 'X' },
              segment: 'y',
            },
          ],
        },
        services,
        customers,
        resolveCustomer,
      );
      expect(result.success).toBe(false);
      expect((result.details as any).failedStep).toBe('bulk_create_catalog');
    });
  });
});
