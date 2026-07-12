import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateLocationLogic,
  handleUpdateLocationLogic,
  type LocationsLogicDeps,
} from './ai-locations.logic.js';

export type LocationsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
};

export type LocationsLogicDispatchHandler = (
  deps: LocationsLogicDeps,
  ctx: LocationsDispatchContext,
) => Promise<CommandResult>;

export function buildLocationsLogicDispatchMap(): ReadonlyMap<
  string,
  LocationsLogicDispatchHandler
> {
  const map = new Map<string, LocationsLogicDispatchHandler>();

  map.set('create_location', async (deps, ctx) =>
    handleCreateLocationLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('update_location', async (deps, ctx) =>
    handleUpdateLocationLogic(deps, ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiLocationsService (ai-cmd-ext-0.5). */
export const LOCATIONS_LOGIC_DISPATCH_MAP = buildLocationsLogicDispatchMap();
