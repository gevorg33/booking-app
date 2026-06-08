import { describe, expect, it, jest } from '@jest/globals';
import { PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { PLAN_VERIFY_SCENARIOS } from './ai-plan-vs-prompt-check.fixtures.js';
import { BLAST_RADIUS_PARAM_SCENARIOS } from './ai-blast-radius-cap.fixtures.js';
import { INTENT_GRADUATION_SCENARIOS } from './ai-intent-graduation.fixtures.js';
import { buildExecutionVerificationGate } from './ai-execution-verification.util.js';
import { RESOLUTION_VERIFY_SCENARIOS } from './ai-resolution-accuracy-guard.fixtures.js';
import {
  CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN,
} from './ai-capability-bounded-planner.util.js';
import { AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';

/** acc-5 — execution verification & rollback wired through orchestration + command gates. */
describe('ai-execution-verification integration (acc-5)', () => {
  function buildOrchestration(orchestrator: Record<string, unknown>) {
    return new CommandOrchestrationService(
      orchestrator as never,
      { build: jest.fn() } as never,
      { emitAlert: jest.fn() } as never,
    );
  }

  it('parity-3.1 — executePlan rejects out-of-scope plan steps for staff before orchestrator runs', async () => {
    const processPlan = jest.fn();
    const orchestration = buildOrchestration({ processPlan, buildPlanDiff: jest.fn() });

    const result = await orchestration.executePlan({
      plan: {
        id: 'plan-cap',
        agentType: AgentType.CANCELLATION_RECOVERY,
        businessId: 'biz-1',
        intent: CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN.intent,
        reasoning: 'test',
        steps: [...CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN.steps],
        constraints: [],
        riskAssessment: { level: 'high', factors: [] },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
      businessId: 'biz-1',
      plannerBounds: {
        surface: 'dashboard',
        accessTier: 'staff',
        planTierId: 'solo',
      },
    });

    expect(processPlan).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.details.capabilityBoundedPlannerFailed).toBe(true);
    expect(result.details.outOfScopeActions).toContain('list_employees');
  });

  it('acc-5.2 — executePlan rejects plan-vs-prompt mismatch before orchestrator runs', async () => {
    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-scope-too-broad',
    )!;
    const processPlan = jest.fn();
    const orchestration = buildOrchestration({ processPlan, buildPlanDiff: jest.fn() });

    const result = await orchestration.executePlan({
      plan: scenario.plan,
      businessId: 'biz-1',
      userId: 'user-1',
    });

    expect(processPlan).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.details.planVsPromptFailed).toBe(true);
    expect(result.details.planMismatch).toEqual(
      expect.arrayContaining(scenario.expectMismatches ?? []),
    );
    expect(result.details.pipelineStage).toBe('plan');
  });

  it('acc-5.4/5.5 — completed task with post-exec assertion failure surfaces rollback details', async () => {
    const processPlan = jest.fn().mockResolvedValue({
      id: 'task-assert',
      businessId: 'biz-1',
      status: PlanStatus.COMPLETED,
      intent: 'create_booking',
      plan: {
        steps: [
          {
            id: 's1',
            action: 'create_booking',
            params: { employeeId: 'e1', timeSlot: '09:00' },
          },
        ],
      },
      result: {
        postExecAssertionFailed: true,
        assertionMessage: 'Booking was not created at the requested time/provider.',
        assertionField: 'bookingId',
        autoRollbackAttempted: true,
        autoRollbackSucceeded: true,
        rollbackOffered: false,
      },
    });
    const orchestration = buildOrchestration({ processPlan, buildPlanDiff: jest.fn() });

    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-maria-tomorrow-match',
    )!;
    const result = await orchestration.executePlan({
      plan: scenario.plan,
      businessId: 'biz-1',
    });

    expect(result.success).toBe(false);
    expect(result.details.postExecAssertionFailed).toBe(true);
    expect(result.details.undoTaskId).toBe('task-assert');
    expect(result.details.autoRollbackSucceeded).toBe(true);
    expect(result.details.rollbackOffered).toBe(false);
    expect(result.summary).toMatch(/not created|revert/i);
  });

  it('acc-5.6 — failed task exposes stale plan and execute revalidation issues', async () => {
    const processPlan = jest.fn().mockResolvedValue({
      id: 'task-stale',
      businessId: 'biz-1',
      status: PlanStatus.FAILED,
      intent: 'create_booking',
      plan: { steps: [{ id: 's1', description: 'Book' }] },
      result: {
        executeRevalidationFailed: true,
        executeRevalidationIssues: [{ kind: 'stale_plan', message: 'Plan is stale' }],
        stalePlan: true,
      },
      error: 'Plan is stale — please run the command again.',
    });
    const orchestration = buildOrchestration({ processPlan, buildPlanDiff: jest.fn() });

    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-maria-tomorrow-match',
    )!;
    const result = await orchestration.executePlan({
      plan: scenario.plan,
      businessId: 'biz-1',
    });

    expect(result.success).toBe(false);
    expect(result.details.stalePlan).toBe(true);
    expect(result.details.executeRevalidationFailed).toBe(true);
    expect(result.summary).toMatch(/stale/i);
  });

  it('acc-5.7 — failed task exposes blast-radius confirmation requirement', async () => {
    const blastScenario = BLAST_RADIUS_PARAM_SCENARIOS.find(
      (row) => row.id === 'cancel-thirty-bookings',
    )!;
    const processPlan = jest.fn().mockResolvedValue({
      id: 'task-blast',
      businessId: 'biz-1',
      status: PlanStatus.FAILED,
      intent: 'cancel_bookings',
      plan: { steps: [{ id: 's1', action: 'cancel_bookings' }] },
      result: {
        blastRadiusFailed: true,
        blastRadius: { exceedsCap: true, bookingCount: 30 },
        requiresExecutionConfirmation: true,
      },
      error: 'This command affects 30 bookings — confirm before executing.',
    });
    const orchestration = buildOrchestration({ processPlan, buildPlanDiff: jest.fn() });

    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-maria-tomorrow-match',
    )!;
    const result = await orchestration.executePlan({
      plan: scenario.plan,
      businessId: 'biz-1',
    });

    expect(result.success).toBe(false);
    expect(result.details.blastRadiusFailed).toBe(true);
    expect(result.details.requiresExecutionConfirmation).toBe(true);
    expect(blastScenario.expectExceeds).toBe(true);
  });

  it('acc-5.8 — pending approval task exposes propose-only graduation status', async () => {
    const graduation = INTENT_GRADUATION_SCENARIOS.find(
      (row) => row.id === 'payment-sweep-no-traffic',
    )!;
    const processPlan = jest.fn().mockResolvedValue({
      id: 'task-propose',
      businessId: 'biz-1',
      status: PlanStatus.REQUIRES_APPROVAL,
      intent: 'payment_sweep',
      plan: {
        steps: [{ id: 's1', action: 'payment_sweep', description: 'Sweep payments' }],
        reasoning: 'Collect outstanding payments',
        riskAssessment: { level: 'medium' },
      },
      result: {
        graduationStatus: {
          action: 'payment_sweep',
          proposeOnly: graduation.expectProposeOnly,
          graduated: graduation.expectGraduated,
          samples: 0,
          minSamples: 20,
          accurateRate: 0,
        },
      },
      context: { employees: [{}] },
    });
    const orchestration = buildOrchestration({
      processPlan,
      buildPlanDiff: jest.fn(() => [
        { id: 's1', action: 'payment_sweep', description: 'Sweep', impact: 'Payments' },
      ]),
    });

    const scenario = PLAN_VERIFY_SCENARIOS.find(
      (row) => row.id === 'dash-cancel-maria-tomorrow-match',
    )!;
    const result = await orchestration.executePlan({
      plan: scenario.plan,
      businessId: 'biz-1',
      autoExecute: false,
    });

    expect(result.requiresApproval).toBe(true);
    expect(result.details.proposeOnly).toBe(true);
    expect(result.details.dryRun).toBe(true);
    expect(result.summary).toMatch(/propose-only/i);
  });

  it.each(RESOLUTION_VERIFY_SCENARIOS.filter((row) => !row.expectOk))(
    'acc-5.1 — buildExecutionVerificationGate clarifies $id',
    (scenario) => {
      const gate = buildExecutionVerificationGate({
        prompt: scenario.resolved.prompt,
        action: scenario.resolved.action,
        params: scenario.resolved.params,
        enrichedParams: scenario.resolved.enrichedParams,
        resolved: scenario.resolved,
      });
      expect(gate).not.toBeNull();
      expect(gate?.details.needsClarification).toBe(true);
      expect(gate?.details.clarifySource).toBe('resolution_accuracy');
    },
  );
});
