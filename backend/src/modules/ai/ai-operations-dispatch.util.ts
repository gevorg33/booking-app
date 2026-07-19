import type { CommandResult } from './command-completion.types.js';
import type { AiOperationsService } from './ai-operations.service.js';
import {
  OPERATIONS_DISPATCH_MAP,
  type OperationsDispatchContext,
  type OperationsDispatchHandler,
} from './ai-operations-dispatch.build.js';

export function getOperationsDispatchHandler(
  action: string,
): OperationsDispatchHandler | undefined {
  return OPERATIONS_DISPATCH_MAP.get(action);
}

export async function dispatchOperationsIntent(
  service: AiOperationsService,
  ctx: OperationsDispatchContext,
): Promise<CommandResult | null> {
  const handler = OPERATIONS_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function operationsDispatchMapHas(action: string): boolean {
  return OPERATIONS_DISPATCH_MAP.has(action);
}
