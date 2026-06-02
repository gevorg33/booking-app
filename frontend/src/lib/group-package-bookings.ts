import type {
  PublicCustomerBookingItem,
  PublicPackageVisitAppointment,
  PublicPackageVisitSummary,
} from '@/lib/public-api';

const ACTIVE_STATUSES = new Set(['confirmed', 'pending']);

export function groupBookingsForAccount(bookings: PublicCustomerBookingItem[]) {
  const standalone: PublicCustomerBookingItem[] = [];
  const byPurchase = new Map<string, PublicCustomerBookingItem[]>();

  for (const booking of bookings) {
    if (booking.packagePurchaseId) {
      const list = byPurchase.get(booking.packagePurchaseId) ?? [];
      list.push(booking);
      byPurchase.set(booking.packagePurchaseId, list);
    } else {
      standalone.push(booking);
    }
  }

  return {
    standalone,
    packageGroups: [...byPurchase.values()].map(buildPackageVisitFromBookings),
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
    rescheduleCount: booking.rescheduleCount,
    maxReschedules: booking.maxReschedules,
  }));

  const canCancelAll = active.length > 0 && active.every((b) => b.canCancel);
  const canRescheduleAll = active.length > 0 && active.every((b) => b.canReschedule);

  return {
    anchorBookingId: anchor.id,
    packagePurchaseId: anchor.packagePurchaseId!,
    packageId: anchor.packageId ?? null,
    packageName: anchor.packageName ?? 'Package visit',
    appointments,
    canCancelAll,
    canRescheduleAll,
    policyMessage:
      sorted.find((b) => b.policyMessage)?.policyMessage ??
      (!canCancelAll && !canRescheduleAll ? null : null),
    allowProviderChangeOnReschedule: anchor.allowProviderChangeOnReschedule === true,
  };
}
