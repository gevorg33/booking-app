import type { CommandResult } from './command-completion.types.js';
import {
  INTEGRATIONS_LOGIC_DISPATCH_MAP,
  type IntegrationsDispatchContext,
  type IntegrationsLogicDispatchHandler,
} from './ai-integrations-dispatch.build.js';
import type { IntegrationsLogicDeps } from './ai-integrations.logic.js';

export function getIntegrationsLogicDispatchHandler(
  action: string,
): IntegrationsLogicDispatchHandler | undefined {
  return INTEGRATIONS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchIntegrationsLogicIntent(
  deps: IntegrationsLogicDeps,
  ctx: IntegrationsDispatchContext,
): Promise<CommandResult | null> {
  const handler = INTEGRATIONS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function integrationsDispatchMapHas(action: string): boolean {
  return INTEGRATIONS_LOGIC_DISPATCH_MAP.has(action);
}
