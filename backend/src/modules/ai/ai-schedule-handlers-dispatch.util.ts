import type { CommandResult } from './command-completion.types.js';
import type { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import {
  SCHEDULE_HANDLERS_DISPATCH_MAP,
  type ScheduleHandlersDispatchContext,
  type ScheduleHandlersDispatchHandler,
} from './ai-schedule-handlers-dispatch.build.js';

export function getScheduleHandlersDispatchHandler(
  action: string,
): ScheduleHandlersDispatchHandler | undefined {
  return SCHEDULE_HANDLERS_DISPATCH_MAP.get(action);
}

export async function dispatchScheduleHandlersIntent(
  service: AiScheduleHandlersService,
  ctx: ScheduleHandlersDispatchContext,
): Promise<CommandResult | null> {
  const handler = SCHEDULE_HANDLERS_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function scheduleHandlersDispatchMapHas(action: string): boolean {
  return SCHEDULE_HANDLERS_DISPATCH_MAP.has(action);
}
