/** prov-exp-4.3 — team who's next queue scenarios. */

import { BookingStatus } from '../booking/entities/booking.entity.js';

export const TEAM_WHOS_NEXT_WINDOW_SCENARIOS = [
  {
    id: 'upcoming-in-window',
    now: '2026-06-09T10:00:00.000Z',
    booking: {
      startTime: '2026-06-09T10:30:00.000Z',
      endTime: '2026-06-09T11:30:00.000Z',
      status: BookingStatus.CONFIRMED,
    },
    expected: true,
  },
  {
    id: 'in-progress-started-before-now',
    now: '2026-06-09T10:30:00.000Z',
    booking: {
      startTime: '2026-06-09T10:00:00.000Z',
      endTime: '2026-06-09T11:00:00.000Z',
      status: BookingStatus.IN_PROGRESS,
    },
    expected: true,
  },
  {
    id: 'completed-excluded',
    now: '2026-06-09T10:00:00.000Z',
    booking: {
      startTime: '2026-06-09T10:15:00.000Z',
      endTime: '2026-06-09T11:00:00.000Z',
      status: BookingStatus.COMPLETED,
    },
    expected: false,
  },
  {
    id: 'after-window-excluded',
    now: '2026-06-09T10:00:00.000Z',
    booking: {
      startTime: '2026-06-09T13:00:00.000Z',
      endTime: '2026-06-09T14:00:00.000Z',
      status: BookingStatus.CONFIRMED,
    },
    expected: false,
  },
  {
    id: 'ended-before-now-excluded',
    now: '2026-06-09T12:00:00.000Z',
    booking: {
      startTime: '2026-06-09T10:00:00.000Z',
      endTime: '2026-06-09T11:00:00.000Z',
      status: BookingStatus.CONFIRMED,
    },
    expected: false,
  },
] as const;

export const TEAM_WHOS_NEXT_COLUMN_SCENARIOS = [
  {
    id: 'orders-by-provider-and-marks-next',
    now: '2026-06-09T10:00:00.000Z',
    bookings: [
      {
        id: 'b1',
        startTime: '2026-06-09T10:30:00.000Z',
        endTime: '2026-06-09T11:30:00.000Z',
        status: BookingStatus.CONFIRMED,
        employee: { id: 'emp-1', name: 'Alex' },
      },
      {
        id: 'b2',
        startTime: '2026-06-09T11:00:00.000Z',
        endTime: '2026-06-09T12:00:00.000Z',
        status: BookingStatus.CONFIRMED,
        employee: { id: 'emp-2', name: 'Zara' },
      },
      {
        id: 'b3',
        startTime: '2026-06-09T11:30:00.000Z',
        endTime: '2026-06-09T12:30:00.000Z',
        status: BookingStatus.CONFIRMED,
        employee: { id: 'emp-1', name: 'Alex' },
      },
    ],
    expectedColumnIds: ['emp-1', 'emp-2'],
    expectedNextBookingIds: ['b1', 'b2'],
    expectedQueueLengths: [2, 1],
  },
] as const;

export const TEAM_WHOS_NEXT_PROMPT_SCENARIOS = [
  {
    id: 'across-team',
    prompt: "Who's next across the team in the next 2 hours?",
    expected: true,
  },
  {
    id: 'all-providers',
    prompt: 'Show who is next for all providers',
    expected: true,
  },
  {
    id: 'own-schedule',
    prompt: "Who's next on my schedule today?",
    expected: false,
  },
] as const;

export const SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS = [
  {
    id: 'across-team',
    prompt: "Who's next across the team in the next 2 hours?",
    surface: 'provider' as const,
    expectedAction: 'team_whos_next' as const,
  },
  {
    id: 'all-providers',
    prompt: 'Show who is next for all providers',
    surface: 'provider' as const,
    expectedAction: 'team_whos_next' as const,
  },
] as const;
