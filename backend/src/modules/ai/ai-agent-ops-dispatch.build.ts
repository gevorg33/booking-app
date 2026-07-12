import type { CommandResult } from './command-completion.types.js';
import {
  handleApproveAgentTaskLogic,
  handleListAgentTasksLogic,
  handleRebookAllFromAgentTaskLogic,
  handleRetryAgentStepLogic,
  handleUndoLatestAgentTaskLogic,
  type AgentOpsLogicDeps,
} from './ai-agent-ops.logic.js';

export type AgentOpsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId?: string;
};

export type AgentOpsLogicDispatchHandler = (
  deps: AgentOpsLogicDeps,
  ctx: AgentOpsDispatchContext,
) => Promise<CommandResult>;

export function buildAgentOpsLogicDispatchMap(): ReadonlyMap<
  string,
  AgentOpsLogicDispatchHandler
> {
  const map = new Map<string, AgentOpsLogicDispatchHandler>();

  map.set('list_agent_tasks', async (deps, ctx) =>
    handleListAgentTasksLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('rebook_all_from_agent_task', async (deps, ctx) =>
    handleRebookAllFromAgentTaskLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId ?? '',
    ),
  );
  map.set('undo_latest_agent_task', async (deps, ctx) =>
    handleUndoLatestAgentTaskLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params.confirmed === true,
    ),
  );
  map.set('approve_agent_task', async (deps, ctx) =>
    handleApproveAgentTaskLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId ?? '',
    ),
  );
  map.set('retry_agent_step', async (deps, ctx) =>
    handleRetryAgentStepLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.userId ?? '',
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiAgentOpsService (ai-cmd-ext-0.5). */
export const AGENT_OPS_LOGIC_DISPATCH_MAP = buildAgentOpsLogicDispatchMap();
