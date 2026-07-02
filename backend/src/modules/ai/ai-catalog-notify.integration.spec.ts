import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceCategoryService } from '../service/service-category.service.js';
import { ServiceService } from '../service/service.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';

describe('Catalog notify AI integration (catalog-notify-1.9)', () => {
  const services = [
    { id: 's1', name: 'Massage', price: 80, durationMinutes: 60 },
  ] as any[];

  const businessRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'biz-1',
      settings: { enabledLocales: ['en', 'hy'], defaultLocale: 'en' },
    }),
    save: jest.fn(async (b) => b),
  };
  const packagesService = {
    listPackages: jest.fn().mockResolvedValue([{ id: 'pkg-1', name: 'Glow' }]),
    createPackage: jest.fn(async () => ({ id: 'pkg-2', name: 'Spa Day' })),
    updatePackage: jest.fn(async () => ({ id: 'pkg-1', name: 'Glow Updated' })),
  };
  const subscriptionsService = {
    listPlans: jest
      .fn()
      .mockResolvedValue([{ id: 'plan-1', name: 'Nail club' }]),
    updatePlan: jest.fn(async (_b, _id, dto) => ({ id: 'plan-1', ...dto })),
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
        { provide: ServiceCategoryService, useValue: { findAll: jest.fn() } },
        {
          provide: ServiceService,
          useValue: { findAll: jest.fn().mockResolvedValue(services) },
        },
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

  it('rescues create package with notifyCustomers from prompt', () => {
    const result = rescue.rescue({
      prompt:
        'Create Spa Day package with massage 15% off and notify customers',
      action: 'unknown',
      params: {},
    });
    expect(result?.action).toBe('create_package');
    expect(result?.params?.notifyCustomers).toBe(true);
  });

  it('rescues Armenian membership update with notifyCustomers', () => {
    const result = rescue.rescue({
      prompt: 'Թարմացրի՛r nail club membership-ը և տեղեկացրի՛r հաճախորդներին',
      action: 'unknown',
      params: {},
    });
    expect(result?.action).toBe('update_subscription_plan');
    expect(result?.params?.notifyCustomers).toBe(true);
  });

  it('creates package with notify payload through catalog handler', async () => {
    const result = await catalog.handleCreatePackage(
      'biz-1',
      {
        packageName: 'Spa Day',
        serviceNames: ['Massage'],
        notifyCustomers: true,
      },
      services,
    );
    expect(result.success).toBe(true);
    expect(packagesService.createPackage).toHaveBeenCalledWith(
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

  it('updates subscription plan with notify payload through catalog handler', async () => {
    const result = await catalog.handleUpdateSubscriptionPlan('biz-1', {
      planName: 'Nail club',
      notifyCustomers: true,
    });
    expect(result.success).toBe(true);
    expect(subscriptionsService.updatePlan).toHaveBeenCalledWith(
      'biz-1',
      'plan-1',
      expect.objectContaining({
        notifyCustomers: true,
        notificationTemplate: expect.objectContaining({
          en: expect.objectContaining({ subject: expect.any(String) }),
        }),
      }),
    );
  });
});
