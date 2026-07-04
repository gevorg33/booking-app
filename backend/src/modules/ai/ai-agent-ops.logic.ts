import type { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import type { AgentTaskUndoService } from '../../engine/agent/agent-task-undo.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface AgentOpsLogicDeps {
  agentOrchestrator: AgentOrchestratorService;
  agentTaskUndo: AgentTaskUndoService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

export async function handleListAgentTasksLogic(
  deps: AgentOpsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const taskId = typeof params.taskId === 'string' ? params.taskId : undefined;
  if (taskId) {
    const workspace = await deps.agentOrchestrator.previewTaskWorkspace(taskId);
    return success(
      'list_agent_tasks',
      `Preview for agent task ${taskId}.`,
      { taskId, workspace },
    );
  }

  const scope = params.scope === 'pending' ? 'pending' : 'all';
  const tasks =
    scope === 'pending'
      ? await deps.agentOrchestrator.getPendingTasks(businessId)
      : await deps.agentOrchestrator.getTasks(businessId, params.status);

  return success(
    'list_agent_tasks',
    tasks.length
      ? `${tasks.length} ${scope === 'pending' ? 'pending ' : ''}agent task(s).`
      : `No ${scope === 'pending' ? 'pending ' : ''}agent tasks found.`,
    { scope, tasks },
  );
}

export async function handleRebookAllFromAgentTaskLogic(
  deps: AgentOpsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userId: string,
): Promise<CommandResult> {
  const taskId = typeof params.taskId === 'string' ? params.taskId.trim() : '';
  if (!taskId) {
    return failure(
      'rebook_all_from_agent_task',
      'Which agent task should I rebook from? Provide the task ID.',
      { clarify: true, missing: ['taskId'] },
    );
  }

  const result = await deps.agentOrchestrator.rebookAllFromTask(
    businessId,
    taskId,
    userId,
  );

  if ((result as any).success === false) {
    return failure(
      'rebook_all_from_agent_task',
      (result as any).message ?? 'No rebooking proposals available.',
      { taskId },
    );
  }

  const task = result as any;
  return success(
    'rebook_all_from_agent_task',
    `Rebooking started for agent task ${taskId} (status: ${task.status ?? 'processing'}).`,
    { taskId, task },
  );
}

export async function handleUndoLatestAgentTaskLogic(
  deps: AgentOpsLogicDeps,
  businessId: string,
  userId: string,
  confirmed: boolean,
): Promise<CommandResult> {
  if (!confirmed) {
    const preview = await deps.agentTaskUndo.getLatestUndoPreview(businessId);
    if (!preview) {
      return failure(
        'undo_latest_agent_task',
        'No recent agent action can be undone right now.',
        { undoable: false },
      );
    }
    if (!preview.undoable) {
      return failure(
        'undo_latest_agent_task',
        preview.reason ?? 'The latest agent action cannot be undone.',
        { preview, undoable: false },
      );
    }
    return success(
      'undo_latest_agent_task',
      `Undo "${preview.intent}" (${preview.reversibleSteps.length} step(s))? Confirm to proceed.`,
      { preview, requiresConfirmation: true },
    );
  }

  try {
    const result = await deps.agentTaskUndo.undoLatest(businessId, userId);
    const failedSteps = result.reversedSteps.filter((step) => !step.success);
    return success(
      'undo_latest_agent_task',
      failedSteps.length
        ? `Undid "${result.intent}" with ${failedSteps.length} step failure(s).`
        : `Undid "${result.intent}" (${result.reversedSteps.length} step(s) reversed).`,
      { result },
    );
  } catch (err: any) {
    return failure(
      'undo_latest_agent_task',
      err?.message ?? 'Could not undo the latest agent action.',
    );
  }
}
