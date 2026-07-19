import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import {
  evaluateCustomerBookingPolicy,
  readRescheduleCount,
  type CustomerSelfServiceSettings,
} from '../../common/utils/customer-self-service.util.js';
import type {
  PackageBookingLineInput,
  PackageServiceLineInput,
} from '../../common/utils/package-booking.util.js';

export const PACKAGE_VISIT_ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.PENDING,
];

export function readPackageIdFromMetadata(
  metadata?: Record<string, unknown> | null,
): string | null {
  const raw = metadata?.packageId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function readPackageNameFromMetadata(
  metadata?: Record<string, unknown> | null,
): string | null {
  const raw = metadata?.packageName;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

/** e2e-bug.34 — scheduling mode stamped on multi-service booking metadata. */
export function readMultiServiceSchedulingMode(
  metadata?: Record<string, unknown> | null,
): 'same_visit' | 'per_service' | null {
  const raw = metadata?.schedulingMode;
  if (raw === 'same_visit' || raw === 'per_service') return raw;
  return null;
}

export function isPackageVisitBooking(booking: Booking): boolean {
  return Boolean(booking.packagePurchaseId);
}

export function sortPackageVisitBookings(bookings: Booking[]): Booking[] {
  return [...bookings].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

export function toPackageServiceLines(
  bookings: Booking[],
): PackageServiceLineInput[] {
  return sortPackageVisitBookings(bookings).map((booking) => ({
    serviceId: booking.serviceId,
    durationMinutes: booking.service?.durationMinutes ?? 30,
    bufferMinutes: booking.service?.bufferMinutes ?? 0,
  }));
}

export function toPackageLineInputs(
  bookings: Booking[],
  lines: Array<{ bookingId: string; startTime: string; employeeId?: string }>,
): PackageBookingLineInput[] {
  const byId = new Map(lines.map((line) => [line.bookingId, line]));
  return sortPackageVisitBookings(bookings).map((booking) => {
    const line = byId.get(booking.id);
    if (!line) {
      throw new Error('Each package appointment must have a new time');
    }
    return {
      serviceId: booking.serviceId,
      employeeId: line.employeeId ?? booking.employeeId,
      startTime: line.startTime,
    };
  });
}

export interface PackageVisitPolicySummary {
  canCancelAll: boolean;
  canRescheduleAll: boolean;
  policyMessage: string | null;
}

export function evaluatePackageVisitPolicy(
  bookings: Booking[],
  settings: CustomerSelfServiceSettings,
): PackageVisitPolicySummary {
  const active = bookings.filter((b) =>
    PACKAGE_VISIT_ACTIVE_STATUSES.includes(b.status),
  );
  if (active.length === 0) {
    return {
      canCancelAll: false,
      canRescheduleAll: false,
      policyMessage: 'This package visit is no longer active',
    };
  }

  let canCancelAll = true;
  let canRescheduleAll = true;
  let policyMessage: string | null = null;

  for (const booking of active) {
    const cancel = evaluateCustomerBookingPolicy(booking, settings, 'cancel');
    const reschedule = evaluateCustomerBookingPolicy(
      booking,
      settings,
      'reschedule',
    );
    if (!cancel.allowed) {
      canCancelAll = false;
      policyMessage ??= cancel.reason ?? null;
    }
    if (!reschedule.allowed) {
      canRescheduleAll = false;
      policyMessage ??= reschedule.reason ?? null;
    }
    if (
      settings.maxReschedulesPerBooking > 0 &&
      readRescheduleCount(booking.metadata) >= settings.maxReschedulesPerBooking
    ) {
      canRescheduleAll = false;
      policyMessage ??= `This visit has reached the maximum of ${settings.maxReschedulesPerBooking} reschedules for one or more appointments`;
    }
  }

  return { canCancelAll, canRescheduleAll, policyMessage };
}
