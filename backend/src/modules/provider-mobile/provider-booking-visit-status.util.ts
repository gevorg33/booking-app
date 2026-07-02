/** prov-exp-3.2 — provider running late / ready now on booking metadata. */

import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  buildProviderVisitStatusCustomerSms,
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
