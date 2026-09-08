import { Injectable } from '@nestjs/common';
import { LocationsService } from '../locations/locations.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateLocationLogic,
  handleUpdateLocationLogic,
  type LocationsLogicDeps,
} from './ai-locations.logic.js';
import { dispatchLocationsLogicIntent } from './ai-locations-dispatch.util.js';
import type { LocationsDispatchContext } from './ai-locations-dispatch.build.js';

@Injectable()
export class AiLocationsService {
  private readonly deps: LocationsLogicDeps;

  constructor(locationsService: LocationsService) {
    this.deps = { locationsService };
  }

  /** The business's active locations. e2e-bug.460 — the rescue chain needs a
   *  positive place test, and `rescue()` is synchronous, so this is loaded up
   *  front with the rest of the catalog rather than fetched mid-decision. */
  listLocations(businessId: string) {
    return this.deps.locationsService.findAll(businessId);
  }

  handleCreateLocation(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateLocationLogic(this.deps, businessId, params);
  }

  handleUpdateLocation(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateLocationLogic(this.deps, businessId, params);
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a locations intent. */
  dispatchIntent(ctx: LocationsDispatchContext): Promise<CommandResult | null> {
    return dispatchLocationsLogicIntent(this.deps, ctx);
  }
}
