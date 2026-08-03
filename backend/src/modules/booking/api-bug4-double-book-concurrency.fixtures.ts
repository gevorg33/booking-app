/**
 * api-bug.4 / e2e-bug.119 — concurrent public POST /bookings for the same
 * employee+startTime must not create overlapping confirmed rows. Slot capacity
 * is claimed under SELECT … FOR UPDATE inside the create transaction.
 */

export const API_BUG4_SOURCE_RULES = [
  {
    id: 'api4-source-claim-helper-present',
    mustContain: 'claimSlotsInWindowForUpdate',
  },
  {
    id: 'api4-source-pessimistic-write-on-slots',
    mustContain: ".setLock('pessimistic_write')",
  },
  {
    id: 'api4-source-full-capacity-conflict',
    mustContain: "throw new ConflictException('Time slot is already booked')",
  },
  {
    id: 'api4-source-create-calls-claim',
    mustContain: 'await this.claimSlotsInWindowForUpdate(',
  },
] as const;

export const API_BUG4_CONFLICT_MESSAGE_SCENARIOS = [
  {
    id: 'api4-msg-generic',
    input: {},
    expectIncludes: 'That time is already booked',
  },
  {
    id: 'api4-msg-employee-only',
    input: { employeeName: 'Gevorg' },
    expectIncludes: 'Gevorg is already booked',
  },
  {
    id: 'api4-msg-employee-time-customer',
    input: {
      employeeName: 'Gevorg',
      startTime: '2026-08-15T10:00:00.000Z',
      existingCustomerName: 'Pat',
    },
    expectIncludes: 'Gevorg already has an appointment',
  },
] as const;

export const API_BUG4_LIVE_SCENARIOS = [
  {
    id: 'api4-live-parallel-four-one-wins',
    description:
      '4 parallel POST /bookings same slot → exactly 1×2xx + 3×409; DB overlap count 1',
  },
  {
    id: 'api4-live-parallel-eight-one-wins',
    description:
      '8 parallel POST /bookings same slot → exactly 1×2xx; losers 409; no 500',
  },
  {
    id: 'api4-live-sequential-second-conflict',
    description: 'After a winner, sequential rebook of same slot returns 409',
  },
  {
    id: 'api4-live-two-distinct-slots-both-ok',
    description: '2 parallel POSTs on different free slots both succeed',
  },
  {
    id: 'api4-live-winner-removed-from-slots',
    description: 'Winning startTime no longer appears as an open public slot',
  },
  {
    id: 'api4-live-no-postgres-leak',
    description:
      'Conflict responses never leak QueryFailedError / FOR UPDATE / 22P02',
  },
  {
    id: 'api4-live-db-single-active-row',
    description:
      'For the raced startTime, exactly one non-cancelled booking row exists',
  },
] as const;

export type ApiBug4LiveScenario = (typeof API_BUG4_LIVE_SCENARIOS)[number];
