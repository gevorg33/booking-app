import * as perStepPermission from './ai-per-step-permission-recheck.util.js';
import { CompoundCommandGraphService } from './compound-command-graph.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';

describe('CompoundCommandGraphService (ai-cmd-h2.4)', () => {
  const capturedPlanParams: Record<string, unknown>[] = [];

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

  const buildPlan = jest.fn(
    async (
      action: string,
      params: Record<string, unknown>,
    ): Promise<AgentPlan | null> => {
      capturedPlanParams.push({ action, ...params });
      return {
        businessId: 'biz-1',
        action,
        steps: [{ action, params }],
      };
    },
  );

  beforeEach(() => {
    capturedPlanParams.length = 0;
    jest.clearAllMocks();
    jest
      .spyOn(perStepPermission, 'validateStepPermissionAtExecute')
      .mockReturnValue({ ok: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enriches booking hints on every check+book sub-step via LangGraph compound path', async () => {
    const prompt =
      'check who is free tomorrow evening for permanent lashes, book the nearest slot';

    const result = await graph.run({
      businessId: 'biz-1',
      prompt,
      sessionContext: { confirmed: true },
      subIntents: [
        {
          action: 'check_providers_for_service',
          params: { serviceName: 'permanent lashes' },
          reasoning: 'check',
        },
        {
          action: 'book_nearest_slot',
          params: { serviceName: 'permanent lashes' },
          reasoning: 'book',
        },
      ],
      catalog: { employees: [], services: [], customers: [], templates: [] },
      timeZone: 'UTC',
      confidenceThresholds: { low: 0.5, high: 0.85 },
      buildPlan,
      toCommandResult: (orch) => ({
        success: true,
        action: 'compound_intent',
        summary: orch.summary ?? 'done',
        details: orch.details ?? {},
      }),
    });

    expect(result.success).toBe(true);
    expect(buildPlan).toHaveBeenCalledTimes(2);
    expect(capturedPlanParams[0]).toMatchObject({
      action: 'check_providers_for_service',
      timeOfDay: 'evening',
      allProviders: true,
    });
    expect(capturedPlanParams[1]).toMatchObject({
      action: 'book_nearest_slot',
      bookingFirstAvailable: true,
      timeOfDay: 'evening',
      allProviders: true,
    });
    expect(result.details?.langGraphPath).toBe('compound');
  });
});
