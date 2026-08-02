import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';

describe('e2e-bug.318 recommendProviders honors notBeforeTime for sample slot times', () => {
  function createHarness() {
    const business = {
      id: 'biz-1',
      name: 'Studio',
      slug: 'studio',
      timezone: 'UTC',
      isActive: true,
      settings: { locale: 'en', publicBooking: { enabled: true } },
    } as unknown as Business;

    const service = {
      id: 'svc-massage',
      businessId: 'biz-1',
      name: 'Massage',
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      price: 60,
      durationMinutes: 60,
      bufferMinutes: 0,
      currency: 'USD',
      metadata: {},
    };

    const employee = {
      id: 'emp-1',
      name: 'Alex',
      isActive: true,
      serviceIds: ['svc-massage'],
      metadata: {},
    };

    const businessService = {
      findBySlug: jest.fn().mockResolvedValue(business),
      findOne: jest.fn().mockResolvedValue(business),
    };
    const serviceRepo = {
      findOne: jest.fn().mockResolvedValue(service),
      find: jest.fn().mockResolvedValue([service]),
    };
    const employeeRepo = {
      find: jest.fn().mockResolvedValue([employee]),
    };
    const reviewsService = {
      getPublicReviewsByEmployees: jest.fn().mockResolvedValue(new Map()),
    };

    const serviceInstance = createPublicBookingServiceHarness({
      businessService,
      serviceRepo,
      employeeRepo,
      reviewsService: reviewsService as any,
    });
    (serviceInstance as any).serviceRepo = serviceRepo;
    (serviceInstance as any).employeeRepo = employeeRepo;

    // Raw same-day slots spanning both afternoon (before 17:00) and evening
    // (17:00+) — mirrors the exact e2e-bug.318 repro shape.
    const dateKey = '2026-08-05';
    const rawSlots = [
      new Date(`${dateKey}T13:30:00.000Z`),
      new Date(`${dateKey}T14:00:00.000Z`),
      new Date(`${dateKey}T14:30:00.000Z`),
      new Date(`${dateKey}T15:00:00.000Z`),
      new Date(`${dateKey}T17:00:00.000Z`),
      new Date(`${dateKey}T18:00:00.000Z`),
    ];
    jest
      .spyOn(serviceInstance as any, 'getEmployeeStartTimes')
      .mockResolvedValue(rawSlots);
    // Isolate the notBeforeTime filter itself (lines 926-933) — bypass the
    // downstream booking-conflict check, which needs its own heavy mocking
    // and isn't what this bug is about.
    jest
      .spyOn(serviceInstance as any, 'filterStartTimesWithService')
      .mockImplementation(async (_biz: any, _emp: any, startTimes: any) => startTimes);

    return { service: serviceInstance, dateKey };
  }

  it('returns only evening (>=17:00) sample times when notBeforeTime is 17:00', async () => {
    const { service, dateKey } = createHarness();
    const { providers } = await service.recommendProviders('studio', {
      serviceIds: ['svc-massage'],
      dateKeys: [dateKey],
      notBeforeTime: '17:00',
      limit: 5,
    });

    expect(providers).toHaveLength(1);
    const hours = providers[0].previewTimes.map((t: string) =>
      Number(t.slice(0, 2)),
    );
    expect(hours.length).toBeGreaterThan(0);
    expect(hours.every((h: number) => h >= 17)).toBe(true);
  });

  it('returns all same-day sample times when notBeforeTime is not set (regression control)', async () => {
    const { service, dateKey } = createHarness();
    const { providers } = await service.recommendProviders('studio', {
      serviceIds: ['svc-massage'],
      dateKeys: [dateKey],
      notBeforeTime: null,
      limit: 5,
    });

    expect(providers).toHaveLength(1);
    const hours = providers[0].previewTimes.map((t: string) =>
      Number(t.slice(0, 2)),
    );
    expect(hours.some((h: number) => h < 17)).toBe(true);
  });
});
