import type { AutoRollbackAttemptResult } from './ai-post-exec-auto-rollback.util.js';

export interface AutoRollbackSummaryScenario {
  id: string;
  assertionMessage: string;
  attempt: AutoRollbackAttemptResult;
  expectSummaryIncludes: string;
  expectRollbackOffered?: boolean;
}

export const AUTO_ROLLBACK_SUMMARY_SCENARIOS: AutoRollbackSummaryScenario[] = [
  {
    id: 'success-reverted',
    assertionMessage: 'Booking was created at 10:00, not the requested 09:00.',
    attempt: { attempted: true, succeeded: true },
    expectSummaryIncludes: 'automatically reverted',
    expectRollbackOffered: false,
  },
  {
    id: 'attempt-failed-offer-manual',
    assertionMessage: 'Booking was created for a different provider than requested.',
    attempt: {
      attempted: true,
      succeeded: false,
      error: 'Undo stopped after partial reversal',
    },
    expectSummaryIncludes: 'Automatic revert failed',
    expectRollbackOffered: true,
  },
  {
    id: 'not-undoable-offer-manual',
    assertionMessage: 'No bookings were cancelled.',
    attempt: {
      attempted: false,
      succeeded: false,
      reason: 'Undo is not supported for: update_bookings',
    },
    expectSummaryIncludes: 'You can undo this change',
    expectRollbackOffered: true,
  },
  {
    id: 'no-workflow-log',
    assertionMessage: 'Booking was not marked paid.',
    attempt: {
      attempted: false,
      succeeded: false,
      reason: 'No workflow log found for automatic revert',
    },
    expectSummaryIncludes: 'You can undo this change',
    expectRollbackOffered: true,
  },
];
