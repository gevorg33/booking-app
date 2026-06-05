import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceCategoryService } from '../service/service-category.service.js';
import { ServiceService } from '../service/service.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { CATALOG_COUNTED_SCENARIOS } from './ai-dashboard-ops.fixtures.js';
import { parseBulkCatalogWithCountFromPrompt } from './ai-catalog.util.js';

describe('dashboard ops handler flows', () => {
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
    create: jest.fn(async (_b, dto) => ({
      id: 'cat-nails',
      name: dto.name,
      localizedNames: dto.localizedNames,
    })),
  };
  const serviceService = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(async (_b, dto) => ({ id: `svc-${dto.name}`, ...dto })),
  };
  const packagesService = { listPackages: jest.fn().mockResolvedValue([]) };
  const subscriptionsService = { listPlans: jest.fn().mockResolvedValue([]) };

  let catalog: AiCatalogService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    serviceService.findAll.mockResolvedValue([]);
    categoryService.findAll.mockResolvedValue([]);
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

  describe('bulk_create_catalog handler — counted services + translations', () => {
    it.each(CATALOG_COUNTED_SCENARIOS.map((s) => [s.id, s]))(
      'creates category and linked services for %s',
      async (_id, scenario) => {
        const rescued = rescue.rescue({
          prompt: scenario.prompt,
          action: 'unknown',
          params: {},
        });
        expect(rescued?.action).toBe('bulk_create_catalog');

        const draft = parseBulkCatalogWithCountFromPrompt(scenario.prompt);
        expect(draft).not.toBeNull();

        const result = await catalog.handleBulkCreateCatalog(
          'biz-1',
          scenario.prompt,
          {},
        );
        expect(result.success).toBe(true);
        expect(result.action).toBe('bulk_create_catalog');
        expect(categoryService.create).toHaveBeenCalledWith(
          'biz-1',
          expect.objectContaining({ name: draft!.categoryName }),
        );
        expect(serviceService.create).toHaveBeenCalledTimes(
          draft!.services.length,
        );
        expect((result.details as { created: string[] }).created).toHaveLength(
          draft!.services.length,
        );
      },
    );

    it('passes localized names to category and services when translations requested', async () => {
      const prompt =
        'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian';
      const draft = parseBulkCatalogWithCountFromPrompt(prompt)!;

      const result = await catalog.handleBulkCreateCatalog('biz-1', prompt, {});
      expect(result.success).toBe(true);

      expect(categoryService.create).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({
          name: 'Nails',
          localizedNames: draft.localizedNames,
        }),
      );
      expect(serviceService.create).toHaveBeenCalled();
      const firstServiceCall = serviceService.create.mock.calls[0]?.[1];
      expect(firstServiceCall?.localizedNames).toBeDefined();
    });

    it('skips duplicate services on repeat run', async () => {
      const prompt = 'Adding a new Spa category with 3 linked services';
      serviceService.findAll.mockResolvedValueOnce([
        { id: 's1', name: 'Spa Service 1' },
        { id: 's2', name: 'Spa Service 2' },
        { id: 's3', name: 'Spa Service 3' },
      ]);

      const result = await catalog.handleBulkCreateCatalog('biz-1', prompt, {});
      expect(result.success).toBe(false);
      expect(result.summary).toContain('already exist');
      expect(serviceService.create).not.toHaveBeenCalled();
    });
  });
});
