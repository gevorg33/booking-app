import { ServiceService } from './service.service.js';
import { PrepaymentMode } from './entities/service.entity.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('ServiceService tour metadata', () => {
  const services: Array<Record<string, unknown>> = [];

  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = {
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        metadata: {},
        ...value,
        id,
      };
      services.push(saved);
      return saved;
    }),
    find: jest.fn(async () => []),
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      const svc = services.find((s) => s.id === where.id);
      return svc ? { ...svc, category: null } : null;
    }),
    update: jest.fn(),
  };

  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { stripeConnect: { chargesEnabled: true } },
    })),
  };

  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(true),
  };

  const serviceService = new ServiceService(
    serviceRepo as any,
    { findOne: jest.fn() } as any,
    businessRepo as any,
    { publish: jest.fn() } as any,
    stripeIntegrationService as any,
  );

  beforeEach(() => {
    services.length = 0;
    jest.clearAllMocks();
  });

  it('creates a tour service with metadata and enriched tour field', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Full Day City Tour',
      durationMinutes: 480,
      price: 85,
      serviceType: 'tour',
      coverImage: '/placeholders/tours/city-day.jpg',
      maxGroupSize: 12,
      difficulty: 'easy',
      meetingPoint: 'Hotel lobby',
      includedItems: 'Lunch, guide',
      durationDays: 1,
    });

    expect(created.metadata).toMatchObject({
      serviceType: TOUR_SERVICE_TYPE,
      coverImage: '/placeholders/tours/city-day.jpg',
      maxGroupSize: 12,
      difficulty: 'easy',
      meetingPoint: 'Hotel lobby',
      includedItems: 'Lunch, guide',
      durationDays: 1,
    });
    expect(created.tour).toMatchObject({
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 12,
    });
  });

  it('updates tour fields without clearing localized names', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Trek',
      durationMinutes: 4320,
      price: 320,
      serviceType: 'tour',
      maxGroupSize: 8,
      localizedNames: { en: ['Trek'] },
    });

    const updated = await serviceService.update(created.id, {
      maxGroupSize: 10,
      difficulty: 'moderate',
    });

    expect(updated.tour?.maxGroupSize).toBe(10);
    expect(updated.tour?.difficulty).toBe('moderate');
    expect(updated.localizedNames).toEqual({ en: ['Trek'] });
  });

  it('clears tour type when serviceType is empty on update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Trek',
      durationMinutes: 480,
      price: 100,
      serviceType: 'tour',
      maxGroupSize: 6,
    });

    const cleared = await serviceService.update(created.id, {
      serviceType: '',
    });

    expect(cleared.tour).toBeNull();
    expect(cleared.metadata?.serviceType).toBeUndefined();
  });
});
