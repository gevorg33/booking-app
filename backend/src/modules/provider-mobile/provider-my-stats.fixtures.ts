/** prov-exp-2.1 — provider mobile personal stats scenarios. */

export const PROVIDER_MY_STATS_PERIOD_SCENARIOS = [
  { id: 'week-monday-start', period: 'week' as const, todayKey: '2026-06-09', start: '2026-06-08', end: '2026-06-14' },
  { id: 'week-sunday-today', period: 'week' as const, todayKey: '2026-06-14', start: '2026-06-08', end: '2026-06-14' },
  { id: 'month-mid', period: 'month' as const, todayKey: '2026-06-15', start: '2026-06-01', end: '2026-06-30' },
  { id: 'month-end', period: 'month' as const, todayKey: '2026-06-30', start: '2026-06-01', end: '2026-06-30' },
] as const;

export const PROVIDER_MY_STATS_UTILIZATION_SCENARIOS = [
  {
    id: 'booked-vs-scheduled',
    bookedMinutes: 240,
    scheduledMinutes: 480,
    expectedPercent: 50,
  },
  {
    id: 'over-booked-capped',
    bookedMinutes: 600,
    scheduledMinutes: 480,
    expectedPercent: 100,
  },
  {
    id: 'no-schedule',
    bookedMinutes: 120,
    scheduledMinutes: 0,
    expectedPercent: 0,
  },
] as const;

export const PROVIDER_MY_STATS_TIPS_SCENARIOS = [
  {
    id: 'tips-from-payment-metadata',
    bookings: [
      {
        status: 'completed',
        paymentStatus: 'paid',
        metadata: { payment: { tipAmount: 10 } },
      },
      {
        status: 'completed',
        paymentStatus: 'paid',
        metadata: { pricing: { tipAmount: 5 } },
      },
      {
        status: 'completed',
        paymentStatus: 'paid',
        metadata: { payment: { tipAmount: 0 } },
      },
      {
        status: 'confirmed',
        paymentStatus: 'unpaid',
        metadata: { payment: { tipAmount: 20 } },
      },
    ],
    expectedTotal: 15,
    expectedCount: 2,
  },
  {
    id: 'tips-none',
    bookings: [
      {
        status: 'completed',
        paymentStatus: 'paid',
        metadata: null,
      },
    ],
    expectedTotal: 0,
    expectedCount: 0,
  },
] as const;
