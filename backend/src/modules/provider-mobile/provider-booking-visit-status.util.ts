/** prov-exp-3.2 — provider running late / ready now on booking metadata. */

import type { EntityManager, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import {
  normalizeProviderRunningLateMinutes,
  type ProviderVisitStatusKind,
} from '../../common/utils/provider-visit-status-notification.util.js';

export type { ProviderVisitStatusKind };
export { normalizeProviderRunningLateMinutes } from '../../common/utils/provider-visit-status-notification.util.js';

export interface ProviderVisitStatusSnapshot {
  kind: ProviderVisitStatusKind;
  minutesLate?: number;
  markedAt: string;
  markedByUserId?: string;
}

export interface ProviderVisitStatusBookingLike {
  status: string;
  checkedInAt?: Date | string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProviderVisitStatusActionEligibility {
  allowed: boolean;
  reason: string | null;
}

const VISIT_STATUS_ALLOWED_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

export const PROVIDER_VISIT_STATUS_METADATA_KEY = 'providerVisitStatus';

function readVisitStatusRaw(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const raw = metadata?.[PROVIDER_VISIT_STATUS_METADATA_KEY];
  return raw && typeof raw === 'object'
    ? (raw as Record<string, unknown>)
    : null;
}

export function readProviderVisitStatus(
  metadata?: Record<string, unknown> | null,
): ProviderVisitStatusSnapshot | null {
  const raw = readVisitStatusRaw(metadata);
  if (!raw) return null;

  const kind =
    raw.kind === 'running_late' || raw.kind === 'ready_now' ? raw.kind : null;
  const markedAt = typeof raw.markedAt === 'string' ? raw.markedAt : null;
  if (!kind || !markedAt) return null;

  const minutesLate =
    kind === 'running_late'
      ? normalizeProviderRunningLateMinutes(
          raw.minutesLate as number | undefined,
        )
      : undefined;

  return {
    kind,
    ...(minutesLate != null ? { minutesLate } : {}),
    markedAt,
    markedByUserId:
      typeof raw.markedByUserId === 'string' ? raw.markedByUserId : undefined,
  };
}

export function buildProviderVisitStatusSnapshot(input: {
  kind: ProviderVisitStatusKind;
  minutesLate?: number;
  markedAt?: Date;
  markedByUserId?: string;
}): ProviderVisitStatusSnapshot {
  const markedAt = (input.markedAt ?? new Date()).toISOString();
  if (input.kind === 'ready_now') {
    return {
      kind: 'ready_now',
      markedAt,
      ...(input.markedByUserId ? { markedByUserId: input.markedByUserId } : {}),
    };
  }

  return {
    kind: 'running_late',
    minutesLate: normalizeProviderRunningLateMinutes(input.minutesLate),
    markedAt,
    ...(input.markedByUserId ? { markedByUserId: input.markedByUserId } : {}),
  };
}

export function applyProviderVisitStatusToMetadata(
  metadata: Record<string, unknown> | null | undefined,
  snapshot: ProviderVisitStatusSnapshot,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [PROVIDER_VISIT_STATUS_METADATA_KEY]: snapshot,
  };
}

function hasCheckedInAt(value?: Date | string | null): boolean {
  if (value == null || value === '') return false;
  const parsed = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export function buildProviderVisitStatusEligibility(
  booking: ProviderVisitStatusBookingLike,
): ProviderVisitStatusActionEligibility {
  if (booking.status === BookingStatus.COMPLETED) {
    return { allowed: false, reason: 'Visit already completed' };
  }
  if (booking.status === BookingStatus.CANCELLED) {
    return {
      allowed: false,
      reason: 'Cancelled appointments cannot be updated',
    };
  }
  if (booking.status === BookingStatus.NO_SHOW) {
    return { allowed: false, reason: 'No-show appointments cannot be updated' };
  }
  if (!VISIT_STATUS_ALLOWED_STATUSES.has(booking.status)) {
    return {
      allowed: false,
      reason: 'Visit status updates are not available for this booking',
    };
  }
  // e2e-bug.70 — ready-now / running-late only after the client has checked in.
  if (!hasCheckedInAt(booking.checkedInAt)) {
    return {
      allowed: false,
      reason: 'Check in the client before updating visit status',
    };
  }
  return { allowed: true, reason: null };
}

export function formatProviderVisitStatusLabel(input: {
  kind: ProviderVisitStatusKind;
  minutesLate?: number;
}): string {
  if (input.kind === 'ready_now') return 'Ready now';
  const minutes = normalizeProviderRunningLateMinutes(input.minutesLate);
  return `Running ${minutes}m late`;
}

/** True when the booking already has the same visit-status kind (and minutes for late). */
export function isSameProviderVisitStatusClaim(
  existing: ProviderVisitStatusSnapshot | null,
  kind: ProviderVisitStatusKind,
  minutesLate?: number,
): boolean {
  if (!existing || existing.kind !== kind) return false;
  if (kind === 'ready_now') return true;
  return (
    normalizeProviderRunningLateMinutes(existing.minutesLate) ===
    normalizeProviderRunningLateMinutes(minutesLate)
  );
}

export type ClaimProviderVisitStatusResult =
  | {
      ok: true;
      booking: Booking;
      snapshot: ProviderVisitStatusSnapshot;
      alreadySet: boolean;
    }
  | { ok: false; reason: string; code: 'not_found' | 'not_allowed' };

/**
 * e2e-bug.255 — claim ready_now / running_late under SELECT … FOR UPDATE so
 * concurrent taps serialize: only the first writer may notify the customer.
 * Same-kind already set → idempotent success without re-save / re-notify.
 *
 * e2e-bug.184 residual: never combine `pessimistic_write` with outer joins of
 * nullable relations — lock the booking row alone, then load relations after.
 */
export async function claimProviderVisitStatus(
  bookingRepo: Repository<Booking>,
  input: {
    bookingId: string;
    businessId: string;
    kind: ProviderVisitStatusKind;
    minutesLate?: number;
    markedByUserId?: string;
    markedAt?: Date;
  },
): Promise<ClaimProviderVisitStatusResult> {
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

    const eligibility = buildProviderVisitStatusEligibility(booking);
    if (!eligibility.allowed) {
      return {
        ok: false,
        code: 'not_allowed',
        reason:
          eligibility.reason ??
          'Visit status cannot be updated for this booking',
      };
    }

    const existing = readProviderVisitStatus(booking.metadata);
    if (
      isSameProviderVisitStatusClaim(existing, input.kind, input.minutesLate)
    ) {
      const withRelations = await manager.findOne(Booking, {
        where: { id: booking.id },
        relations: { customer: true, service: true, employee: true },
      });
      return {
        ok: true,
        alreadySet: true,
        snapshot: existing!,
        booking: withRelations ?? booking,
      };
    }

    const snapshot = buildProviderVisitStatusSnapshot({
      kind: input.kind,
      minutesLate: input.minutesLate,
      markedByUserId: input.markedByUserId,
      markedAt: input.markedAt,
    });
    booking.metadata = applyProviderVisitStatusToMetadata(
      booking.metadata,
      snapshot,
    );
    const saved = await manager.save(Booking, booking);

    const withRelations = await manager.findOne(Booking, {
      where: { id: saved.id },
      relations: { customer: true, service: true, employee: true },
    });
    return {
      ok: true,
      alreadySet: false,
      snapshot,
      booking: withRelations ?? saved,
    };
  });
}
