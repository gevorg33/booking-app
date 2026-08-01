/**
 * api-bug.5 / e2e-bug.121 — concurrent cancel of the same booking must be
 * idempotent: all callers get success (or clean already-cancelled), final
 * status cancelled, no 500, and only the winner re-notifies.
 */

export const API_BUG5_SOURCE_RULES = [
  {
    id: 'api5-source-customer-already-cancelled-noop',
    file: 'public-customer-booking.service.ts',
    mustContain: 'api-bug.5 — already-cancelled is a clean no-op',
  },
  {
    id: 'api5-source-didCancel-skip-renotify',
    file: 'public-customer-booking.service.ts',
    mustContain: 'if (didCancel)',
  },
  {
    id: 'api5-source-booking-cancel-didCancel',
    file: '../booking/booking.service.ts',
    mustContain: 'didCancel: false',
  },
  {
    id: 'api5-source-pessimistic-write-cancel',
    file: '../booking/booking.service.ts',
    mustContain: "lock: { mode: 'pessimistic_write' }",
  },
] as const;

export const API_BUG5_UNIT_SCENARIOS = [
  {
    id: 'api5-unit-already-cancelled-skips-bookingService-cancel',
    description:
      'cancelBookingWithToken on CANCELLED booking does not call bookingService.cancel or notify',
  },
  {
    id: 'api5-unit-didCancel-false-skips-notify',
    description:
      'When bookingService.cancel returns didCancel:false, notifications are skipped',
  },
  {
    id: 'api5-unit-notification-unique-23505-noop',
    description:
      'notification_logs unique violation (23505) is swallowed, not a 500',
  },
] as const;

export const API_BUG5_LIVE_SCENARIOS = [
  {
    id: 'api5-live-manage-parallel-three',
    description:
      '3× parallel POST manage/cancel → all 2xx; DB status cancelled; no 500',
  },
  {
    id: 'api5-live-manage-parallel-eight',
    description: '8× parallel manage/cancel → all 2xx; single cancelled row',
  },
  {
    id: 'api5-live-me-parallel-three',
    description:
      '3× parallel POST me/bookings/:id/cancel with customer JWT → all 2xx',
  },
  {
    id: 'api5-live-sequential-recancel',
    description: 'After cancel, sequential manage cancel is still 2xx idempotent',
  },
  {
    id: 'api5-live-mixed-manage-and-me',
    description:
      'Parallel manage/cancel + me/cancel on same booking → both 2xx; cancelled',
  },
  {
    id: 'api5-live-bad-token-parallel',
    description:
      '3× parallel manage/cancel with garbage token → all 403; booking stays confirmed',
  },
  {
    id: 'api5-live-no-postgres-leak',
    description: 'Cancel responses never leak QueryFailedError / FOR UPDATE / 23505',
  },
] as const;

export type ApiBug5LiveScenario = (typeof API_BUG5_LIVE_SCENARIOS)[number];
