/** prov-exp-4.1 — team floor scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const TEAM_FLOOR_CHIP_STATUS_SCENARIOS = [
  {
    id: 'waiting-confirmed',
    booking: { status: BookingStatus.CONFIRMED, checkedInAt: null },
    expected: 'waiting' as const,
  },
  {
    id: 'in-service-checked-in',
    booking: {
      status: BookingStatus.CONFIRMED,
      checkedInAt: '2026-06-09T10:05:00.000Z',
    },
    expected: 'in_service' as const,
  },
  {
    id: 'in-service-progress',
    booking: { status: BookingStatus.IN_PROGRESS, checkedInAt: null },
    expected: 'in_service' as const,
  },
  {
    id: 'done',
    booking: { status: BookingStatus.COMPLETED, checkedInAt: null },
    expected: 'done' as const,
  },
  {
    id: 'no-show',
    booking: { status: BookingStatus.NO_SHOW, checkedInAt: null },
    expected: 'no_show' as const,
  },
] as const;

export const TEAM_FLOOR_COLUMN_SCENARIOS = [
  {
    id: 'groups-by-provider',
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T12:00:00.000Z',
        endTime: '2026-06-09T13:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        employee: { id: 'emp-2', name: 'Zara' },
      },
      {
        id: 'b2',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.COMPLETED,
        employee: { id: 'emp-1', name: 'Alex' },
      },
      {
        id: 'b3',
        startTime: '2026-06-09T11:00:00.000Z',
        endTime: '2026-06-09T12:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        employee: { id: 'emp-1', name: 'Alex' },
      },
    ],
    expectedColumnIds: ['emp-1', 'emp-2'],
    expectedFirstBookingIds: ['b2', 'b3'],
  },
] as const;
