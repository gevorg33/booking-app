import type { CommandResult } from './command-completion.types.js';
import type { AiSchedulingService } from './ai-scheduling.service.js';
import {
  SCHEDULING_DISPATCH_MAP,
  type SchedulingDispatchContext,
  type SchedulingDispatchHandler,
} from './ai-scheduling-dispatch.build.js';

export function getSchedulingDispatchHandler(
  action: string,
): SchedulingDispatchHandler | undefined {
  return SCHEDULING_DISPATCH_MAP.get(action);
}

export async function dispatchSchedulingIntent(
  service: AiSchedulingService,
  ctx: SchedulingDispatchContext,
): Promise<CommandResult | null> {
  const handler = SCHEDULING_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function schedulingDispatchMapHas(action: string): boolean {
  return SCHEDULING_DISPATCH_MAP.has(action);
}
