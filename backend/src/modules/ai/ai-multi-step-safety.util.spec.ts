import { AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import { evaluateMultiStepBlastRadius } from './ai-blast-radius-cap.util.js';
import {
  assertMultiStepSafetyProbes,
  assessMultiStepDryRun,
  buildMultiStepBlastRadiusGate,
  isDestructiveMultiStepPlan,
  MULTI_STEP_SAFETY_PROBES,
  resolveMultiStepGraduatedAutoExecute,
} from './ai-multi-step-safety.util.js';

describe('ai-multi-step-safety (parity-3.6)', () => {
  it.each(MULTI_STEP_SAFETY_PROBES)(
    '$id — dry-run assessment',
    (probe) => {
      const dryRun = assessMultiStepDryRun({
        parentAction: probe.parentAction,
        subIntents: probe.steps,
        autoExecuteRequested: true,
      });
      expect(dryRun.required).toBe(probe.expectDryRun);
    },
  );

  it('evaluateMultiStepBlastRadius aggregates sub-intent booking counts', () => {
    const probe = MULTI_STEP_SAFETY_PROBES[0];
    const assessment = evaluateMultiStepBlastRadius({
      subIntents: probe.steps,
      mergedPlan: {
        id: 'plan-1',
        agentType: AgentType.CANCELLATION_RECOVERY,
        businessId: 'biz-1',
        intent: 'compound_intent',
        reasoning: 'test',
        steps: [
          {
            id: 's1',
            action: 'cancel_bookings',
            description: 'cancel',
            params: {
              bookingIds: Array.from({ length: 30 }, (_, i) => `bk-${i}`),
            },
            dependsOn: [],
          },
        ],
        constraints: [],
        riskAssessment: { level: 'high', factors: [] },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
    });
    expect(assessment.exceedsCap).toBe(true);
  });

  it('buildMultiStepBlastRadiusGate blocks over-cap multi-step plans', () => {
    const probe = MULTI_STEP_SAFETY_PROBES[0];
    const gate = buildMultiStepBlastRadiusGate({
      parentAction: probe.parentAction,
      prompt: 'cancel and hide',
      subIntents: probe.steps,
      mergedPlan: {
        id: 'plan-1',
        agentType: AgentType.CANCELLATION_RECOVERY,
        businessId: 'biz-1',
        intent: 'compound_intent',
        reasoning: 'test',
        steps: [],
        constraints: [],
        riskAssessment: { level: 'high', factors: [] },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
    });
    expect(gate?.details.multiStepBlastRadius).toBe(true);
    expect(gate?.details.requiresExecutionConfirmation).toBe(true);
  });

  it('resolveMultiStepGraduatedAutoExecute blocks propose-only sub-steps', () => {
    expect(
      resolveMultiStepGraduatedAutoExecute({
        parentAction: 'compound_intent',
        subIntents: MULTI_STEP_SAFETY_PROBES[1].steps,
        autoExecute: true,
      }),
    ).toBe(false);
  });

  it('resolveMultiStepGraduatedAutoExecute blocks destructive multi-step plans', () => {
    expect(
      resolveMultiStepGraduatedAutoExecute({
        parentAction: 'compound_intent',
        subIntents: MULTI_STEP_SAFETY_PROBES[2].steps,
        autoExecute: true,
      }),
    ).toBe(false);
  });

  it('flags destructive multi-step plans', () => {
    expect(isDestructiveMultiStepPlan(MULTI_STEP_SAFETY_PROBES[2].steps)).toBe(
      true,
    );
  });

  it('passes multi-step safety probe gate', () => {
    const status = assertMultiStepSafetyProbes();
    expect(status.complete).toBe(true);
  });
});
