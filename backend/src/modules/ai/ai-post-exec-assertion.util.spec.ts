import {
  applyPostExecAssertionToCommandResult,
  assertPostExecutionIntent,
  buildPostExecRollbackDetails,
  extractExecutionPayload,
  shouldRunPostExecAssertion,
} from './ai-post-exec-assertion.util.js';
import { POST_EXEC_ASSERTION_SCENARIOS } from './ai-post-exec-assertion.fixtures.js';

describe('ai-post-exec-assertion.util (acc-5.4)', () => {
  it.each(POST_EXEC_ASSERTION_SCENARIOS)('$id assertPostExecutionIntent', (scenario) => {
    const result = assertPostExecutionIntent(
      scenario.action,
      scenario.params,
      scenario.executionResult,
    );
    expect(result.ok).toBe(scenario.expectOk);
    if (scenario.expectMessageIncludes) {
      expect(result.message?.toLowerCase()).toContain(
        scenario.expectMessageIncludes.toLowerCase(),
      );
    }
  });

  it('extractExecutionPayload merges completed workflow step results', () => {
    const payload = extractExecutionPayload({
      steps: [
        {
          stepId: 's1',
          status: 'completed',
          result: { bookingId: 'bk-1', employeeId: 'e1' },
        },
      ],
    });
    expect(payload.bookingId).toBe('bk-1');
    expect(payload.employeeId).toBe('e1');
  });

  it('buildPostExecRollbackDetails offers undo when task id is present', () => {
    const details = buildPostExecRollbackDetails('task-1', {
      ok: false,
      message: 'Mismatch',
    });
    expect(details.postExecAssertionFailed).toBe(true);
    expect(details.rollbackOffered).toBe(true);
    expect(details.undoTaskId).toBe('task-1');
  });

  it('applyPostExecAssertionToCommandResult flags successful but mismatched execution', () => {
    const flagged = applyPostExecAssertionToCommandResult(
      'create_booking',
      { employeeId: 'e1' },
      {
        success: true,
        action: 'create_booking',
        summary: 'Booked',
        details: { taskId: 'task-9', employeeId: 'e2', bookingId: 'bk-1' },
      },
    );
    expect(flagged.success).toBe(false);
    expect(flagged.details?.postExecAssertionFailed).toBe(true);
    expect(flagged.details?.undoTaskId).toBe('task-9');
  });

  it('shouldRunPostExecAssertion skips read-only actions', () => {
    expect(shouldRunPostExecAssertion('create_booking')).toBe(true);
    expect(shouldRunPostExecAssertion('list_appointments')).toBe(false);
  });
});
