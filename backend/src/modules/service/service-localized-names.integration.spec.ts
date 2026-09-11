import { PrepaymentMode } from './entities/service.entity.js';
import { ServiceCategoryService } from './service-category.service.js';
import { ServiceService } from './service.service.js';
import { createPublicBookingServiceHarness } from '../public-booking/public-booking-test.harness.js';

describe('Service localized names integration', () => {
  // Open `settings`: tests below reassign it with `enabledLocales` /
  // `defaultLocale`, which the inferred literal type would not admit.
  const business: {
    id: string;
    slug: string;
    isActive: boolean;
    timezone: string;
    settings: Record<string, unknown>;
  } = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    timezone: 'UTC',
    settings: {
      locale: 'en',
      publicBooking: { enabled: true },
    },
  };

  const categories: Array<Record<string, unknown>> = [];
  const services: Array<Record<string, unknown>> = [];

  const categoryRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `cat-${categories.length + 1}`;
      const saved = {
        isActive: true,
        metadata: {},
        sortOrder: 0,
        ...value,
        id,
      };
      categories.push(saved);
      return saved;
    }),
    find: jest.fn(async () => [...categories]),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        categories.find(
          (c) => c.id === where.id && c.businessId === where.businessId,
        ) ?? null,
    ),
    update: jest.fn(),
  };

  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = {
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        bufferMinutes: 0,
        currency: 'USD',
        metadata: {},
        ...value,
        id,
      };
      services.push(saved);
      return saved;
    }),
    find: jest.fn(async () =>
      services.map((svc) => ({
        ...svc,
        category: categories.find((c) => c.id === svc.categoryId) ?? null,
      })),
    ),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const businessRepo = {
    findOne: jest.fn(async () => business),
  };

  const businessService = {
    findBySlug: jest.fn(async () => business),
  };

  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const subscriptionsService = {
    serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
  };
  const employeeRepo = { findOne: jest.fn() };

  const categoryService = new ServiceCategoryService(
    categoryRepo as any,
    businessRepo as any,
  );
  const serviceService = new ServiceService(
    serviceRepo as any,
    categoryRepo as any,
    businessRepo as any,
    { publish: jest.fn() } as any,
    stripeIntegrationService as any,
  
    undefined as never);

  const publicBookingService = createPublicBookingServiceHarness({
    businessService: businessService,
    stripeIntegrationService: stripeIntegrationService as any,
    subscriptionsService: subscriptionsService,
    serviceRepo: serviceRepo,
    employeeRepo: employeeRepo,
    configService: { get: jest.fn() } as any,
  });

  beforeEach(() => {
    categories.length = 0;
    services.length = 0;
    jest.clearAllMocks();
  });

  it('persists dashboard localized names and exposes them on public services by locale', async () => {
    const category = await categoryService.create('biz-1', {
      name: 'Hair care',
      sortOrder: 0,
      localizedNames: { en: ['Hair'], hy: ['Մազերի խնամք'] },
    });

    await serviceService.create('biz-1', {
      name: 'Haircut',
      durationMinutes: 30,
      price: 40,
      categoryId: category.id,
      localizedNames: { en: ['Cut & style'], hy: ['Կտրում'] },
    });

    const dashboardList = await serviceService.findAll('biz-1');
    expect(dashboardList[0].localizedNames).toEqual({
      en: ['Cut & style'],
      hy: ['Կտրում'],
    });
    expect(dashboardList[0].category?.localizedNames).toEqual({
      en: ['Hair'],
      hy: ['Մազերի խնամք'],
    });

    const { services: publicHy } = await publicBookingService.getServices(
      'salon',
      undefined,
      'hy',
    );
    expect(publicHy[0].name).toBe('Կտրում');
    expect(publicHy[0].category?.name).toBe('Մազերի խնամք');

    const { services: publicRu } = await publicBookingService.getServices(
      'salon',
      undefined,
      'ru',
    );
    expect(publicRu[0].name).toBe('Haircut');
    expect(publicRu[0].category?.name).toBe('Hair care');
  });

  it('strips disabled locale translations on service create', async () => {
    business.settings = {
      locale: 'en',
      enabledLocales: ['en', 'hy'],
      defaultLocale: 'en',
      publicBooking: { enabled: true },
    };

    await serviceService.create('biz-1', {
      name: 'Color',
      durationMinutes: 60,
      price: 80,
      localizedNames: {
        en: ['Color EN'],
        hy: ['Color HY'],
        ru: ['Color RU'],
      },
    });

    const saved = services[0] as {
      metadata?: { localizedNames?: Record<string, string[]> };
    };
    expect(saved.metadata?.localizedNames).toEqual({
      en: ['Color EN'],
      hy: ['Color HY'],
    });
  });

  it('drops localized names for disabled locales on create', async () => {
    business.settings = {
      locale: 'en',
      enabledLocales: ['en'],
      defaultLocale: 'en',
      publicBooking: { enabled: true },
    };

    await serviceService.create('biz-1', {
      name: 'Only EN',
      durationMinutes: 30,
      price: 20,
      localizedNames: { hy: ['Հայերեն'] },
    });

    const saved = services.at(-1) as {
      metadata?: { localizedNames?: Record<string, string[]> };
    };
    expect(saved.metadata?.localizedNames).toBeUndefined();
  });

  it('uses business locale when public locale query is invalid', async () => {
    business.settings = { locale: 'hy', publicBooking: { enabled: true } };

    const category = await categoryService.create('biz-1', {
      name: 'Spa',
      localizedNames: { hy: ['Սպա'] },
    });

    await serviceService.create('biz-1', {
      name: 'Massage',
      durationMinutes: 60,
      price: 70,
      categoryId: category.id,
      localizedNames: { hy: ['Մասաժ'] },
    });

    const { services: publicList } = await publicBookingService.getServices(
      'salon',
      undefined,
      'invalid',
    );
    expect(publicList[0].name).toBe('Մասաժ');
    expect(publicList[0].category?.name).toBe('Սպա');
  });

  it('filters public services by employee assignment when serviceIds are set', async () => {
    business.settings = { locale: 'en', publicBooking: { enabled: true } };

    const included = await serviceService.create('biz-1', {
      name: 'Included',
      durationMinutes: 30,
      price: 30,
    });
    await serviceService.create('biz-1', {
      name: 'Excluded',
      durationMinutes: 30,
      price: 30,
    });

    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-1',
      businessId: 'biz-1',
      isActive: true,
      serviceIds: [included.id],
    });

    const { services: filtered } = await publicBookingService.getServices(
      'salon',
      'emp-1',
      'en',
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Included');
  });
});
