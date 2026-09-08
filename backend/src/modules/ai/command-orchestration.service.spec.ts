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

/**
 * e2e-bug.486 — a failed orchestration names the writes that already landed.
 *
 * This is the live execution path and it has **no compensation and no
 * transaction boundary**: when a middle step fails, the earlier steps have
 * already written and stay written. The failure summary listed only the failed
 * steps, so "Orchestration failed (1/3 step(s) failed)" was all the user saw
 * while a schedule had been rewritten.
 *
 * Reporting is deliberately all this does. Undoing the writes needs the §47
 * saga model, which hangs off an executor with no production callers
 * (e2e-bug.368); naming them needs only the step statuses already on the task,
 * and is what makes the state recoverable by hand until then.
 */
describe('e2e-bug.486 — stranded writes are named on failure', () => {
  // Constructed locally: `buildService` above is scoped to its own describe.
  const service = new CommandOrchestrationService(
    {
      processIntent: jest.fn(),
      processPlan: jest.fn(),
      buildPlanDiff: jest.fn(() => []),
      approveAndExecute: jest.fn(),
      retryFailedStep: jest.fn(),
    } as any,
    { build: jest.fn() } as any,
    { emitAlert: jest.fn() } as any,
  );
  const summarize = (task: any) =>
    (service as any).summarizeExecutionFailure(task);

  const task = {
    plan: {
      steps: [
        { id: 's1', description: 'Add Monday schedule', action: 'add_schedule' },
        { id: 's2', description: 'Create booking', action: 'create_booking' },
        { id: 's3', description: 'Charge deposit', action: 'charge' },
      ],
    },
    result: {
      steps: [
        { stepId: 's1', status: 'completed' },
        { stepId: 's2', status: 'completed' },
        { stepId: 's3', status: 'failed', error: 'card declined' },
      ],
    },
  };

  it('says which steps were applied and not undone', () => {
    const summary = summarize(task);
    expect(summary).toContain('NOT undone');
    expect(summary).toContain('Add Monday schedule');
    expect(summary).toContain('Create booking');
  });

  it('still reports the failure itself', () => {
    // The addition must not displace what the summary already said.
    const summary = summarize(task);
    expect(summary).toContain('Orchestration failed');
    expect(summary).toContain('card declined');
  });

  it('says nothing extra when the first step failed', () => {
    // Nothing landed, so there is nothing to warn about — a blanket warning
    // would train users to ignore it.
    const summary = summarize({
      plan: { steps: [{ id: 's1', description: 'Add schedule' }] },
      result: { steps: [{ stepId: 's1', status: 'failed', error: 'boom' }] },
    });
    expect(summary).not.toContain('NOT undone');
  });

  it('falls back to the action or step id when a description is missing', () => {
    const summary = summarize({
      plan: { steps: [{ id: 's1', action: 'create_booking' }, { id: 's2' }] },
      result: {
        steps: [
          { stepId: 's1', status: 'completed' },
          { stepId: 's2', status: 'failed', error: 'x' },
        ],
      },
    });
    expect(summary).toContain('create_booking');
  });
});
