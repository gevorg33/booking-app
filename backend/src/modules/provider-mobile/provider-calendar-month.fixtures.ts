/** prov-exp-10.2 — provider calendar month utilization band scenarios. */

import type { ProviderMyStatsBookingLike } from './provider-my-stats.util.js';
import type { ProviderMyStatsPeriodLike } from './provider-my-stats.util.js';

export const PROVIDER_CALENDAR_MONTH_BAND_SCENARIOS = [
  {
    id: 'empty-day',
    dateKey: '2026-06-09',
    bookings: [] as ProviderMyStatsBookingLike[],
    periods: [] as ProviderMyStatsPeriodLike[],
    employeeCount: 1,
    expectedBand: 'empty' as const,
    expectedCount: 0,
  },
  {
    id: 'low-utilization',
    dateKey: '2026-06-10',
    bookings: [
      {
        status: 'confirmed',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-10T10:00:00.000Z'),
        endTime: new Date('2026-06-10T11:00:00.000Z'),
      },
    ],
    periods: [
      {
        type: 'service_block',
        startTime: new Date('2026-06-10T09:00:00.000Z'),
        endTime: new Date('2026-06-10T17:00:00.000Z'),
      },
    ],
    employeeCount: 1,
    expectedBand: 'low' as const,
    expectedCount: 1,
  },
  {
    id: 'medium-utilization',
    dateKey: '2026-06-12',
    bookings: [
      {
        status: 'confirmed',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-12T10:00:00.000Z'),
        endTime: new Date('2026-06-12T14:00:00.000Z'),
      },
    ],
    periods: [
      {
        type: 'service_block',
        startTime: new Date('2026-06-12T09:00:00.000Z'),
        endTime: new Date('2026-06-12T17:00:00.000Z'),
      },
    ],
    employeeCount: 1,
    expectedBand: 'medium' as const,
    expectedCount: 1,
  },
  {
    dateKey: '2026-06-11',
    bookings: [
      {
        status: 'confirmed',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-11T09:00:00.000Z'),
        endTime: new Date('2026-06-11T13:00:00.000Z'),
      },
      {
        status: 'confirmed',
        paymentStatus: 'pending',
        startTime: new Date('2026-06-11T14:00:00.000Z'),
        endTime: new Date('2026-06-11T17:00:00.000Z'),
      },
    ],
    periods: [
      {
        type: 'service_block',
        startTime: new Date('2026-06-11T09:00:00.000Z'),
        endTime: new Date('2026-06-11T17:00:00.000Z'),
      },
    ],
    employeeCount: 1,
    expectedBand: 'high' as const,
    expectedCount: 2,
  },
] as const;

export const PROVIDER_CALENDAR_MONTH_VIEW_SCENARIO = {
  monthKey: '2026-06-01',
  viewMode: 'provider' as const,
  employeeCount: 1,
  bookings: [
    {
      status: 'confirmed',
      paymentStatus: 'pending',
      startTime: new Date('2026-06-09T10:00:00.000Z'),
      endTime: new Date('2026-06-09T11:00:00.000Z'),
    },
  ],
  periods: [],
  expectedDays: 30,
};
