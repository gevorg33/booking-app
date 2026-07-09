import { describe, expect, it, jest } from '@jest/globals';
import {
  handleApproveAgentTaskLogic,
  handleListAgentTasksLogic,
  handleRebookAllFromAgentTaskLogic,
  handleRetryAgentStepLogic,
  handleUndoLatestAgentTaskLogic,
  type AgentOpsLogicDeps,
} from './ai-agent-ops.logic.js';

function buildDeps(overrides: Record<string, any> = {}): AgentOpsLogicDeps {
  return {
    agentOrchestrator: {
      previewTaskWorkspace: jest.fn(async () => ({})),
      getTask: jest.fn(async () => ({})),
      getTasks: jest.fn(async () => []),
      getPendingTasks: jest.fn(async () => []),
      rebookAllFromTask: jest.fn(async () => ({
        success: false,
        message: 'No rebooking proposals available',
      })),
      approveAndExecute: jest.fn(async () => ({ id: 't1', status: 'processing' })),
      retryFailedStep: jest.fn(async () => ({ id: 't1', status: 'processing' })),
      ...overrides.agentOrchestrator,
    },
    agentTaskUndo: {
      getLatestUndoPreview: jest.fn(async () => null),
      undoLatest: jest.fn(async () => ({
        taskId: 't1',
        intent: 'cancel all afternoon',
        reversedSteps: [],
      })),
      ...overrides.agentTaskUndo,
    },
  } as any;
}

describe('ai-agent-ops.logic (ai-cmd-dashboard-6.1)', () => {
  describe('handleListAgentTasksLogic', () => {
    it('previews a specific task when taskId is given', async () => {
      const deps = buildDeps({
        agentOrchestrator: {
          previewTaskWorkspace: jest.fn(async () => ({ foo: 'bar' })),
        },
      });

      const result = await handleListAgentTasksLogic(deps, 'biz-1', {
        taskId: 'task-1',
      });

      expect(result.success).toBe(true);
      expect(deps.agentOrchestrator.previewTaskWorkspace).toHaveBeenCalledWith(
        'task-1',
      );
      expect(result.details).toMatchObject({ taskId: 'task-1' });
    });

    it('lists pending tasks when scope=pending', async () => {
      const deps = buildDeps({
        agentOrchestrator: {
          getPendingTasks: jest.fn(async () => [{ id: 't1' }, { id: 't2' }]),
        },
      });

      const result = await handleListAgentTasksLogic(deps, 'biz-1', {
        scope: 'pending',
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('2 pending');
      expect(deps.agentOrchestrator.getPendingTasks).toHaveBeenCalledWith(
        'biz-1',
      );
    });

    it('lists all tasks by default', async () => {
      const deps = buildDeps({
        agentOrchestrator: { getTasks: jest.fn(async () => [{ id: 't1' }]) },
      });

      const result = await handleListAgentTasksLogic(deps, 'biz-1', {});

      expect(result.success).toBe(true);
      expect(deps.agentOrchestrator.getTasks).toHaveBeenCalledWith(
        'biz-1',
        undefined,
      );
    });
  });

  describe('handleRebookAllFromAgentTaskLogic', () => {
    it('asks for a taskId when missing', async () => {
      const deps = buildDeps();
      const result = await handleRebookAllFromAgentTaskLogic(
        deps,
        'biz-1',
        {},
        'user-1',
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('reports failure when no rebooking proposals exist', async () => {
      const deps = buildDeps();
      const result = await handleRebookAllFromAgentTaskLogic(
        deps,
        'biz-1',
        { taskId: 'task-1' },
        'user-1',
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('No rebooking proposals');
    });

    it('reports success when the orchestrator returns a task', async () => {
      const deps = buildDeps({
        agentOrchestrator: {
          rebookAllFromTask: jest.fn(async () => ({
            id: 'plan-1',
            status: 'completed',
          })),
        },
      });
      const result = await handleRebookAllFromAgentTaskLogic(
        deps,
        'biz-1',
        { taskId: 'task-1' },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.agentOrchestrator.rebookAllFromTask).toHaveBeenCalledWith(
        'biz-1',
        'task-1',
        'user-1',
      );
    });
  });

  describe('handleUndoLatestAgentTaskLogic', () => {
    it('returns failure when nothing is undoable', async () => {
      const deps = buildDeps();
      const result = await handleUndoLatestAgentTaskLogic(
        deps,
        'biz-1',
        'user-1',
        false,
      );
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ undoable: false });
    });

    it('returns a confirmation-required preview when undoable', async () => {
      const deps = buildDeps({
        agentTaskUndo: {
          getLatestUndoPreview: jest.fn(async () => ({
            taskId: 't1',
            intent: 'cancel all afternoon',
            createdAt: new Date(),
            undoable: true,
            reversibleSteps: [{ action: 'cancel_booking', description: 'x' }],
          })),
        },
      });
      const result = await handleUndoLatestAgentTaskLogic(
        deps,
        'biz-1',
        'user-1',
        false,
      );
      expect(result.success).toBe(true);
      expect(result.details).toMatchObject({ requiresConfirmation: true });
    });

    it('executes the undo when confirmed', async () => {
      const deps = buildDeps({
        agentTaskUndo: {
          undoLatest: jest.fn(async () => ({
            taskId: 't1',
            intent: 'cancel all afternoon',
            reversedSteps: [{ action: 'cancel_booking', description: 'x', success: true }],
          })),
        },
      });
      const result = await handleUndoLatestAgentTaskLogic(
        deps,
        'biz-1',
        'user-1',
        true,
      );
      expect(result.success).toBe(true);
      expect(deps.agentTaskUndo.undoLatest).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
      );
    });

    it('handles the undoLatest exception gracefully when confirmed but nothing to undo', async () => {
      const deps = buildDeps({
        agentTaskUndo: {
          undoLatest: jest.fn(async () => {
            throw new Error('No completed AI command is available to undo');
          }),
        },
      });
      const result = await handleUndoLatestAgentTaskLogic(
        deps,
        'biz-1',
        'user-1',
        true,
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('No completed AI command');
    });
  });

  describe('handleApproveAgentTaskLogic', () => {
    it('approves a task', async () => {
      const deps = buildDeps();
      const result = await handleApproveAgentTaskLogic(
        deps,
        'biz-1',
        { taskId: 't1' },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.agentOrchestrator.approveAndExecute).toHaveBeenCalledWith(
        't1',
        'user-1',
      );
    });

    it('clarifies when taskId is missing', async () => {
      const deps = buildDeps();
      const result = await handleApproveAgentTaskLogic(deps, 'biz-1', {}, 'user-1');
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('handles approval errors', async () => {
      const deps = buildDeps({
        agentOrchestrator: {
          approveAndExecute: jest.fn(async () => {
            throw new Error('Task is in Completed state, cannot execute');
          }),
        },
      });
      const result = await handleApproveAgentTaskLogic(
        deps,
        'biz-1',
        { taskId: 't1' },
        'user-1',
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('cannot execute');
    });
  });

  describe('handleRetryAgentStepLogic', () => {
    it('retries a failed step', async () => {
      const deps = buildDeps();
      const result = await handleRetryAgentStepLogic(
        deps,
        'biz-1',
        { taskId: 't1', stepId: 's1' },
        'user-1',
      );
      expect(result.success).toBe(true);
      expect(deps.agentOrchestrator.retryFailedStep).toHaveBeenCalledWith(
        't1',
        's1',
        'user-1',
        'biz-1',
      );
    });

    it('clarifies when taskId or stepId is missing', async () => {
      const deps = buildDeps();
      const result = await handleRetryAgentStepLogic(
        deps,
        'biz-1',
        { taskId: 't1' },
        'user-1',
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('handles retry errors', async () => {
      const deps = buildDeps({
        agentOrchestrator: {
          retryFailedStep: jest.fn(async () => {
            throw new Error('Step s1 not found in plan');
          }),
        },
      });
      const result = await handleRetryAgentStepLogic(
        deps,
        'biz-1',
        { taskId: 't1', stepId: 's1' },
        'user-1',
      );
      expect(result.success).toBe(false);
      expect(result.summary).toContain('not found in plan');
    });
  });
});
