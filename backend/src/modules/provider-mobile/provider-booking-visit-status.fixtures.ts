/** prov-exp-3.2 — provider visit status scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_VISIT_STATUS_ELIGIBILITY_SCENARIOS = [
  {
    id: 'allowed-confirmed',
    booking: { status: BookingStatus.CONFIRMED, metadata: null },
    allowed: true,
  },
  {
    id: 'blocked-completed',
    booking: { status: BookingStatus.COMPLETED, metadata: null },
    allowed: false,
  },
  {
    id: 'blocked-cancelled',
    booking: { status: BookingStatus.CANCELLED, metadata: null },
    allowed: false,
  },
  {
    id: 'blocked-no-show',
    booking: { status: BookingStatus.NO_SHOW, metadata: null },
    allowed: false,
  },
  {
    id: 'blocked-unknown-status',
    booking: { status: 'archived', metadata: null },
    allowed: false,
  },
] as const;

export const PROVIDER_VISIT_STATUS_INVALID_READ_SCENARIOS = [
  {
    id: 'invalid-kind',
    metadata: { providerVisitStatus: { kind: 'busy', markedAt: '2026-06-09T09:50:00.000Z' } },
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
