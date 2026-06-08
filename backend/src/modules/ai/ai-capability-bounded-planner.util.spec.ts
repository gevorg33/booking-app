import { AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  assertCapabilityBoundedPlannerProbes,
  buildOutOfScopePlanSummary,
  CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN,
  CAPABILITY_PLANNER_PROBE_SCENARIOS,
  filterDecomposedStepsToAllowedIntents,
  formatCapabilityBoundedPlannerReport,
  resolvePlannerAllowedIntents,
  validatePlanAgainstAllowedIntents,
} from './ai-capability-bounded-planner.util.js';
import { buildCapabilityBoundedDecompositionSchemaView } from './intent-decomposition.schema.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';

describe('ai-capability-bounded-planner (parity-3.1)', () => {
  it.each(CAPABILITY_PLANNER_PROBE_SCENARIOS)(
    '$id — allowed/denied intents for $bounds.accessTier/$bounds.surface',
    (probe) => {
      const allowed = resolvePlannerAllowedIntents(probe.bounds);
      if (probe.allowedAction) {
        expect(allowed).toContain(probe.allowedAction);
      }
      if (probe.deniedAction) {
        expect(allowed).not.toContain(probe.deniedAction);
      }
    },
  );

  it('rejects staff plan containing list_employees', () => {
    const allowed = resolvePlannerAllowedIntents({
      surface: 'dashboard',
      accessTier: 'staff',
      planTierId: 'solo',
    });
    const validation = validatePlanAgainstAllowedIntents(
      { steps: [...CAPABILITY_PLANNER_OUT_OF_SCOPE_PLAN.steps] },
      allowed,
    );
    expect(validation.ok).toBe(false);
    expect(validation.outOfScope).toContain('list_employees');
    expect(buildOutOfScopePlanSummary(validation.outOfScope)).toMatch(
      /outside your role/i,
    );
  });

  it('buildCapabilityBoundedDecompositionSchemaView excludes staff-denied intents', () => {
    const ownerSchema = buildCapabilityBoundedDecompositionSchemaView({
      surface: 'dashboard',
      accessTier: 'owner',
      planTierId: 'solo',
    });
    const staffSchema = buildCapabilityBoundedDecompositionSchemaView({
      surface: 'dashboard',
      accessTier: 'staff',
      planTierId: 'solo',
    });
    expect(ownerSchema.allowedActions).toContain('list_employees');
    expect(staffSchema.allowedActions).not.toContain('list_employees');
    expect(staffSchema.allowedActions).toContain('list_bookings');
  });

  it('filters deterministic decomposition steps to allowed intents', () => {
    const steps = filterDecomposedStepsToAllowedIntents(
      [
        { action: 'list_bookings', params: {}, reasoning: 'list' },
        { action: 'list_employees', params: {}, reasoning: 'staff dir' },
      ],
      resolvePlannerAllowedIntents({
        surface: 'dashboard',
        accessTier: 'staff',
        planTierId: 'solo',
      }),
    );
    expect(steps.map((step) => step.action)).toEqual(['list_bookings']);
  });

  it('decomposeDeterministicForSurface drops out-of-scope steps for staff', () => {
    const owner = decomposeDeterministicForSurface(
      'dashboard',
      'Cancel package visit and notify waitlist for Friday',
    );
    const staffAllowed = resolvePlannerAllowedIntents({
      surface: 'dashboard',
      accessTier: 'staff',
      planTierId: 'solo',
    });
    const staff = decomposeDeterministicForSurface(
      'dashboard',
      'Cancel package visit and notify waitlist for Friday',
      staffAllowed,
    );
    expect(owner?.steps.length).toBeGreaterThanOrEqual(2);
    if (staff) {
      for (const step of staff.steps) {
        expect(staffAllowed).toContain(step.action);
      }
    }
  });

  it('CommandOrchestrationService.executePlan blocks out-of-scope steps before orchestrator', async () => {
    const processPlan = jest.fn();
    const orchestration = new CommandOrchestrationService(
      { processPlan } as never,
      { build: jest.fn() } as never,
      { emitAlert: jest.fn() } as never,
    );

    const result = await orchestration.executePlan({
      plan: {
        id: 'plan-1',
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

  it('passes capability-bounded planner probe gate', () => {
    const status = assertCapabilityBoundedPlannerProbes();
    if (!status.complete) {
      console.log(formatCapabilityBoundedPlannerReport(status));
    }
    expect(status.complete).toBe(true);
  });
});
