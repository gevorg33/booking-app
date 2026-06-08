import {
  assertPostExecutionIntent,
  buildExecutionVerificationGate,
  buildPostExecRollbackDetails,
  evaluateBlastRadius,
  isIntentGraduatedForAutoExecute,
  isStaleExecutionPlan,
  needsMediumRiskPreview,
  requiresProposeOnlyExecution,
  verifyPlanMatchesPrompt,
  verifyResolutionConfidence,
} from './ai-execution-verification.util.js';
import {
  BLAST_RADIUS_SCENARIOS,
  PLAN_VERIFY_SCENARIOS,
  RESOLUTION_VERIFY_SCENARIOS,
} from './ai-execution-verification.fixtures.js';

describe('ai-execution-verification.util (acc-5)', () => {
  it.each(RESOLUTION_VERIFY_SCENARIOS)('$id resolution guard', (scenario) => {
    const result = verifyResolutionConfidence(scenario.resolved);
    expect(result.ok).toBe(scenario.expectOk);
    if (scenario.expectFields) {
      expect(result.issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining(scenario.expectFields),
      );
    }
  });

  it.each(BLAST_RADIUS_SCENARIOS)('$id blast radius', (scenario) => {
    const assessment = evaluateBlastRadius(scenario.action, scenario.params);
    expect(assessment.exceedsCap).toBe(scenario.expectExceeds);
  });

  it.each(PLAN_VERIFY_SCENARIOS)('$id plan-vs-prompt', (scenario) => {
    const result = verifyPlanMatchesPrompt(scenario.prompt, scenario.plan);
    expect(result.ok).toBe(scenario.expectOk);
  });

  it('needsMutationPreviewDiff for medium-risk create_booking', () => {
    expect(needsMediumRiskPreview('create_booking')).toBe(true);
    expect(needsMediumRiskPreview('create_booking', true)).toBe(false);
    expect(needsMediumRiskPreview('cancel_bookings')).toBe(false);
  });

  it('requiresProposeOnlyExecution until intent graduates', () => {
    expect(requiresProposeOnlyExecution('payment_sweep')).toBe(true);
    expect(
      isIntentGraduatedForAutoExecute('payment_sweep', {
        samples: 25,
        accurateRate: 0.9,
      }),
    ).toBe(true);
    expect(
      requiresProposeOnlyExecution('payment_sweep', {
        samples: 25,
        accurateRate: 0.9,
      }),
    ).toBe(false);
  });

  it('isStaleExecutionPlan rejects old plans', () => {
    const stale = new Date(Date.now() - 6 * 60 * 1000);
    expect(isStaleExecutionPlan(stale)).toBe(true);
    expect(isStaleExecutionPlan(new Date())).toBe(false);
  });

  it('assertPostExecutionIntent flags missing booking', () => {
    expect(
      assertPostExecutionIntent('create_booking', { employeeId: 'e1' }, {}),
    ).toEqual({
      ok: false,
      field: 'bookingId',
      message: 'Booking was not created at the requested time/provider.',
    });
  });

  it('buildPostExecRollbackDetails offers undo when task id exists', () => {
    const details = buildPostExecRollbackDetails('task-1', {
      ok: false,
      message: 'Mismatch',
    });
    expect(details.rollbackOffered).toBe(true);
    expect(details.undoTaskId).toBe('task-1');
  });

  it('buildExecutionVerificationGate returns plan-vs-prompt clarify when scope mismatches', () => {
    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-scope-too-broad',
    )!;
    const gate = buildExecutionVerificationGate({
      prompt: scenario.prompt,
      action: 'cancel_bookings',
      params: {},
      enrichedParams: {},
      plan: scenario.plan,
    });
    expect(gate?.details.clarifySource).toBe('plan_vs_prompt');
    expect(gate?.details.planVsPromptFailed).toBe(true);
  });

  it('buildExecutionVerificationGate rejects duplicate booking steps in one plan', () => {
    const gate = buildExecutionVerificationGate({
      prompt: 'book anna twice at 9',
      action: 'create_booking',
      params: {},
      enrichedParams: {},
      plan: {
        id: 'plan-dup',
        agentType: 'scheduling_optimization' as any,
        businessId: 'biz-1',
        intent: 'create_booking',
        reasoning: 'dup',
        constraints: [],
        riskAssessment: { level: 'low', factors: [] },
        status: 'validated' as any,
        createdAt: new Date(),
        steps: [
          {
            id: 's1',
            action: 'create_booking',
            description: 'a',
            params: {
              employeeId: 'e1',
              startTime: '2026-06-10T09:00:00.000Z',
            },
            dependsOn: [],
          },
          {
            id: 's2',
            action: 'create_booking',
            description: 'b',
            params: {
              employeeId: 'e1',
              startTime: '2026-06-10T09:00:00.000Z',
            },
            dependsOn: [],
          },
        ],
      },
    });
    expect(gate?.details.executeRevalidationFailed).toBe(true);
    expect(gate?.details.executeRevalidationIssues?.[0]?.kind).toBe(
      'duplicate_plan_mutation',
    );
  });

  it('buildExecutionVerificationGate returns blast-radius confirm when over cap', () => {
    const gate = buildExecutionVerificationGate({
      prompt: 'cancel all',
      action: 'cancel_bookings',
      params: {},
      enrichedParams: {
        bookingIds: Array.from({ length: 30 }, (_, index) => `bk-${index}`),
      },
      resolved: {
        ...RESOLUTION_VERIFY_SCENARIOS[1].resolved,
        action: 'cancel_bookings',
      },
    });
    expect(gate?.details.clarifySource).toBe('blast_radius_cap');
    expect(gate?.details.requiresExecutionConfirmation).toBe(true);
  });
});
