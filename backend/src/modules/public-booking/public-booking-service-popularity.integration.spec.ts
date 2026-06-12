import { PrepaymentMode } from '../service/entities/service.entity.js';
import { createPublicBookingServiceHarness } from './public-booking-test.harness.js';
import type { Business } from '../business/entities/business.entity.js';

describe('PublicBookingService service popularity (rank-1.9)', () => {
  const business: Business = {
    id: 'biz-salon',
    name: 'Studio Salon',
    slug: 'studio-salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      publicBooking: { enabled: true },
    },
  } as Business;

  const services = [
    {
      id: 'svc-hair-basic',
      businessId: 'biz-salon',
      name: 'Haircut basic',
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      price: 35,
      durationMinutes: 30,
      bufferMinutes: 0,
      currency: 'USD',
      metadata: {},
      category: { id: 'cat-hair', name: 'Haircut', sortOrder: 0, metadata: {} },
    },
    {
      id: 'svc-hair-deluxe',
      businessId: 'biz-salon',
      name: 'Haircut deluxe',
      isActive: true,
      prepaymentMode: PrepaymentMode.NONE,
      price: 55,
      durationMinutes: 45,
      bufferMinutes: 0,
      currency: 'USD',
      metadata: {},
      category: { id: 'cat-hair', name: 'Haircut', sortOrder: 0, metadata: {} },
    },
  ];

  it('exposes rolling 90-day booking counts on getServices', async () => {
    const getRawMany = jest.fn().mockResolvedValue([
      { serviceId: 'svc-hair-basic', count: '12' },
      { serviceId: 'svc-hair-deluxe', count: '240' },
    ]);
    const bookingRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany,
      }),
    };

    const service = createPublicBookingServiceHarness({
      businessService: {
        findBySlug: jest.fn().mockResolvedValue(business),
      },
      subscriptionsService: {
        serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
      },
      serviceRepo: {
        find: jest.fn().mockResolvedValue(services),
      },
      bookingRepo,
    });

    const { services: catalog } = await service.getServices('studio-salon');

    expect(bookingRepo.createQueryBuilder).toHaveBeenCalledWith('booking');
    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'svc-hair-basic',
          bookingCount90d: 12,
        }),
        expect.objectContaining({
          id: 'svc-hair-deluxe',
          bookingCount90d: 240,
        }),
      ]),
    );
  });
});
