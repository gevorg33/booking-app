import type {
  PublicCustomerBookingItem,
  PublicMultiServiceVisitSummary,
  PublicPackageVisitAppointment,
  PublicPackageVisitSummary,
} from './types.js';

const ACTIVE_STATUSES = new Set(['confirmed', 'pending']);

export function groupBookingsForAccount(bookings: PublicCustomerBookingItem[]) {
  const standalone: PublicCustomerBookingItem[] = [];
  const byPurchase = new Map<string, PublicCustomerBookingItem[]>();
  const byMultiServiceGroup = new Map<string, PublicCustomerBookingItem[]>();

  for (const booking of bookings) {
    if (booking.packagePurchaseId) {
      const list = byPurchase.get(booking.packagePurchaseId) ?? [];
      list.push(booking);
      byPurchase.set(booking.packagePurchaseId, list);
      continue;
    }
    // e2e-bug.34 — group same_visit blocks; per_service stays line-level cards.
    if (
      booking.multiServiceGroupId &&
      booking.multiServiceSchedulingMode !== 'per_service'
    ) {
      const list = byMultiServiceGroup.get(booking.multiServiceGroupId) ?? [];
      list.push(booking);
      byMultiServiceGroup.set(booking.multiServiceGroupId, list);
      continue;
    }
    standalone.push(booking);
  }

  return {
    standalone,
    packageGroups: [...byPurchase.values()].map(buildPackageVisitFromBookings),
    multiServiceGroups: [...byMultiServiceGroup.values()].map(
      buildMultiServiceVisitFromBookings,
    ),
  };
}

export function buildPackageVisitFromBookings(
  bookings: PublicCustomerBookingItem[],
): PublicPackageVisitSummary & { anchorBookingId: string } {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const anchor = sorted[0];
  const active = sorted.filter((b) => ACTIVE_STATUSES.has(b.status));

  const appointments: PublicPackageVisitAppointment[] = sorted.map((booking) => ({
    bookingId: booking.id,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    employeeId: booking.employeeId,
    employeeName: booking.employeeName,
    status: booking.status,
    canCancel: booking.canCancel,
    canReschedule: booking.canReschedule,
    rescheduleCount: booking.rescheduleCount ?? 0,
    maxReschedules: booking.maxReschedules ?? 0,
  }));

  return {
    anchorBookingId: anchor.id,
    packagePurchaseId: anchor.packagePurchaseId!,
    packageId: anchor.packageId ?? null,
    packageName: anchor.packageName ?? 'Package visit',
    appointments,
    canCancelAll: active.length > 0 && active.every((b) => b.canCancel),
    canRescheduleAll: active.length > 0 && active.every((b) => b.canReschedule),
    policyMessage: sorted.find((b) => b.policyMessage)?.policyMessage ?? null,
    allowProviderChangeOnReschedule: anchor.allowProviderChangeOnReschedule === true,
  };
}

export function buildMultiServiceVisitFromBookings(
  bookings: PublicCustomerBookingItem[],
): PublicMultiServiceVisitSummary & { anchorBookingId: string } {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const anchor = sorted[0]!;
  const active = sorted.filter((b) => ACTIVE_STATUSES.has(b.status));
  const schedulingMode =
    sorted.find((b) => b.multiServiceSchedulingMode)?.multiServiceSchedulingMode ??
    null;
  const isSameVisit = schedulingMode !== 'per_service';

  const appointments: PublicPackageVisitAppointment[] = sorted.map((booking) => ({
    bookingId: booking.id,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    employeeId: booking.employeeId,
    employeeName: booking.employeeName,
    status: booking.status,
    canCancel: booking.canCancel,
    canReschedule: booking.canReschedule,
    rescheduleCount: booking.rescheduleCount ?? 0,
    maxReschedules: booking.maxReschedules ?? 0,
  }));

  const label =
    sorted.map((b) => b.serviceName).filter(Boolean).join(' + ') ||
    'Multi-service visit';

  return {
    anchorBookingId: anchor.id,
    multiServiceGroupId: anchor.multiServiceGroupId!,
    schedulingMode,
    label,
    appointments,
    // Cancel/reschedule cascade only for same_visit (BookingService).
    canCancelAll:
      isSameVisit && active.length > 0 && active.every((b) => b.canCancel),
    canRescheduleAll:
      isSameVisit && active.length > 0 && active.every((b) => b.canReschedule),
    policyMessage: sorted.find((b) => b.policyMessage)?.policyMessage ?? null,
    allowProviderChangeOnReschedule: anchor.allowProviderChangeOnReschedule === true,
  };
}
