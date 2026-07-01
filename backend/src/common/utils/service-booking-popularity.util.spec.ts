import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  BUILD_SERVICE_BOOKING_COUNT_MAP_SCENARIOS,
  SERVICE_BOOKING_POPULARITY_WINDOW_SCENARIOS,
} from './service-booking-popularity.fixtures.js';
import {
  SERVICE_BOOKING_POPULARITY_WINDOW_DAYS,
  buildServiceBookingCountMap,
  loadServiceBookingCounts90d,
  resolveServiceBookingPopularityWindow,
} from './service-booking-popularity.util.js';

describe('service-booking-popularity.util (rank-1.9)', () => {
  it('uses a 90-day rolling window', () => {
    expect(SERVICE_BOOKING_POPULARITY_WINDOW_DAYS).toBe(90);
  });

  it.each(SERVICE_BOOKING_POPULARITY_WINDOW_SCENARIOS)(
    'resolveServiceBookingPopularityWindow $id',
    ({ referenceIso, expectedStartIso, expectedEndIso }) => {
      const window = resolveServiceBookingPopularityWindow(
        new Date(referenceIso),
      );
      expect(window.start.toISOString()).toBe(expectedStartIso);
      expect(window.end.toISOString()).toBe(expectedEndIso);
    },
  );

  it.each(BUILD_SERVICE_BOOKING_COUNT_MAP_SCENARIOS)(
    'buildServiceBookingCountMap $id',
    ({ rows, expected }) => {
      const map = buildServiceBookingCountMap(rows);
      expect(Object.fromEntries(map.entries())).toEqual(expected);
    },
  );

  it('loadServiceBookingCounts90d queries non-cancelled bookings in the rolling window', async () => {
    const getRawMany = jest.fn().mockResolvedValue([
      { serviceId: 'svc-popular', count: '42' },
      { serviceId: 'svc-quiet', count: '1' },
    ]);
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany,
    };
    const bookingRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const referenceDate = new Date('2026-06-10T12:00:00.000Z');
    const counts = await loadServiceBookingCounts90d(
      bookingRepo as never,
      'biz-1',
      ['svc-popular', 'svc-quiet'],
      referenceDate,
    );

    expect(bookingRepo.createQueryBuilder).toHaveBeenCalledWith('booking');
    expect(qb.andWhere).toHaveBeenCalledWith(
      'booking.serviceId IN (:...serviceIds)',
      { serviceIds: ['svc-popular', 'svc-quiet'] },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('booking.status != :cancelled', {
      cancelled: BookingStatus.CANCELLED,
    });
    expect(counts.get('svc-popular')).toBe(42);
    expect(counts.get('svc-quiet')).toBe(1);
  });
});
