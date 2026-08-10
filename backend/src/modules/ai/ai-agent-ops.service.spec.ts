import { describe, expect, it, jest } from '@jest/globals';
import { AiAgentOpsService } from './ai-agent-ops.service.js';

describe('AiAgentOpsService (ai-cmd-dashboard-6.1)', () => {
  function buildService() {
    const agentOrchestrator = {
      previewTaskWorkspace: jest.fn(async () => ({})),
      getTask: jest.fn(async () => ({})),
      getTasks: jest.fn(async () => []),
      getPendingTasks: jest.fn(async () => []),
      rebookAllFromTask: jest.fn(async () => ({
        success: false,
        message: 'No rebooking proposals available',
      })),
    };
    const agentTaskUndo = {
      getLatestUndoPreview: jest.fn(async (_businessId: string) => null),
      undoLatest: jest.fn(async (_businessId: string, _userId: string) => ({
        taskId: 't1',
        intent: 'x',
        reversedSteps: [],
      })),
    };
    const service = new AiAgentOpsService(
      agentOrchestrator as any,
      agentTaskUndo as any,
    );
    return { service, agentOrchestrator, agentTaskUndo };
  }

  it('handleListAgentTasks delegates to the orchestrator', async () => {
    const { service, agentOrchestrator } = buildService();
    const result = await service.handleListAgentTasks('biz-1', {});
    expect(result.action).toBe('list_agent_tasks');
    expect(agentOrchestrator.getTasks).toHaveBeenCalled();
  });

  it('handleRebookAllFromAgentTask delegates to the orchestrator', async () => {
    const { service } = buildService();
    const result = await service.handleRebookAllFromAgentTask(
      'biz-1',
      { taskId: 't1' },
      'user-1',
    );
    expect(result.action).toBe('rebook_all_from_agent_task');
  });

  it('handleUndoLatestAgentTask previews without confirmation', async () => {
    const { service, agentTaskUndo } = buildService();
    const result = await service.handleUndoLatestAgentTask(
      'biz-1',
      'user-1',
      false,
    );
    expect(result.action).toBe('undo_latest_agent_task');
    expect(agentTaskUndo.undoLatest).not.toHaveBeenCalled();
  });

  it('handleUndoLatestAgentTask executes when confirmed', async () => {
    const { service, agentTaskUndo } = buildService();
    await service.handleUndoLatestAgentTask('biz-1', 'user-1', true);
    expect(agentTaskUndo.undoLatest).toHaveBeenCalledWith('biz-1', 'user-1');
  });

  it('exposes the rescue + detector passthroughs', () => {
    const { service } = buildService();
    expect(
      service.rescueAgentOpsIntent('rebook all from task t1', 'unknown'),
    ).toEqual({
      action: 'rebook_all_from_agent_task',
      rescueReason: 'rebook_all',
    });
    expect(service.isListAgentTasksPrompt('show agent tasks')).toBe(true);
    expect(
      service.isRebookAllFromAgentTaskPrompt('rebook all from task t1'),
    ).toBe(true);
    expect(
      service.isUndoLatestAgentTaskPrompt('undo the last agent action'),
    ).toBe(true);
  });
});
