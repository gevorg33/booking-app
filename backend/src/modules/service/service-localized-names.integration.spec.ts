import { PrepaymentMode } from './entities/service.entity.js';
import { ServiceCategoryService } from './service-category.service.js';
import { ServiceService } from './service.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';

describe('Service localized names integration', () => {
  const business = {
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
      const saved = { isActive: true, metadata: {}, sortOrder: 0, ...value, id };
      categories.push(saved);
      return saved;
    }),
    find: jest.fn(async () => [...categories]),
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
      categories.find((c) => c.id === where.id && c.businessId === where.businessId) ?? null,
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

  const stripeIntegrationService = { isConnectReady: jest.fn().mockReturnValue(false) };
  const subscriptionsService = {
    serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
  };
  const employeeRepo = { findOne: jest.fn() };

  const categoryService = new ServiceCategoryService(categoryRepo as any);
  const serviceService = new ServiceService(
    serviceRepo as any,
    categoryRepo as any,
    businessRepo as any,
    { publish: jest.fn() } as any,
    stripeIntegrationService as any,
  );

  const publicBookingService = new PublicBookingService(
    businessService as any,
    {} as any,
    {} as any,
    {} as any,
    stripeIntegrationService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    subscriptionsService as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn() } as any,
    employeeRepo as any,
    serviceRepo as any,
    {} as any,
    {} as any,
    {} as any,
  );

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
    } as any);

    await serviceService.create('biz-1', {
      name: 'Haircut',
      durationMinutes: 30,
      price: 40,
      categoryId: category.id,
      localizedNames: { en: ['Cut & style'], hy: ['Կտրում'] },
    } as any);

    const dashboardList = await serviceService.findAll('biz-1');
    expect(dashboardList[0].localizedNames).toEqual({ en: ['Cut & style'], hy: ['Կտրում'] });
    expect(dashboardList[0].category?.localizedNames).toEqual({
      en: ['Hair'],
      hy: ['Մազերի խնամք'],
    });

    const { services: publicHy } = await publicBookingService.getServices('salon', undefined, 'hy');
    expect(publicHy[0].name).toBe('Կտրում');
    expect(publicHy[0].category?.name).toBe('Մազերի խնամք');

    const { services: publicRu } = await publicBookingService.getServices('salon', undefined, 'ru');
    expect(publicRu[0].name).toBe('Haircut');
    expect(publicRu[0].category?.name).toBe('Hair care');
  });

  it('uses business locale when public locale query is invalid', async () => {
    business.settings = { locale: 'hy', publicBooking: { enabled: true } };

    const category = await categoryService.create('biz-1', {
      name: 'Spa',
      localizedNames: { hy: ['Սպա'] },
    } as any);

    await serviceService.create('biz-1', {
      name: 'Massage',
      durationMinutes: 60,
      price: 70,
      categoryId: category.id,
      localizedNames: { hy: ['Մասաժ'] },
    } as any);

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
    } as any);
    await serviceService.create('biz-1', {
      name: 'Excluded',
      durationMinutes: 30,
      price: 30,
    } as any);

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
