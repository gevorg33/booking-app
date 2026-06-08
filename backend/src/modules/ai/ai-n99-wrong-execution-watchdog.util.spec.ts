import {
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS,
} from './ai-n99-wrong-execution-watchdog.fixtures.js';
import {
  attachAutofillExecutionMetadata,
  computeAutoFillFieldThresholdAdjustment,
  computeAutoFillWatchdogFromRows,
  evaluateAutofillPreviewScenario,
  evaluateAutofillWatchdogScenario,
  finalizeAutofillWatchdogResult,
  mergeAutofillWatchdogIntoSession,
  readAutofillFields,
  resolveAutofillWatchdogThreshold,
  shouldOfferOneTapUndoForAutofill,
} from './ai-n99-wrong-execution-watchdog.util.js';

describe('ai-n99-wrong-execution-watchdog.util (n99-2.7)', () => {
  it.each(N99_AUTOFILL_WATCHDOG_SCENARIOS)(
    '$id auto-fill watchdog threshold',
    (scenario) => {
      const result = evaluateAutofillWatchdogScenario(scenario);
      expect(result.passed).toBe(true);
      const adjustment = computeAutoFillFieldThresholdAdjustment(scenario);
      expect(adjustment.adjustedThreshold).toBe(scenario.expectAdjustedThreshold);
    },
  );

  it.each(N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS)(
    '$id trace-row watchdog threshold',
    (scenario) => {
      const adjustment = computeAutoFillWatchdogFromRows(
        scenario.rows,
        scenario.baseThreshold,
      );
      expect(adjustment.adjustedThreshold).toBe(scenario.expectAdjustedThreshold);
    },
  );

  it.each(N99_AUTOFILL_PREVIEW_SCENARIOS)('$id autofill preview metadata', (scenario) => {
    const result = evaluateAutofillPreviewScenario(scenario);
    expect(result.passed).toBe(true);
  });

  it('readAutofillFields reads _noClarifyAutofill', () => {
    expect(
      readAutofillFields({ _noClarifyAutofill: ['employeeName', 'serviceName'] }),
    ).toEqual(['employeeName', 'serviceName']);
  });

  it('resolveAutofillWatchdogThreshold prefers session threshold', () => {
    const resolved = resolveAutofillWatchdogThreshold({
      sessionContext: {
        _autoFillFieldThreshold: 0.8,
        _autoFillWatchdogReason: 'auto_fill_undo_rate_elevated',
        _autoFillWatchdogUndoRate: 0.03,
      },
    });
    expect(resolved.fieldThreshold).toBe(0.8);
    expect(resolved.reason).toBe('auto_fill_undo_rate_elevated');
  });

  it('mergeAutofillWatchdogIntoSession writes session keys', () => {
    const session: Record<string, unknown> = {};
    mergeAutofillWatchdogIntoSession(
      session,
      Array.from({ length: 12 }, (_, index) => ({
        traceId: `t-${index}`,
        outcome: 'executed' as const,
        autofillFields: ['employeeName'],
        failureSignal: index === 0 ? ('wrong_execution' as const) : undefined,
      })),
    );
    expect(typeof session._autoFillFieldThreshold).toBe('number');
    expect(session._autoFillWatchdogReason).toBeDefined();
  });

  it('shouldOfferOneTapUndoForAutofill requires taskId', () => {
    expect(
      shouldOfferOneTapUndoForAutofill(
        { _noClarifyAutofill: ['employeeName'] },
        { success: true, details: { taskId: 'task-1' } },
      ),
    ).toBe(true);
    expect(
      shouldOfferOneTapUndoForAutofill(
        { _noClarifyAutofill: ['employeeName'] },
        { success: true, details: {} },
      ),
    ).toBe(false);
  });

  it('attachAutofillExecutionMetadata skips non-autofill executions', () => {
    const result = attachAutofillExecutionMetadata(
      { success: true, action: 'show_appointments', summary: 'ok' },
      { date: '2026-06-09' },
    );
    expect(result.details?.autofillPreview).toBeUndefined();
  });

  it('finalizeAutofillWatchdogResult flags post-exec mismatch on autofill booking', () => {
    const finalized = finalizeAutofillWatchdogResult(
      'create_booking',
      {
        employeeId: 'e1',
        serviceId: 's1',
        date: '2026-06-09',
        timeSlot: '10:00',
        _noClarifyAutofill: ['employeeName'],
      },
      {
        success: true,
        action: 'create_booking',
        summary: 'Booked',
        details: { taskId: 'task-1' },
      },
    );
    expect(finalized.success).toBe(false);
    expect(finalized.details?.postExecAssertionFailed).toBe(true);
    expect(finalized.details?.autofillPreview).toBeDefined();
    expect(finalized.details?.oneTapUndo).toBe(true);
  });
});
