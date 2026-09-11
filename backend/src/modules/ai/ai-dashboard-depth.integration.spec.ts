import { describe, expect, it, jest } from '@jest/globals';
import {
  AgentType,
  PlanStatus,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

/**
 * Sprint 17 — dashboard depth wiring (macros, wizard meta, alerts, weekly report settings).
 */
describe('Sprint 17 AI dashboard depth integration', () => {
  it('merges default command macros into AI settings', () => {
    const settings = new AiSettingsService({} as any);
    const merged = settings.mergeSettings({});
    expect(merged.macros.some((m) => m.id === 'monday-morning-setup')).toBe(
      true,
    );
    expect(merged.macros.some((m) => m.id === 'end-week-gap-fill')).toBe(true);
    expect(DEFAULT_AI_SETTINGS.macros).toHaveLength(2);
  });

  it('taskToResult attaches wizard, policyExplain, and emits alert on approval', async () => {
    const emitAlert = jest.fn();
    const buildPlanDiff = jest.fn(() => [
      {
        id: '1',
        action: 'apply_template',
        description: 'Apply weekday',
        impact: 'Team',
      },
      {
        id: '2',
        action: 'fill_schedule_gaps',
        description: 'Fill gaps',
        impact: 'Slots',
      },
    ]);

    const orchestrator = {
      processPlan: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      buildPlanDiff,
    };
    const orchestration = new CommandOrchestrationService(
      orchestrator as any,
      { build: jest.fn() } as any,
      { emitAlert } as any,
    );

    const task = {
      id: 'task-wizard',
      businessId: 'biz-1',
      status: PlanStatus.REQUIRES_APPROVAL,
      intent: 'setup_week_schedule',
      plan: {
        steps: [{ id: '1' }, { id: '2' }],
        reasoning: 'Week setup',
        riskAssessment: { level: 'high' },
      },
      result: {
        policyPreview: {
          decision: 'requires_approval',
          riskLevel: 'high',
          violations: ['3 providers'],
          reasons: [],
        },
      },
      context: { employees: [{}, {}, {}], policyMetrics: { employeeCount: 3 } },
    };

    orchestrator.processPlan.mockResolvedValue(task);

    const result = await orchestration.executePlan({
      plan: { ...task.plan, intent: 'setup_week_schedule' } as any,
      businessId: 'biz-1',
      userId: 'user-1',
      autoExecute: false,
    });

    expect(result.requiresApproval).toBe(true);
    expect(result.details.wizardMode).toBe(true);
    expect(result.details.wizardSteps).toHaveLength(2);
    expect(result.details.policyExplain).toMatchObject({ riskLevel: 'high' });
    expect(emitAlert).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ alertType: 'approval', taskId: 'task-wizard' }),
    );
  });

  it('maps execution timeline on failed tasks', async () => {
    const orchestrator = {
      processPlan: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      buildPlanDiff: jest.fn(),
    };
    const orchestration = new CommandOrchestrationService(
      orchestrator as any,
      { build: jest.fn() } as any,
      { emitAlert: jest.fn() } as any,
    );

    orchestrator.processPlan.mockResolvedValue({
      id: 'task-fail',
      businessId: 'biz-1',
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      status: PlanStatus.FAILED,
      intent: 'Optimize my schedule please?',
      plan: { steps: [{ id: 's1', description: 'Optimize' }] },
      result: {
        steps: [{ stepId: 's1', status: 'failed', error: 'Slot conflict' }],
      },
      error: 'Workflow error',
    });

    const result = await orchestration.executePlan({
      plan: { steps: [], intent: 'Optimize my schedule please?' } as any,
      businessId: 'biz-1',
    });

    expect(result.success).toBe(false);
    // e2e-bug.150 — never echo the free-text prompt as action.
    expect(result.action).toBe('optimize_schedule');
    expect(result.details.executionTimeline).toEqual([
      expect.objectContaining({
        stepId: 's1',
        status: 'failed',
        canRetry: true,
        description: 'Optimize',
      }),
    ]);
  });
});
