/** prov-exp-3.3 — Today timeline scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const PROVIDER_TODAY_TIMELINE_NOW_MARKER_SCENARIOS = [
  {
    id: 'midday',
    rangeStartMs: Date.parse('2026-06-09T09:00:00.000Z'),
    rangeEndMs: Date.parse('2026-06-09T17:00:00.000Z'),
    nowMs: Date.parse('2026-06-09T13:00:00.000Z'),
    expected: 50,
  },
  {
    id: 'before-range',
    rangeStartMs: Date.parse('2026-06-09T09:00:00.000Z'),
    rangeEndMs: Date.parse('2026-06-09T17:00:00.000Z'),
    nowMs: Date.parse('2026-06-09T08:00:00.000Z'),
    expected: null,
  },
  {
    id: 'after-range',
    rangeStartMs: Date.parse('2026-06-09T09:00:00.000Z'),
    rangeEndMs: Date.parse('2026-06-09T17:00:00.000Z'),
    nowMs: Date.parse('2026-06-09T18:00:00.000Z'),
    expected: null,
  },
] as const;

export const PROVIDER_TODAY_TIMELINE_DURATION_SCENARIOS = [
  { id: 'minutes-only', minutes: 25, expected: '25m' },
  { id: 'exact-hour', minutes: 60, expected: '1h' },
  { id: 'hours-minutes', minutes: 90, expected: '1h 30m' },
  { id: 'zero', minutes: 0, expected: '0m' },
] as const;

export const PROVIDER_TODAY_TIMELINE_SEGMENT_SCENARIOS = [
  {
    id: 'single-booking',
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Jane' },
      },
    ],
    expectedKinds: ['booking'],
    gapMinutes: [],
  },
  {
    id: 'two-bookings-with-gap',
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Jane' },
      },
      {
        id: 'b2',
        startTime: '2026-06-09T11:30:00.000Z',
        endTime: '2026-06-09T12:30:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alex' },
      },
    ],
    expectedKinds: ['booking', 'gap', 'booking'],
    gapMinutes: [30],
  },
  {
    id: 'skips-cancelled',
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.CANCELLED,
        customer: { name: 'Jane' },
      },
      {
        id: 'b2',
        startTime: '2026-06-09T12:00:00.000Z',
        endTime: '2026-06-09T13:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alex' },
      },
    ],
    expectedKinds: ['booking'],
    gapMinutes: [],
  },
] as const;

export const PROVIDER_TODAY_TIMELINE_NEXT_CLIENT_SCENARIOS = [
  {
    id: 'upcoming-confirmed',
    now: '2026-06-09T09:30:00.000Z',
    bookings: [
      {
        id: 'past',
        startTime: '2026-06-09T08:00:00.000Z',
        endTime: '2026-06-09T09:00:00.000Z',
        status: BookingStatus.COMPLETED,
        customer: { name: 'Done' },
      },
      {
        id: 'next',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Jane' },
      },
    ],
    expectedBookingId: 'next',
    expectedMinutes: 30,
  },
  {
    id: 'no-more-upcoming',
    now: '2026-06-09T18:00:00.000Z',
    bookings: [
      {
        id: 'done',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.COMPLETED,
        customer: { name: 'Jane' },
      },
    ],
    expectedBookingId: null,
    expectedMinutes: null,
  },
] as const;

export const PROVIDER_TODAY_TIMELINE_VIEW_SCENARIOS = [
  {
    id: 'disabled',
    enabled: false,
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Jane' },
      },
    ],
    expectEmpty: true,
  },
  {
    id: 'enabled-with-active',
    enabled: true,
    now: '2026-06-09T10:30:00.000Z',
    bookings: [
      {
        id: 'active',
        startTime: '2026-06-09T10:00:00.000Z',
        endTime: '2026-06-09T11:00:00.000Z',
        status: BookingStatus.IN_PROGRESS,
        customer: { name: 'Jane' },
      },
      {
        id: 'next',
        startTime: '2026-06-09T12:00:00.000Z',
        endTime: '2026-06-09T13:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alex' },
      },
    ],
    expectEmpty: false,
    activeBookingId: 'active',
    nextBookingId: 'next',
  },
] as const;
