import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { buildSequentialAppointments } from '../../common/utils/multi-service-booking.util.js';

export type PackageVisitLineSource = {
  bookingId: string;
  serviceId: string;
  employeeId: string;
  startTime: string;
};

export type PackageVisitLine = {
  bookingId: string;
  startTime: string;
  employeeId?: string;
};

/**
 * Builds a `lines[]` payload for a package-visit reschedule by shifting every
 * active service line of the visit to a new same-day sequential block,
 * anchored at `targetStartTime`, preserving the visit's original service
 * order and provider (ai-cmd-customer-6.3.2).
 */
export async function buildPackageVisitLinesFromTarget(
  deps: {
    serviceRepo: Pick<Repository<Service>, 'find'>;
    businessRepo: Pick<Repository<Business>, 'findOne'>;
    multiServiceBookingsService: Pick<
      MultiServiceBookingsService,
      'resolveSettingsFromBusiness'
    >;
  },
  businessId: string,
  visitBookings: PackageVisitLineSource[],
  targetStartTime: string,
): Promise<PackageVisitLine[]> {
  if (!visitBookings.length) return [];

  const sorted = [...visitBookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const services = await deps.serviceRepo.find({
    where: { businessId },
  });
  const servicesById = new Map(services.map((s) => [s.id, s]));

  const orderedServices = sorted.map((booking) => {
    const service = servicesById.get(booking.serviceId);
    return {
      serviceId: booking.serviceId,
      durationMinutes: service?.durationMinutes ?? 30,
      bufferMinutes: service?.bufferMinutes ?? 0,
    };
  });

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const turnoverBufferMinutes = business
    ? deps.multiServiceBookingsService.resolveSettingsFromBusiness(business)
        .turnoverBufferMinutes
    : 5;

  const sequential = buildSequentialAppointments(
    orderedServices,
    new Date(targetStartTime),
    turnoverBufferMinutes,
  );

  return sorted.map((booking, index) => ({
    bookingId: booking.bookingId,
    startTime: sequential[index].startTime.toISOString(),
    employeeId: booking.employeeId,
  }));
}
