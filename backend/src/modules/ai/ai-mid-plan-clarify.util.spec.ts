import {
  assertMidPlanClarifyProbes,
  buildMidPlanClarifyState,
  isMidPlanClarifyResumeTurn,
  mergeMidPlanClarifyResume,
  MID_PLAN_CLARIFY_PROBE_SCENARIOS,
  wrapCompoundStepClarifyForMidPlan,
} from './ai-mid-plan-clarify.util.js';

describe('ai-mid-plan-clarify (parity-3.3)', () => {
  it.each(MID_PLAN_CLARIFY_PROBE_SCENARIOS)(
    '$id — merges clarify answer without losing earlier steps',
    (probe) => {
      const state = buildMidPlanClarifyState({
        parentAction: probe.parentAction,
        originalPrompt: probe.originalPrompt,
        steps: probe.steps,
        currentStepIndex: probe.pauseStepIndex,
        sessionContext: {
          _clarifyContext: {
            originalPrompt: probe.originalPrompt,
            originalAction: probe.steps[probe.pauseStepIndex].action,
            partialParams: probe.steps[probe.pauseStepIndex].params,
            clarifyRound: 0,
            clarifyKind: 'mid_plan_targeted_slots',
          },
        },
      });

      const wrapped = wrapCompoundStepClarifyForMidPlan(
        {
          success: false,
          action: probe.steps[probe.pauseStepIndex].action,
          summary: 'Need template',
          details: { clarify: true, needsClarification: true },
        },
        {
          parentAction: probe.parentAction,
          originalPrompt: probe.originalPrompt,
          steps: probe.steps,
          currentStepIndex: probe.pauseStepIndex,
        },
      );

      expect(wrapped.details.midPlanClarify).toBe(true);
      expect(wrapped.details.preservedStepActions).toHaveLength(
        probe.steps.length,
      );

      const resume = mergeMidPlanClarifyResume({
        state,
        followUpPrompt: probe.followUpPrompt,
        sessionContext: {
          _clarifyMemory: probe.followUpMemory,
          _clarifyContext: wrapped.details.clarifyContext as Record<
            string,
            unknown
          >,
        },
      });

      expect(
        resume.steps[probe.pauseStepIndex].params[probe.expectMergedField],
      ).toBe(probe.expectMergedValue);
      expect(
        resume.steps[probe.expectPreservedStepIndex].params[
          probe.expectPreservedField
        ],
      ).toEqual(probe.expectPreservedValue);
    },
  );

  it('detects mid-plan resume turns from session', () => {
    const session = {
      _midPlanClarify: buildMidPlanClarifyState({
        parentAction: 'goal_execution',
        originalPrompt: 'Set up stylist',
        steps: MID_PLAN_CLARIFY_PROBE_SCENARIOS[0].steps,
        currentStepIndex: 1,
      }),
      _clarifyContext: {
        originalPrompt: 'Set up stylist',
        originalAction: 'apply_schedule',
        partialParams: { employeeName: 'Anna' },
        clarifyRound: 1,
        clarifyKind: 'mid_plan_targeted_slots',
      },
    };
    expect(isMidPlanClarifyResumeTurn(session)).toBe(true);
  });

  it('passes mid-plan clarify probe gate', () => {
    const status = assertMidPlanClarifyProbes();
    expect(status.complete).toBe(true);
  });
});
