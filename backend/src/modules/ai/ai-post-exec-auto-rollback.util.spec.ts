import {
  buildAutoRollbackDetailsPatch,
  buildAutoRollbackUserSummary,
  buildPostExecFailureSummaryWithAutoRollback,
  extractAutoRollbackDetails,
  mergeAutoRollbackIntoResult,
  shouldAttemptAutoRollback,
} from './ai-post-exec-auto-rollback.util.js';
import { AUTO_ROLLBACK_SUMMARY_SCENARIOS } from './ai-post-exec-auto-rollback.fixtures.js';

describe('ai-post-exec-auto-rollback.util (acc-5.5)', () => {
  it.each(AUTO_ROLLBACK_SUMMARY_SCENARIOS)(
    '$id buildAutoRollbackUserSummary',
    (scenario) => {
      const summary = buildAutoRollbackUserSummary(
        { message: scenario.assertionMessage },
        scenario.attempt,
      );
      expect(summary.toLowerCase()).toContain(
        scenario.expectSummaryIncludes.toLowerCase(),
      );
      if (scenario.expectRollbackOffered === false) {
        expect(
          buildAutoRollbackDetailsPatch(scenario.attempt).rollbackOffered,
        ).toBe(false);
      }
    },
  );

  it('shouldAttemptAutoRollback requires undo task id', () => {
    expect(shouldAttemptAutoRollback('task-1')).toBe(true);
    expect(shouldAttemptAutoRollback(undefined)).toBe(false);
  });

  it('mergeAutoRollbackIntoResult marks undone on success', () => {
    const merged = mergeAutoRollbackIntoResult(
      { postExecAssertionFailed: true },
      { attempted: true, succeeded: true },
    );
    expect(merged.autoRollbackSucceeded).toBe(true);
    expect(merged.undone).toBe(true);
  });

  it('extractAutoRollbackDetails returns rollback fields only', () => {
    const details = extractAutoRollbackDetails({
      autoRollbackAttempted: true,
      autoRollbackSucceeded: false,
      autoRollbackError: 'boom',
      bookingId: 'bk-1',
    });
    expect(details.autoRollbackError).toBe('boom');
    expect((details as any).bookingId).toBeUndefined();
  });

  it('buildPostExecFailureSummaryWithAutoRollback prefers assertion message', () => {
    const summary = buildPostExecFailureSummaryWithAutoRollback({
      error: 'ignored',
      result: {
        assertionMessage: 'Wrong provider.',
        autoRollbackSucceeded: true,
      },
    });
    expect(summary).toContain('Wrong provider.');
    expect(summary).toContain('automatically reverted');
  });
});
