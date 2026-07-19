import type { CommandResult } from './command-completion.types.js';
import type { AiMetaOpsService } from './ai-meta-ops.service.js';
import {
  META_OPS_DISPATCH_MAP,
  type MetaOpsDispatchContext,
  type MetaOpsDispatchHandler,
} from './ai-meta-ops-dispatch.build.js';

export function getMetaOpsDispatchHandler(
  action: string,
): MetaOpsDispatchHandler | undefined {
  return META_OPS_DISPATCH_MAP.get(action);
}

export async function dispatchMetaOpsIntent(
  service: AiMetaOpsService,
  ctx: MetaOpsDispatchContext,
): Promise<CommandResult | null> {
  const handler = META_OPS_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function metaOpsDispatchMapHas(action: string): boolean {
  return META_OPS_DISPATCH_MAP.has(action);
}
