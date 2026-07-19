import type { CommandResult } from './command-completion.types.js';
import {
  SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP,
  type ScheduleResourcesDispatchContext,
  type ScheduleResourcesLogicDispatchHandler,
} from './ai-schedule-resources-dispatch.build.js';
import type { Sprint29ScheduleResourceLogicDeps } from './ai-schedule-resources.logic.js';

export function getScheduleResourcesLogicDispatchHandler(
  action: string,
): ScheduleResourcesLogicDispatchHandler | undefined {
  return SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchScheduleResourcesLogicIntent(
  deps: Sprint29ScheduleResourceLogicDeps,
  ctx: ScheduleResourcesDispatchContext,
): Promise<CommandResult | null> {
  const handler = SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function scheduleResourcesDispatchMapHas(action: string): boolean {
  return SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP.has(action);
}
