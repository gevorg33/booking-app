/** prov-exp-1.2 — recent completed visits for provider customer context. */

export interface ProviderBookingCompletedVisitView {
  bookingId: string;
  serviceName: string;
  providerName: string;
  completedAt: string;
}

export interface BookingForRecentVisit {
  id: string;
  endTime: Date;
  service?: { name?: string | null } | null;
  employee?: { name?: string | null } | null;
}

export const PROVIDER_RECENT_VISIT_LIMIT = 3;

export function buildProviderRecentCompletedVisits(
  bookings: BookingForRecentVisit[],
  limit = PROVIDER_RECENT_VISIT_LIMIT,
): ProviderBookingCompletedVisitView[] {
  return bookings.slice(0, limit).map((booking) => ({
    bookingId: booking.id,
    serviceName: booking.service?.name?.trim() || 'Service',
    providerName: booking.employee?.name?.trim() || 'Provider',
    completedAt: booking.endTime.toISOString(),
  }));
}
