/**
 * e2e-bug.165 — dashboard/staff BookingService.cancel must refund paid-online
 * bookings and serialize concurrent cancels (no silent lost-update).
 */

export type E2E165UnitCase = {
  id: string;
  description: string;
};

export const E2E165_UNIT_EDGE_CASES: readonly E2E165UnitCase[] = [
  {
    id: 'refund-paid-online',
    description:
      'Dashboard cancel of paid-online booking calls BookingRefundService',
  },
  {
    id: 'keep-paid-until-refund',
    description:
      'paymentStatus stays PAID until refund lands (not wiped to not_applicable)',
  },
  {
    id: 'skip-refund-unpaid',
    description: 'Unpaid/cash cancel sets not_applicable and skips Stripe',
  },
  {
    id: 'lock-without-relations',
    description:
      'pessimistic_write lock must not load nullable relations (e2e-bug.184)',
  },
  {
    id: 'version-conflict',
    description: 'stale expectedUpdatedAt throws BOOKING_VERSION_CONFLICT',
  },
  {
    id: 'idempotent-already-cancelled',
    description:
      'second cancel under lock does not overwrite reason / re-publish',
  },
  {
    id: 'legacy-cancelled-missing-refund',
    description:
      'already cancelled but missing stripeRefundId still attempts refund',
  },
  {
    id: 'idempotency-key-by-pi',
    description:
      'Stripe refund idempotencyKey is booking-refund-pi-{paymentIntentId}',
  },
] as const;

export const E2E165_LIVE_SCENARIOS = [
  {
    id: 'concurrent-dashboard-vs-guest',
    description:
      'Parallel dashboard PUT cancel + guest manage cancel → both 2xx; final row cancelled; reason preserved from first writer',
  },
  {
    id: 'stale-expectedUpdatedAt',
    description:
      'Dashboard cancel with stale expectedUpdatedAt → 409 BOOKING_VERSION_CONFLICT',
  },
  {
    id: 'fresh-expectedUpdatedAt',
    description:
      'Dashboard cancel with matching expectedUpdatedAt → 200 cancelled',
  },
  {
    id: 'second-cancel-idempotent',
    description:
      'Second dashboard cancel after success preserves first reason',
  },
  {
    id: 'paid-dashboard-refund',
    description:
      'Dashboard cancel of paid booking with Stripe test PI → refunded, not not_applicable wipe',
  },
] as const;
