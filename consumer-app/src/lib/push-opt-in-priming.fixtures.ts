export const PUSH_PRIMING_SCENARIOS = [
  {
    id: 'before-first-booking',
    completedBookingCount: 0,
    primingShown: false,
    expected: false,
  },
  {
    id: 'after-first-booking',
    completedBookingCount: 1,
    primingShown: false,
    expected: true,
  },
  {
    id: 'after-second-booking',
    completedBookingCount: 2,
    primingShown: false,
    expected: false,
  },
  {
    id: 'already-shown',
    completedBookingCount: 1,
    primingShown: true,
    expected: false,
  },
] as const;

export const PUSH_PRIMING_OPT_IN_SCENARIOS = [
  {
    id: 'all-accept',
    shown: 5,
    accepted: 4,
    declined: 1,
    expectedRate: 0.8,
  },
  {
    id: 'below-target',
    shown: 10,
    accepted: 7,
    declined: 3,
    expectedRate: 0.7,
  },
  {
    id: 'no-shown',
    shown: 0,
    accepted: 0,
    declined: 0,
    expectedRate: null,
  },
] as const;
