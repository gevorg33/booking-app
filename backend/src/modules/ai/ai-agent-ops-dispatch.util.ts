import type { CommandResult } from './command-completion.types.js';
import {
  AGENT_OPS_LOGIC_DISPATCH_MAP,
  type AgentOpsDispatchContext,
  type AgentOpsLogicDispatchHandler,
} from './ai-agent-ops-dispatch.build.js';
import type { AgentOpsLogicDeps } from './ai-agent-ops.logic.js';

export function getAgentOpsLogicDispatchHandler(
  action: string,
): AgentOpsLogicDispatchHandler | undefined {
  return AGENT_OPS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchAgentOpsLogicIntent(
  deps: AgentOpsLogicDeps,
  ctx: AgentOpsDispatchContext,
): Promise<CommandResult | null> {
  const handler = AGENT_OPS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function agentOpsDispatchMapHas(action: string): boolean {
  return AGENT_OPS_LOGIC_DISPATCH_MAP.has(action);
}
