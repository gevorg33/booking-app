/**
 * e2e-bug.221 — web account “Running late” CTA eligibility.
 * Mirrors backend `buildCustomerRunningLateEligibility` (customer-running-late.util).
 */

export const ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES = 10;
export const ACCOUNT_RUNNING_LATE_MINUTE_OPTIONS = [5, 10, 15, 20, 30] as const;
export const ACCOUNT_RUNNING_LATE_MIN_MINUTES = 1;
export const ACCOUNT_RUNNING_LATE_MAX_MINUTES = 120;

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'in_progress']);

const NOTIFY_WINDOW_BEFORE_MS = 6 * 60 * 60 * 1000;
const NOTIFY_WINDOW_AFTER_MS = 30 * 60 * 1000;

export type AccountRunningLateBookingLike = {
  status: string;
  startTime: string | Date;
  endTime: string | Date;
};

export type AccountRunningLateEligibility = {
  allowed: boolean;
  reason:
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'status'
    | 'too_early'
    | 'too_late'
    | null;
};

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function buildAccountRunningLateEligibility(
  booking: AccountRunningLateBookingLike,
  now: Date = new Date(),
): AccountRunningLateEligibility {
  const status = (booking.status || '').toLowerCase();
  if (status === 'completed') {
    return { allowed: false, reason: 'completed' };
  }
  if (status === 'cancelled') {
    return { allowed: false, reason: 'cancelled' };
  }
  if (status === 'no_show') {
    return { allowed: false, reason: 'no_show' };
  }
  if (!ACTIVE_STATUSES.has(status)) {
    return { allowed: false, reason: 'status' };
  }

  const startMs = asDate(booking.startTime).getTime();
  const endMs = asDate(booking.endTime).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return { allowed: false, reason: 'status' };
  }

  const nowMs = now.getTime();
  if (nowMs < startMs - NOTIFY_WINDOW_BEFORE_MS) {
    return { allowed: false, reason: 'too_early' };
  }
  if (nowMs > endMs + NOTIFY_WINDOW_AFTER_MS) {
    return { allowed: false, reason: 'too_late' };
  }

  return { allowed: true, reason: null };
}

/** Show CTA only for signed-in customers inside the notify window. */
export function shouldShowAccountRunningLateCta(input: {
  signedIn: boolean;
  status: string;
  startTime: string | Date;
  endTime: string | Date;
  now?: Date;
}): boolean {
  if (!input.signedIn) return false;
  return buildAccountRunningLateEligibility(
    {
      status: input.status,
      startTime: input.startTime,
      endTime: input.endTime,
    },
    input.now ?? new Date(),
  ).allowed;
}

export function normalizeAccountRunningLateMinutes(
  value?: number | string | null,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES;
  return Math.min(
    ACCOUNT_RUNNING_LATE_MAX_MINUTES,
    Math.max(ACCOUNT_RUNNING_LATE_MIN_MINUTES, Math.round(parsed)),
  );
}

export function buildAccountRunningLateRequestBody(
  minutesLate?: number | null,
): { minutesLate: number } | Record<string, never> {
  if (minutesLate == null) return {};
  return { minutesLate: normalizeAccountRunningLateMinutes(minutesLate) };
}
