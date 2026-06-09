/** prov-exp-1.4 — package / subscription / multi-service badges for provider booking detail. */

import { BookingStatus, type Booking } from '../booking/entities/booking.entity.js';
import {
  readPackageIdFromMetadata,
  readPackageNameFromMetadata,
  sortPackageVisitBookings,
} from '../public-booking/public-customer-package-visit.util.js';
import type { MultiServiceBookingGroup } from '../multi-service-bookings/entities/multi-service-booking-group.entity.js';
import type { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';

const TERMINAL_STATUSES = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW,
]);

export interface ProviderBookingPackageBadge {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  serviceIndex: number;
  serviceTotal: number;
  visitsRemaining: number;
}

export interface ProviderBookingSubscriptionBadge {
  subscriptionId: string;
  planName: string;
  status: string;
  appointmentsRemaining: number;
  appointmentsIncluded: number;
  isActive: boolean;
}

export interface ProviderBookingMultiServiceLine {
  bookingId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  employeeName: string;
  status: string;
  isCurrent: boolean;
}

export interface ProviderBookingMultiServiceBadge {
  groupId: string;
  schedulingMode: 'same_visit' | 'per_service';
  serviceCount: number;
  totalDurationMinutes: number;
  totalPrice: number;
  currency: string;
  lines: ProviderBookingMultiServiceLine[];
}

export interface ProviderBookingCheckoutContextView {
  package: ProviderBookingPackageBadge | null;
  subscription: ProviderBookingSubscriptionBadge | null;
  multiService: ProviderBookingMultiServiceBadge | null;
}

export function readSubscriptionIdFromBookingMetadata(
  metadata?: Record<string, unknown> | null,
): string | null {
  const raw = metadata?.subscriptionId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function buildProviderPackageBadge(
  booking: Booking,
  siblings: Booking[],
): ProviderBookingPackageBadge | null {
  if (!booking.packagePurchaseId) return null;

  const sorted = sortPackageVisitBookings(
    siblings.length ? siblings : [booking],
  );
  const serviceTotal = sorted.length;
  const serviceIndex = Math.max(
    1,
    sorted.findIndex((row) => row.id === booking.id) + 1,
  );
  const visitsRemaining = sorted.filter(
    (row) => !TERMINAL_STATUSES.has(row.status),
  ).length;

  return {
    packagePurchaseId: booking.packagePurchaseId,
    packageId: readPackageIdFromMetadata(booking.metadata),
    packageName: readPackageNameFromMetadata(booking.metadata) ?? 'Package visit',
    serviceIndex,
    serviceTotal,
    visitsRemaining,
  };
}

export function buildProviderSubscriptionBadge(
  subscription: CustomerSubscription & { plan?: { name?: string | null } | null },
): ProviderBookingSubscriptionBadge {
  return {
    subscriptionId: subscription.id,
    planName: subscription.plan?.name?.trim() || 'Subscription',
    status: subscription.status,
    appointmentsRemaining: subscription.appointmentsRemaining,
    appointmentsIncluded: subscription.appointmentsIncluded,
    isActive: subscription.status === 'active',
  };
}

export function buildProviderMultiServiceBadge(
  group: MultiServiceBookingGroup,
  siblings: Booking[],
  currentBookingId: string,
): ProviderBookingMultiServiceBadge {
  const sorted = [...siblings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  return {
    groupId: group.id,
    schedulingMode: group.schedulingMode,
    serviceCount: sorted.length,
    totalDurationMinutes: group.totalDurationMinutes,
    totalPrice: Number(group.totalPrice),
    currency: group.currency,
    lines: sorted.map((row) => ({
      bookingId: row.id,
      serviceName: row.service?.name ?? 'Service',
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      employeeName: row.employee?.name ?? 'Provider',
      status: row.status,
      isCurrent: row.id === currentBookingId,
    })),
  };
}

export function buildProviderBookingCheckoutContextView(input: {
  package: ProviderBookingPackageBadge | null;
  subscription: ProviderBookingSubscriptionBadge | null;
  multiService: ProviderBookingMultiServiceBadge | null;
}): ProviderBookingCheckoutContextView {
  return {
    package: input.package,
    subscription: input.subscription,
    multiService: input.multiService,
  };
}
