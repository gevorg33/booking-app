import {
  N99_NO_CLARIFY_AUTOFILL_SCENARIOS,
  N99_NO_CLARIFY_GATE_SCENARIOS,
  N99_NO_CLARIFY_GUARDRAIL_SCENARIOS,
  N99_NO_CLARIFY_OVER_ASK_SCENARIOS,
  N99_NO_CLARIFY_WATCHDOG_SCENARIOS,
} from './ai-n99-no-clarify-completion.fixtures.js';
import {
  applyHighConfidenceAutofill,
  buildNoClarifyNear99ExitGate,
  computeAutoFillFieldThresholdAdjustment,
  enrichParamsForNoClarifyCompletion,
  shouldBlockNoClarifyAutofill,
  trimNeedlessClarifyIssues,
} from './ai-n99-no-clarify-completion.util.js';

describe('ai-n99-no-clarify-completion.util (n99-2)', () => {
  it.each(N99_NO_CLARIFY_AUTOFILL_SCENARIOS)(
    '$id high-confidence autofill',
    (scenario) => {
      const enriched = enrichParamsForNoClarifyCompletion({
        prompt: scenario.prompt,
        action: scenario.action,
        params: { ...scenario.params },
        surface: 'dashboard',
        sessionContext: 'sessionContext' in scenario ? scenario.sessionContext : undefined,
        screenContext: 'screenContext' in scenario ? scenario.screenContext : undefined,
        entityMemory: 'entityMemory' in scenario ? scenario.entityMemory : undefined,
      });
      expect(enriched.blocked).toBe(false);
      for (const [key, value] of Object.entries(scenario.expectFilled)) {
        expect(enriched.params[key]).toEqual(value);
      }
    },
  );

  it.each(N99_NO_CLARIFY_GUARDRAIL_SCENARIOS)(
    '$id guardrail blocks risky autofill',
    (scenario) => {
      const block = shouldBlockNoClarifyAutofill({
        action: scenario.action,
        actionConfidence: scenario.actionConfidence,
        params: scenario.params,
      });
      expect(block.blocked).toBe(scenario.expectBlocked);
      if (scenario.expectBlockReason) {
        expect(block.reason).toBe(scenario.expectBlockReason);
      }
    },
  );

  it.each(N99_NO_CLARIFY_OVER_ASK_SCENARIOS)(
    '$id trims needless clarify issues',
    (scenario) => {
      const trimmed = trimNeedlessClarifyIssues({
        action: scenario.action,
        params: scenario.params,
        prompt: scenario.prompt,
        screenContext: scenario.screenContext,
        sessionContext: scenario.sessionContext,
        issues: scenario.issues.map((issue) => ({
          field: issue.field,
          message: issue.message,
          example: '',
        })),
      });
      for (const field of scenario.expectTrimmedFields) {
        expect(trimmed.some((issue) => issue.field === field)).toBe(false);
      }
    },
  );

  it.each(N99_NO_CLARIFY_WATCHDOG_SCENARIOS)(
    '$id auto-fill watchdog threshold',
    (scenario) => {
      const adjustment = computeAutoFillFieldThresholdAdjustment(scenario);
      expect(adjustment.adjustedThreshold).toBe(scenario.expectAdjustedThreshold);
    },
  );

  it.each(N99_NO_CLARIFY_GATE_SCENARIOS)('$id near-99 exit gate', (scenario) => {
    const gate = buildNoClarifyNear99ExitGate(scenario.input, 30);
    expect(gate.met).toBe(scenario.expectMet);
  });

  it('applyHighConfidenceAutofill uses last provider from session', () => {
    const result = applyHighConfidenceAutofill({
      prompt: 'book massage tomorrow 10',
      action: 'create_booking',
      params: { serviceName: 'Massage', date: '2026-06-09', timeSlot: '10:00' },
      sessionContext: { lastEmployeeName: 'Anna Smith' },
      actionConfidence: 0.9,
    });
    expect(result.params.employeeName).toBe('Anna Smith');
  });
});
