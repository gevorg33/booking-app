/**
 * e2e-bug.255 — concurrent provider ready_now / running_late must serialize
 * under row lock (e2e-bug.74 sibling). Same e2e-bug.184 residual: lock query
 * must not LEFT JOIN nullable relations.
 */

export const E2E255_LOCK_SOURCE_RULES = [
  {
    id: 'uses-pessimistic-write',
    mustContain: "lock: { mode: 'pessimistic_write' }",
  },
  {
    id: 'no-left-join-and-select-with-lock',
    mustNotContain: 'leftJoinAndSelect',
  },
  {
    id: 'no-query-builder-set-lock',
    mustNotContain: ".setLock('pessimistic_write')",
  },
  {
    id: 'idempotent-already-set',
    mustContain: 'alreadySet',
  },
] as const;

export const E2E255_UNIT_CASES = [
  {
    id: 'claim-ready-now-under-lock',
    description: 'claimProviderVisitStatus sets ready_now under FOR UPDATE',
  },
  {
    id: 'claim-same-kind-idempotent',
    description: 'Same ready_now claim returns alreadySet without save',
  },
  {
    id: 'claim-late-minutes-change-updates',
    description: 'running_late with different minutes is not idempotent',
  },
  {
    id: 'concurrent-serialize-single-writer',
    description: 'Concurrent claims serialize; only one non-idempotent write',
  },
  {
    id: 'not-checked-in-rejected',
    description: 'Claim before check-in is not_allowed (e2e-bug.70)',
  },
] as const;

export const E2E255_LIVE_CASES = [
  {
    id: 'first-ready-now-succeeds',
    description: 'First POST .../ready-now on checked-in booking returns 2xx',
  },
  {
    id: 'sequential-same-ready-idempotent',
    description:
      'Second sequential ready-now succeeds; only the first response carries notifications',
  },
  {
    id: 'concurrent-five-ready-only-one-notifies',
    description:
      '5 concurrent ready-now → all 2xx (idempotent) but customer notify at most once',
  },
  {
    id: 'first-running-late-succeeds',
    description: 'First POST .../running-late returns 2xx with minutesLate',
  },
  {
    id: 'sequential-late-minutes-change-renotifies',
    description:
      'running_late 10m then 15m both enter notify path (not same-claim idempotent)',
  },
  {
    id: 'ready-after-late-clears-and-notifies',
    description: 'ready_now after running_late updates kind and may notify',
  },
  {
    id: 'concurrent-five-late-same-minutes-one-notify',
    description:
      '5 concurrent running-late with same minutes → all 2xx, notify at most once',
  },
  {
    id: 'no-for-update-outer-join-500',
    description:
      'Visit-status never returns Postgres FOR UPDATE / nullable side of outer join error',
  },
  {
    id: 'not-checked-in-rejected',
    description: 'ready-now before check-in returns 400',
  },
  {
    id: 'cancelled-booking-rejected',
    description: 'running-late on cancelled booking returns 400',
  },
  {
    id: 'completed-booking-rejected',
    description: 'ready-now on completed booking returns 400',
  },
] as const;
