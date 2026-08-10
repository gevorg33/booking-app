/** prov-exp-3.2 — provider visit status scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_VISIT_STATUS_ELIGIBILITY_SCENARIOS = [
  {
    id: 'allowed-confirmed-checked-in',
    booking: {
      status: BookingStatus.CONFIRMED,
      checkedInAt: '2026-06-09T09:55:00.000Z',
      metadata: null,
    },
    allowed: true,
  },
  {
    id: 'e2e70-blocked-not-checked-in',
    booking: {
      status: BookingStatus.CONFIRMED,
      checkedInAt: null,
      metadata: null,
    },
    allowed: false,
    reason: 'Check in the client before updating visit status',
  },
  {
    id: 'blocked-completed',
    booking: {
      status: BookingStatus.COMPLETED,
      checkedInAt: '2026-06-09T09:55:00.000Z',
      metadata: null,
    },
    allowed: false,
  },
  {
    id: 'blocked-cancelled',
    booking: {
      status: BookingStatus.CANCELLED,
      checkedInAt: null,
      metadata: null,
    },
    allowed: false,
  },
  {
    id: 'blocked-no-show',
    booking: {
      status: BookingStatus.NO_SHOW,
      checkedInAt: null,
      metadata: null,
    },
    allowed: false,
  },
  {
    id: 'blocked-unknown-status',
    booking: { status: 'archived', checkedInAt: null, metadata: null },
    allowed: false,
  },
] as const;

export const PROVIDER_VISIT_STATUS_INVALID_READ_SCENARIOS = [
  {
    id: 'invalid-kind',
    metadata: {
      providerVisitStatus: {
        kind: 'busy',
        markedAt: '2026-06-09T09:50:00.000Z',
      },
    },
  },
  {
    id: 'missing-marked-at',
    metadata: { providerVisitStatus: { kind: 'ready_now' } },
  },
] as const;

export const PROVIDER_RUNNING_LATE_MINUTES_SCENARIOS = [
  { id: 'default', input: undefined, expected: 10 },
  { id: 'custom', input: 15, expected: 15 },
  { id: 'clamp-high', input: 500, expected: 120 },
  { id: 'clamp-low', input: 0, expected: 1 },
] as const;

export const PROVIDER_VISIT_STATUS_READ_SCENARIOS = [
  {
    id: 'running-late',
    metadata: {
      providerVisitStatus: {
        kind: 'running_late',
        minutesLate: 10,
        markedAt: '2026-06-09T09:50:00.000Z',
      },
    },
    expectedKind: 'running_late' as const,
    expectedMinutes: 10,
  },
  {
    id: 'ready-now',
    metadata: {
      providerVisitStatus: {
        kind: 'ready_now',
        markedAt: '2026-06-09T09:50:00.000Z',
      },
    },
    expectedKind: 'ready_now' as const,
    expectedMinutes: undefined,
  },
] as const;
