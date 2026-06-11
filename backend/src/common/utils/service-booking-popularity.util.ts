import type { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../modules/booking/entities/booking.entity.js';

/** Rolling window for service popularity rank (rank-1.9). */
export const SERVICE_BOOKING_POPULARITY_WINDOW_DAYS = 90;

export function resolveServiceBookingPopularityWindow(
  referenceDate: Date = new Date(),
): { start: Date; end: Date } {
  const end = new Date(referenceDate);
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(
    start.getUTCDate() - (SERVICE_BOOKING_POPULARITY_WINDOW_DAYS - 1),
  );
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

export function buildServiceBookingCountMap(
  rows: ReadonlyArray<{ serviceId: string; count: string | number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const count =
      typeof row.count === 'number'
        ? row.count
        : parseInt(String(row.count), 10);
    if (Number.isFinite(count)) {
      map.set(row.serviceId, count);
    }
  }
  return map;
}

export async function loadServiceBookingCounts90d(
  bookingRepo: Repository<Booking>,
  businessId: string,
  serviceIds?: readonly string[],
  referenceDate?: Date,
): Promise<Map<string, number>> {
  const { start, end } = resolveServiceBookingPopularityWindow(referenceDate);

  const qb = bookingRepo
    .createQueryBuilder('booking')
    .select('booking.serviceId', 'serviceId')
    .addSelect('COUNT(*)', 'count')
    .where('booking.businessId = :businessId', { businessId })
    .andWhere('booking.startTime BETWEEN :start AND :end', { start, end })
    .andWhere('booking.status != :cancelled', {
      cancelled: BookingStatus.CANCELLED,
    })
    .groupBy('booking.serviceId');

  if (serviceIds?.length) {
    qb.andWhere('booking.serviceId IN (:...serviceIds)', { serviceIds });
  }

  const rows = await qb.getRawMany<{ serviceId: string; count: string }>();
  return buildServiceBookingCountMap(rows);
}
