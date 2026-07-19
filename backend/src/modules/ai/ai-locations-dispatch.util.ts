import type { CommandResult } from './command-completion.types.js';
import {
  LOCATIONS_LOGIC_DISPATCH_MAP,
  type LocationsDispatchContext,
  type LocationsLogicDispatchHandler,
} from './ai-locations-dispatch.build.js';
import type { LocationsLogicDeps } from './ai-locations.logic.js';

export function getLocationsLogicDispatchHandler(
  action: string,
): LocationsLogicDispatchHandler | undefined {
  return LOCATIONS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchLocationsLogicIntent(
  deps: LocationsLogicDeps,
  ctx: LocationsDispatchContext,
): Promise<CommandResult | null> {
  const handler = LOCATIONS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function locationsDispatchMapHas(action: string): boolean {
  return LOCATIONS_LOGIC_DISPATCH_MAP.has(action);
}
