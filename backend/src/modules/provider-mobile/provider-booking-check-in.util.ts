/** prov-exp-3.1 — provider mobile client check-in. */

import type { EntityManager, Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../booking/entities/booking.entity.js';

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

export type ClaimProviderBookingCheckInResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: string; code: 'not_found' | 'not_allowed' };

/**
 * e2e-bug.74 — claim check-in under SELECT … FOR UPDATE so concurrent
 * check-ins serialize: only the first writer sets checkedInAt and may notify.
 *
 * e2e-bug.184 residual: never combine `pessimistic_write` with outer joins of
 * nullable relations — Postgres rejects that SQL. Lock the booking row alone,
 * then load relations after the write for push copy.
 */
export async function claimProviderBookingCheckIn(
  bookingRepo: Repository<Booking>,
  input: {
    bookingId: string;
    businessId: string;
    checkedInAt?: Date;
  },
): Promise<ClaimProviderBookingCheckInResult> {
  return bookingRepo.manager.transaction(async (manager: EntityManager) => {
    const booking = await manager.findOne(Booking, {
      where: { id: input.bookingId, businessId: input.businessId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!booking) {
      return {
        ok: false,
        code: 'not_found',
        reason: 'Booking not found',
      };
    }

    const eligibility = buildProviderCheckInEligibility(booking);
    if (!eligibility.allowed) {
      return {
        ok: false,
        code: 'not_allowed',
        reason: eligibility.reason ?? 'Check-in is not allowed for this booking',
      };
    }

    booking.checkedInAt = input.checkedInAt ?? new Date();
    const saved = await manager.save(Booking, booking);

    // Relations only for reception-push copy — never under the FOR UPDATE lock.
    const withRelations = await manager.findOne(Booking, {
      where: { id: saved.id },
      relations: { customer: true, service: true, employee: true },
    });
    return { ok: true, booking: withRelations ?? saved };
  });
}
