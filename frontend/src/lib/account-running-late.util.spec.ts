import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES,
  ACCOUNT_RUNNING_LATE_MAX_MINUTES,
  ACCOUNT_RUNNING_LATE_MIN_MINUTES,
  ACCOUNT_RUNNING_LATE_MINUTE_OPTIONS,
  buildAccountRunningLateEligibility,
  buildAccountRunningLateRequestBody,
  normalizeAccountRunningLateMinutes,
  shouldShowAccountRunningLateCta,
} from './account-running-late.util';

describe('account-running-late.util (e2e-bug.221)', () => {
  const startTime = '2030-06-01T14:00:00.000Z';
  const endTime = '2030-06-01T15:00:00.000Z';

  it.each([
    {
      id: 'confirmed-30m-before',
      status: 'confirmed',
      now: '2030-06-01T13:30:00.000Z',
      allowed: true,
      reason: null,
    },
    {
      id: 'pending-at-start',
      status: 'pending',
      now: '2030-06-01T14:00:00.000Z',
      allowed: true,
      reason: null,
    },
    {
      id: 'in-progress-during-visit',
      status: 'in_progress',
      now: '2030-06-01T14:30:00.000Z',
      allowed: true,
      reason: null,
    },
    {
      id: 'window-opens-exactly-6h-before',
      status: 'confirmed',
      now: '2030-06-01T08:00:00.000Z',
      allowed: true,
      reason: null,
    },
    {
      id: 'grace-30m-after-end',
      status: 'confirmed',
      now: '2030-06-01T15:30:00.000Z',
      allowed: true,
      reason: null,
    },
    {
      id: 'too-early',
      status: 'confirmed',
      now: '2030-06-01T07:59:59.000Z',
      allowed: false,
      reason: 'too_early',
    },
    {
      id: 'too-late',
      status: 'confirmed',
      now: '2030-06-01T15:30:01.000Z',
      allowed: false,
      reason: 'too_late',
    },
    {
      id: 'completed',
      status: 'completed',
      now: '2030-06-01T14:10:00.000Z',
      allowed: false,
      reason: 'completed',
    },
    {
      id: 'cancelled',
      status: 'cancelled',
      now: '2030-06-01T14:10:00.000Z',
      allowed: false,
      reason: 'cancelled',
    },
    {
      id: 'no-show',
      status: 'no_show',
      now: '2030-06-01T14:10:00.000Z',
      allowed: false,
      reason: 'no_show',
    },
    {
      id: 'unknown-status',
      status: 'draft',
      now: '2030-06-01T14:10:00.000Z',
      allowed: false,
      reason: 'status',
    },
  ])(
    'eligibility $id → allowed=$allowed reason=$reason',
    ({ status, now, allowed, reason }) => {
      expect(
        buildAccountRunningLateEligibility(
          { status, startTime, endTime },
          new Date(now),
        ),
      ).toEqual({ allowed, reason });
    },
  );

  it.each([
    {
      id: 'signed-in-in-window',
      signedIn: true,
      status: 'confirmed',
      now: '2030-06-01T13:00:00.000Z',
      show: true,
    },
    {
      id: 'guest-in-window',
      signedIn: false,
      status: 'confirmed',
      now: '2030-06-01T13:00:00.000Z',
      show: false,
    },
    {
      id: 'signed-in-too-early',
      signedIn: true,
      status: 'confirmed',
      now: '2030-06-01T01:00:00.000Z',
      show: false,
    },
    {
      id: 'signed-in-completed',
      signedIn: true,
      status: 'completed',
      now: '2030-06-01T14:10:00.000Z',
      show: false,
    },
    {
      id: 'case-insensitive-status',
      signedIn: true,
      status: 'CONFIRMED',
      now: '2030-06-01T13:00:00.000Z',
      show: true,
    },
  ])('shouldShowAccountRunningLateCta: $id', ({ signedIn, status, now, show }) => {
    expect(
      shouldShowAccountRunningLateCta({
        signedIn,
        status,
        startTime,
        endTime,
        now: new Date(now),
      }),
    ).toBe(show);
  });

  it('CTA can show when cancel/reschedule are closed (independent window)', () => {
    // Same eligibility window as backend — not gated on canCancel/canReschedule.
    expect(
      shouldShowAccountRunningLateCta({
        signedIn: true,
        status: 'confirmed',
        startTime,
        endTime,
        now: new Date('2030-06-01T14:05:00.000Z'),
      }),
    ).toBe(true);
  });

  it('normalizes minutes with default and clamps 1–120', () => {
    expect(normalizeAccountRunningLateMinutes(undefined)).toBe(
      ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES,
    );
    expect(normalizeAccountRunningLateMinutes('15')).toBe(15);
    expect(normalizeAccountRunningLateMinutes(0)).toBe(
      ACCOUNT_RUNNING_LATE_MIN_MINUTES,
    );
    expect(normalizeAccountRunningLateMinutes(999)).toBe(
      ACCOUNT_RUNNING_LATE_MAX_MINUTES,
    );
    expect(ACCOUNT_RUNNING_LATE_MINUTE_OPTIONS).toContain(
      ACCOUNT_RUNNING_LATE_DEFAULT_MINUTES,
    );
  });

  it('buildAccountRunningLateRequestBody omits body when minutes unset', () => {
    expect(buildAccountRunningLateRequestBody()).toEqual({});
    expect(buildAccountRunningLateRequestBody(null)).toEqual({});
    expect(buildAccountRunningLateRequestBody(15)).toEqual({ minutesLate: 15 });
  });
});
