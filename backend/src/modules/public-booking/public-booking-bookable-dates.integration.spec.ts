import { BadRequestException } from '@nestjs/common';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  createEmptyBookingPopularityRepoMock,
  createPublicBookingServiceHarness,
} from './public-booking-test.harness.js';
import { MAX_SERVICE_BOOKABLE_DATES_RANGE_DAYS } from './public-booking.service.js';
import type { Business } from '../business/entities/business.entity.js';

function createBookableDatesHarness() {
  const business = {
    id: 'biz-1',
    name: 'Studio',
    slug: 'studio',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      publicBooking: { enabled: true },
    },
  } as unknown as Business;

  const service = {
    id: 'svc-1',
    businessId: 'biz-1',
    name: 'Haircut',
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    price: 40,
    durationMinutes: 60,
    bufferMinutes: 0,
    currency: 'USD',
    metadata: {},
  };

  const businessService = {
    findBySlug: jest.fn().mockResolvedValue(business),
    findOne: jest.fn().mockResolvedValue(business),
  };

  const serviceRepo = {
    findOne: jest.fn().mockResolvedValue(service),
  };

  const employeeRepo = {
    find: jest.fn().mockResolvedValue([
      { id: 'emp-1', name: 'Alex', isActive: true, serviceIds: ['svc-1'] },
    ]),
  };

  const serviceInstance = createPublicBookingServiceHarness({
    businessService,
    serviceRepo,
    employeeRepo,
    bookingRepo: createEmptyBookingPopularityRepoMock(),
  });
  (serviceInstance as any).serviceRepo = serviceRepo;
  (serviceInstance as any).employeeRepo = employeeRepo;

  return {
    service: serviceInstance,
    business,
    serviceRecord: service,
    employeeRepo,
  };
}

describe('Public booking bookable dates (consumer calendar)', () => {
  it('returns only dates with at least one bookable slot', async () => {
    const harness = createBookableDatesHarness();
    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockImplementation(
        async (_businessId: string, _employee: unknown, dateKey: string) => {
          if (dateKey === '2030-06-25') {
            return [new Date('2030-06-25T09:00:00.000Z')];
          }
          if (dateKey === '2030-06-27') {
            return [new Date('2030-06-27T11:00:00.000Z')];
          }
          return [];
        },
      );
    jest
      .spyOn(harness.service as any, 'canBookServiceAt')
      .mockResolvedValue(true);

    const result = await harness.service.getServiceBookableDates(
      'studio',
      'svc-1',
      '2030-06-25',
      '2030-06-27',
    );

    expect(result.dates).toEqual(['2030-06-25', '2030-06-27']);
    expect(result.serviceName).toBe('Haircut');
  });

  it('matches getServiceDaySlots availability for the same range', async () => {
    const harness = createBookableDatesHarness();
    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockImplementation(
        async (_businessId: string, _employee: unknown, dateKey: string) => {
          if (dateKey === '2030-06-25') {
            return [new Date('2030-06-25T09:00:00.000Z')];
          }
          return [];
        },
      );
    jest
      .spyOn(harness.service as any, 'canBookServiceAt')
      .mockResolvedValue(true);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_businessId: string, _employee: unknown, times: Date[]) => times,
      );

    const bookable = await harness.service.getServiceBookableDates(
      'studio',
      'svc-1',
      '2030-06-25',
      '2030-06-26',
    );
    const dayOne = await harness.service.getServiceDaySlots(
      'studio',
      'svc-1',
      '2030-06-25',
    );
    const dayTwo = await harness.service.getServiceDaySlots(
      'studio',
      'svc-1',
      '2030-06-26',
    );

    expect(bookable.dates).toEqual(['2030-06-25']);
    expect(dayOne.slots.length).toBeGreaterThan(0);
    expect(dayTwo.slots).toHaveLength(0);
  });

  it(`rejects ranges longer than ${MAX_SERVICE_BOOKABLE_DATES_RANGE_DAYS} days`, async () => {
    const harness = createBookableDatesHarness();

    await expect(
      harness.service.getServiceBookableDates(
        'studio',
        'svc-1',
        '2026-06-01',
        '2026-08-15',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
