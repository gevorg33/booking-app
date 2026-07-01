/** prov-exp-3.1 — provider mobile client check-in. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export type ProviderBookingFloorStatus =
  | 'waiting'
  | 'checked_in'
  | 'completed'
  | 'no_show';

export interface ProviderMobileSettings {
  notifyReceptionOnCheckIn: boolean;
  notifyCustomerOnVisitStatus: boolean;
}

export const DEFAULT_PROVIDER_MOBILE_SETTINGS: ProviderMobileSettings = {
  notifyReceptionOnCheckIn: false,
  notifyCustomerOnVisitStatus: false,
};

export interface ProviderCheckInBookingLike {
  status: string;
  checkedInAt?: Date | string | null;
}

export interface ProviderCheckInEligibility {
  allowed: boolean;
  reason: string | null;
}

const CHECK_IN_ALLOWED_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

function parseCheckedInAt(value?: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readProviderMobileSettings(
  settings?: Record<string, unknown> | null,
): ProviderMobileSettings {
  const raw =
    (settings?.providerMobile as Record<string, unknown> | undefined) ?? {};
  return {
    notifyReceptionOnCheckIn: raw.notifyReceptionOnCheckIn === true,
    notifyCustomerOnVisitStatus: raw.notifyCustomerOnVisitStatus === true,
  };
}

export function providerMobileNotifyCustomerOnVisitStatus(
  settings?: Record<string, unknown> | null,
): boolean {
  return readProviderMobileSettings(settings).notifyCustomerOnVisitStatus;
}

export function providerMobileNotifyReceptionOnCheckIn(
  settings?: Record<string, unknown> | null,
): boolean {
  return readProviderMobileSettings(settings).notifyReceptionOnCheckIn;
}

export function resolveProviderBookingFloorStatus(
  booking: ProviderCheckInBookingLike,
): ProviderBookingFloorStatus {
  if (booking.status === BookingStatus.COMPLETED) return 'completed';
  if (booking.status === BookingStatus.NO_SHOW) return 'no_show';
  if (parseCheckedInAt(booking.checkedInAt)) return 'checked_in';
  return 'waiting';
}

export function buildProviderCheckInEligibility(
  booking: ProviderCheckInBookingLike,
): ProviderCheckInEligibility {
  if (booking.status === BookingStatus.COMPLETED) {
    return { allowed: false, reason: 'Visit already completed' };
  }
  if (booking.status === BookingStatus.CANCELLED) {
    return {
      allowed: false,
      reason: 'Cancelled appointments cannot be checked in',
    };
  }
  if (booking.status === BookingStatus.NO_SHOW) {
    return {
      allowed: false,
      reason: 'No-show appointments cannot be checked in',
    };
  }
  if (!CHECK_IN_ALLOWED_STATUSES.has(booking.status)) {
    return {
      allowed: false,
      reason: 'Check-in is not available for this visit',
    };
  }
  if (parseCheckedInAt(booking.checkedInAt)) {
    return { allowed: false, reason: 'Client is already checked in' };
  }
  return { allowed: true, reason: null };
}

export function buildProviderCheckInPushMessage(input: {
  customerName: string;
  serviceName: string;
  providerName: string;
  whenLabel: string;
}): { title: string; body: string } {
  return {
    title: 'Client checked in',
    body: `${input.customerName} — ${input.serviceName} with ${input.providerName} at ${input.whenLabel}`,
  };
}
