/** prov-exp-3.1 — provider check-in scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_FLOOR_STATUS_SCENARIOS = [
  {
    id: 'waiting-confirmed',
    booking: { status: BookingStatus.CONFIRMED, checkedInAt: null },
    expected: 'waiting' as const,
  },
  {
    id: 'checked-in',
    booking: {
      status: BookingStatus.CONFIRMED,
      checkedInAt: '2026-06-09T09:55:00.000Z',
    },
    expected: 'checked_in' as const,
  },
  {
    id: 'completed',
    booking: {
      status: BookingStatus.COMPLETED,
      checkedInAt: '2026-06-09T09:55:00.000Z',
    },
    expected: 'completed' as const,
  },
  {
    id: 'no-show',
    booking: { status: BookingStatus.NO_SHOW, checkedInAt: null },
    expected: 'no_show' as const,
  },
] as const;

export const PROVIDER_CHECK_IN_ELIGIBILITY_SCENARIOS = [
  {
    id: 'allowed-confirmed',
    booking: { status: BookingStatus.CONFIRMED, checkedInAt: null },
    allowed: true,
  },
  {
    id: 'blocked-already-checked-in',
    booking: {
      status: BookingStatus.CONFIRMED,
      checkedInAt: '2026-06-09T09:55:00.000Z',
    },
    allowed: false,
  },
  {
    id: 'blocked-completed',
    booking: { status: BookingStatus.COMPLETED, checkedInAt: null },
    allowed: false,
  },
  {
    id: 'blocked-cancelled',
    booking: { status: BookingStatus.CANCELLED, checkedInAt: null },
    allowed: false,
  },
  {
    id: 'blocked-no-show',
    booking: { status: BookingStatus.NO_SHOW, checkedInAt: null },
    allowed: false,
  },
  {
    id: 'blocked-unknown-status',
    booking: { status: 'archived', checkedInAt: null },
    allowed: false,
  },
] as const;
