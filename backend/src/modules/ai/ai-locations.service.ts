import { Injectable } from '@nestjs/common';
import { LocationsService } from '../locations/locations.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateLocationLogic,
  handleUpdateLocationLogic,
  type LocationsLogicDeps,
} from './ai-locations.logic.js';

@Injectable()
export class AiLocationsService {
  private readonly deps: LocationsLogicDeps;

  constructor(locationsService: LocationsService) {
    this.deps = { locationsService };
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
}
