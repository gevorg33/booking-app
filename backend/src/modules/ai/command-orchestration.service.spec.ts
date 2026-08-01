import { describe, expect, it, jest } from '@jest/globals';
import {
  AgentType,
  PlanStatus,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  CommandOrchestrationService,
  ORCHESTRATION_AGENT_RESULT_ACTIONS,
} from './command-orchestration.service.js';

describe('CommandOrchestrationService (e2e-bug.150)', () => {
  function buildService(processIntent = jest.fn()) {
    return {
      service: new CommandOrchestrationService(
        {
          processIntent,
          processPlan: jest.fn(),
          buildPlanDiff: jest.fn(() => []),
          approveAndExecute: jest.fn(),
          retryFailedStep: jest.fn(),
        } as any,
        {
          build: jest.fn(async () => ({
            dateRange: undefined,
            employees: [],
          })),
        } as any,
        { emitAlert: jest.fn() } as any,
      ),
      processIntent,
    };
  }

  it('maps orchestration agent types to canonical dashboard actions', () => {
    expect(ORCHESTRATION_AGENT_RESULT_ACTIONS).toEqual({
      [AgentType.SCHEDULING_OPTIMIZATION]: 'optimize_schedule',
      [AgentType.CONFLICT_RESOLUTION]: 'resolve_conflicts',
      [AgentType.CANCELLATION_RECOVERY]: 'reassign_cancelled',
    });
  });

  it.each([
    {
      action: 'optimize_schedule',
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      prompt: 'Optimize my schedule for next week',
    },
    {
      action: 'resolve_conflicts',
      agentType: AgentType.CONFLICT_RESOLUTION,
      prompt: 'Resolve any double-booked conflicts today',
    },
    {
      action: 'reassign_cancelled',
      agentType: AgentType.CANCELLATION_RECOVERY,
      prompt: 'Can you rebook the customers who cancelled recently?',
    },
  ] as const)(
    'runOrchestrationIntent returns action=$action not the raw prompt',
    async ({ action, agentType, prompt }) => {
      const { service, processIntent } = buildService(
        jest.fn(async () => ({
          id: 'task-1',
          businessId: 'biz-1',
          agentType,
          status: PlanStatus.COMPLETED,
          intent: prompt,
          plan: { steps: [], reasoning: 'ok', intent: prompt },
          result: {},
        })),
      );

      const result = await service.runOrchestrationIntent({
        businessId: 'biz-1',
        intent: prompt,
        action,
        agentType,
      });

      expect(processIntent).toHaveBeenCalledWith(
        expect.objectContaining({ intent: prompt, agentType }),
      );
      expect(result.action).toBe(action);
      expect(result.action).not.toBe(prompt);
      expect(result.success).toBe(true);
    },
  );

  it('approve path still returns canonical action when task.intent is the user prompt', async () => {
    const prompt = 'Can you rebook the customers who cancelled recently?';
    const approveAndExecute = jest.fn(async () => ({
      id: 'task-2',
      businessId: 'biz-1',
      agentType: AgentType.CANCELLATION_RECOVERY,
      status: PlanStatus.COMPLETED,
      intent: prompt,
      plan: { steps: [], intent: prompt },
      result: {},
    }));
    const service = new CommandOrchestrationService(
      {
        processIntent: jest.fn(),
        processPlan: jest.fn(),
        buildPlanDiff: jest.fn(() => []),
        approveAndExecute,
        retryFailedStep: jest.fn(),
      } as any,
      { build: jest.fn() } as any,
      { emitAlert: jest.fn() } as any,
    );

    const result = await service.approveTask('task-2', 'user-1');
    expect(result.action).toBe('reassign_cancelled');
    expect(result.action).not.toBe(prompt);
  });

  it('resolveResultAction prefers agentType mapping over a free-text hint', () => {
    const { service } = buildService();
    expect(
      service.resolveResultAction(
        { agentType: AgentType.CONFLICT_RESOLUTION },
        'Please fix my conflicts?',
      ),
    ).toBe('resolve_conflicts');
  });

  // e2e-bug.248 — plan.intent reschedule_booking must win over shared agentType.
  it('resolveResultAction prefers canonical plan intent over agentType', () => {
    const { service } = buildService();
    expect(
      service.resolveResultAction(
        { agentType: AgentType.SCHEDULING_OPTIMIZATION },
        'reschedule_booking',
      ),
    ).toBe('reschedule_booking');
    expect(
      service.resolveResultAction(
        { agentType: AgentType.SCHEDULING_OPTIMIZATION },
        'optimize_schedule',
      ),
    ).toBe('optimize_schedule');
  });
});
