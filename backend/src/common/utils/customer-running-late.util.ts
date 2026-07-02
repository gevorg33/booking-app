import { BookingStatus } from '../../modules/booking/entities/booking.entity.js';
import {
  DEFAULT_PROVIDER_RUNNING_LATE_MINUTES,
  normalizeProviderRunningLateMinutes,
} from './provider-visit-status-notification.util.js';

export const CUSTOMER_RUNNING_LATE_METADATA_KEY = 'customerRunningLate';

export interface CustomerRunningLateSnapshot {
  minutesLate: number;
  notifiedAt: string;
  customerId?: string;
}

export interface CustomerRunningLateBookingLike {
  status: string;
  startTime: Date;
  endTime: Date;
  metadata?: Record<string, unknown> | null;
}

export interface CustomerRunningLateEligibility {
  allowed: boolean;
  reason: string | null;
}

const ACTIVE_STATUSES = new Set<string>([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
]);

const NOTIFY_WINDOW_BEFORE_MS = 6 * 60 * 60 * 1000;
const NOTIFY_WINDOW_AFTER_MS = 30 * 60 * 1000;

export { normalizeProviderRunningLateMinutes as normalizeCustomerRunningLateMinutes };

export function readCustomerRunningLate(
  metadata?: Record<string, unknown> | null,
): CustomerRunningLateSnapshot | null {
  const raw = metadata?.[CUSTOMER_RUNNING_LATE_METADATA_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const notifiedAt = typeof row.notifiedAt === 'string' ? row.notifiedAt : null;
  if (!notifiedAt) return null;
  return {
    minutesLate: normalizeProviderRunningLateMinutes(
      row.minutesLate as number | undefined,
    ),
    notifiedAt,
    customerId: typeof row.customerId === 'string' ? row.customerId : undefined,
  };
}

export function buildCustomerRunningLateSnapshot(input: {
  minutesLate?: number;
  notifiedAt?: Date;
  customerId?: string;
}): CustomerRunningLateSnapshot {
  return {
    minutesLate: normalizeProviderRunningLateMinutes(input.minutesLate),
    notifiedAt: (input.notifiedAt ?? new Date()).toISOString(),
    ...(input.customerId ? { customerId: input.customerId } : {}),
  };
}

export function applyCustomerRunningLateToMetadata(
  metadata: Record<string, unknown> | null | undefined,
  snapshot: CustomerRunningLateSnapshot,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [CUSTOMER_RUNNING_LATE_METADATA_KEY]: snapshot,
  };
}

export function buildCustomerRunningLateEligibility(
  booking: CustomerRunningLateBookingLike,
  now = new Date(),
): CustomerRunningLateEligibility {
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
  if (!ACTIVE_STATUSES.has(booking.status)) {
    return {
      allowed: false,
      reason: 'Running-late alerts are not available for this booking',
    };
  }

  const startMs = booking.startTime.getTime();
  const endMs = booking.endTime.getTime();
  const nowMs = now.getTime();
  if (nowMs < startMs - NOTIFY_WINDOW_BEFORE_MS) {
    return {
      allowed: false,
      reason: 'You can notify the salon closer to your appointment time',
    };
  }
  if (nowMs > endMs + NOTIFY_WINDOW_AFTER_MS) {
    return {
      allowed: false,
      reason: 'This appointment has already passed',
    };
  }

  return { allowed: true, reason: null };
}

export function buildCustomerRunningLateStaffSummary(input: {
  customerName: string;
  serviceName: string;
  minutesLate: number;
  whenLabel: string;
}): string {
  const serviceName = input.serviceName.trim() || 'appointment';
  const minutes = normalizeProviderRunningLateMinutes(input.minutesLate);
  return `${input.customerName} is running about ${minutes} minutes late for ${serviceName} (${input.whenLabel}).`;
}

export function buildCustomerRunningLateSuccessSummary(
  minutesLate: number,
): string {
  const minutes = normalizeProviderRunningLateMinutes(minutesLate);
  return `Got it — we notified the salon you're about ${minutes} minutes late.`;
}

export function defaultCustomerRunningLateMinutes(): number {
  return DEFAULT_PROVIDER_RUNNING_LATE_MINUTES;
}
