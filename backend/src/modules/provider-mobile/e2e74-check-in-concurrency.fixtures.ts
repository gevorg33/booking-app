/**
 * e2e-bug.74 — concurrent provider check-in must serialize under row lock.
 * Residual (same class as e2e-bug.184): lock query must not LEFT JOIN nullable
 * relations or Postgres rejects `FOR UPDATE`.
 */

export const E2E74_LOCK_SOURCE_RULES = [
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
] as const;

export const E2E74_LIVE_CASES = [
  {
    id: 'first-check-in-succeeds',
    description:
      'First POST .../check-in returns 201 with checkedInAt + floorStatus checked_in',
  },
  {
    id: 'sequential-second-rejected',
    description:
      'Second sequential check-in returns 400 Client is already checked in',
  },
  {
    id: 'concurrent-five-only-one-succeeds',
    description:
      '5 truly concurrent check-ins → exactly one 2xx; others 400 already checked in (not 500 FOR UPDATE)',
  },
  {
    id: 'no-for-update-outer-join-500',
    description:
      'Check-in never returns Postgres FOR UPDATE / nullable side of outer join error',
  },
  {
    id: 'cancelled-booking-rejected',
    description: 'Check-in on cancelled booking returns 400 (not allowed)',
  },
] as const;
