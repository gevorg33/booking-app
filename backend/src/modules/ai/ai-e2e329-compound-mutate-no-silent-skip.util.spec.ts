import { CompoundCommandGraphService } from './compound-command-graph.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';

/**
 * e2e-bug.329 — compound resume with empty prior plans must not silently
 * skip a mutating step (reschedule/create/book/cancel) whose plan can't be
 * built and fall through to execute a later, unrelated leg instead.
 */
describe('CompoundCommandGraphService (e2e-bug.329): mutating steps must not silently skip', () => {
  const completionPipeline = {
    mergeSessionContext: jest.fn((params) => ({ ...params })),
    normalizeDateParams: jest.fn(),
    finalizeRescheduleParams: jest.fn(),
    enrichDateRangeParams: jest.fn(),
    resolve: jest.fn((_biz, _prompt, parsed) => ({
      action: parsed.action,
      params: parsed.params,
      enrichedParams: parsed.params,
      entities: { employeeId: undefined },
      reasoning: parsed.reasoning,
    })),
    validate: jest.fn(() => ({ ok: true, issues: [] })),
    toClarifyResult: jest.fn(),
    trace: jest.fn((_stage, action, detail) => `${action}:${detail ?? ''}`),
  } as unknown as CommandCompletionPipelineService;

  const planBuilder = {
    buildHideAppointmentsPlan: jest.fn(),
    mergePlans: jest.fn((_biz, _action, plans) => plans[0]),
  } as unknown as OperationalPlanBuilderService;

  const orchestration = {
    executePlan: jest.fn(async () => ({
      success: true,
      summary: 'done',
      action: 'compound_intent',
      details: {},
    })),
  } as unknown as CommandOrchestrationService;

  const graph = new CompoundCommandGraphService(
    completionPipeline,
    planBuilder,
    orchestration,
  );

  const toCommandResult = (orch: any) => ({
    success: true,
    action: 'compound_intent',
    summary: orch.summary ?? 'done',
    details: orch.details ?? {},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stops (does not advance to the next leg) when a fresh compound reschedule step fails to build a plan', async () => {
    const buildPlan = jest.fn(
      async (action: string, params: Record<string, unknown>): Promise<AgentPlan | null> => {
        if (action === 'reschedule_booking') return null;
        return {
          businessId: 'biz-1',
          action,
          steps: [{ action, params }],
        } as unknown as AgentPlan;
      },
    );

    const result = await graph.run({
      businessId: 'biz-1',
      prompt: "Move Anna's appointment to Friday; then book a massage with Gevorg",
      sessionContext: {},
      subIntents: [
        {
          action: 'reschedule_booking',
          params: { customerName: 'Anna' },
          reasoning: 'move Anna',
        },
        {
          action: 'create_booking',
          params: { customerName: 'Gevorg', serviceName: 'massage' },
          reasoning: 'book massage',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      buildPlan,
      toCommandResult,
    });

    // Must not have proceeded to build/execute the create_booking leg.
    expect(buildPlan).toHaveBeenCalledTimes(1);
    expect(buildPlan.mock.calls[0][0]).toBe('reschedule_booking');
    expect(result.success).toBe(false);
    expect(result.action).toBe('reschedule_booking');
    expect(result.summary).toContain("couldn't reschedule the booking");
    expect(result.details?.needsClarification).toBe(true);
  });

  it('reproduces the exact e2e-bug.329 resume-with-empty-plans condition without silently skipping to the create leg', async () => {
    const buildPlan = jest.fn(
      async (action: string, params: Record<string, unknown>): Promise<AgentPlan | null> => {
        if (action === 'reschedule_booking') return null;
        return {
          businessId: 'biz-1',
          action,
          steps: [{ action, params }],
        } as unknown as AgentPlan;
      },
    );

    const result = await graph.run({
      businessId: 'biz-1',
      prompt: 'Start time: 10:00',
      sessionContext: { timeSlot: '10:00' },
      subIntents: [
        {
          action: 'reschedule_booking',
          params: { customerName: 'Anna' },
          reasoning: 'move Anna',
        },
        {
          action: 'create_booking',
          params: { customerName: 'Gevorg', serviceName: 'massage' },
          reasoning: 'book massage',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      // e2e-bug.329's readCompoundResumeFromContext resets stepIndex to 0
      // whenever resumePlans is empty — reproduced directly here.
      resumePlans: [],
      resumeStepIndex: 0,
      buildPlan,
      toCommandResult,
    });

    expect(buildPlan).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.action).toBe('reschedule_booking');
    expect(result.details?.skippedSteps).toBeUndefined();
  });

  it('still attaches compound resume state when a later mutating leg fails after an earlier leg already built a plan', async () => {
    const buildPlan = jest.fn(
      async (action: string, params: Record<string, unknown>): Promise<AgentPlan | null> => {
        if (action === 'reschedule_booking') return null;
        return {
          businessId: 'biz-1',
          action,
          steps: [{ action, params }],
        } as unknown as AgentPlan;
      },
    );

    const result = await graph.run({
      businessId: 'biz-1',
      prompt: 'Book a massage for Gevorg; then move Anna to Friday',
      sessionContext: {},
      subIntents: [
        {
          action: 'create_booking',
          params: { customerName: 'Gevorg', serviceName: 'massage' },
          reasoning: 'book massage',
        },
        {
          action: 'reschedule_booking',
          params: { customerName: 'Anna' },
          reasoning: 'move Anna',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      buildPlan,
      toCommandResult,
    });

    expect(result.action).toBe('compound_intent');
    expect(result.details?.compoundResumePlans).toHaveLength(1);
    expect(result.details?.compoundStep).toBe('reschedule_booking');
  });

  it('non-regression: a genuinely optional (non-must-not-skip) action still uses the old silent-skip path', async () => {
    const buildPlan = jest.fn(
      async (action: string, params: Record<string, unknown>): Promise<AgentPlan | null> => {
        if (action === 'apply_schedule') return null;
        return {
          businessId: 'biz-1',
          action,
          steps: [{ action, params }],
        } as unknown as AgentPlan;
      },
    );

    const result = await graph.run({
      businessId: 'biz-1',
      prompt: 'Apply the template; then book a massage for Gevorg',
      sessionContext: {},
      subIntents: [
        {
          action: 'apply_schedule',
          params: {},
          reasoning: 'apply template',
        },
        {
          action: 'create_booking',
          params: { customerName: 'Gevorg', serviceName: 'massage' },
          reasoning: 'book massage',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      buildPlan,
      toCommandResult,
    });

    expect(buildPlan).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.details?.skippedSteps).toEqual(['apply_schedule']);
  });

  it('non-regression: both legs build successfully and execute as before', async () => {
    const buildPlan = jest.fn(
      async (action: string, params: Record<string, unknown>): Promise<AgentPlan | null> =>
        ({
          businessId: 'biz-1',
          action,
          steps: [{ action, params }],
        }) as unknown as AgentPlan,
    );

    const result = await graph.run({
      businessId: 'biz-1',
      prompt: "Move Anna's appointment to Friday; then book a massage with Gevorg",
      sessionContext: {},
      subIntents: [
        {
          action: 'reschedule_booking',
          params: { customerName: 'Anna' },
          reasoning: 'move Anna',
        },
        {
          action: 'create_booking',
          params: { customerName: 'Gevorg', serviceName: 'massage' },
          reasoning: 'book massage',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      buildPlan,
      toCommandResult,
    });

    expect(buildPlan).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.details?.langGraphPath).toBe('compound');
  });
});
