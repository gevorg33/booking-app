import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainSlotNoLongerAvailableLogic,
  type ExplainSlotNoLongerAvailableLogicDeps,
  type RefreshAvailabilityRunner,
} from './ai-explain-slot-no-longer-available.logic.js';

@Injectable()
export class AiExplainSlotNoLongerAvailableService {
  private readonly deps: ExplainSlotNoLongerAvailableLogicDeps;

  constructor(@InjectRepository(Business) businessRepo: Repository<Business>) {
    this.deps = { businessRepo };
  }

  handleExplainSlotNoLongerAvailable(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    refreshAvailability?: RefreshAvailabilityRunner,
  ): Promise<CommandResult> {
    return handleExplainSlotNoLongerAvailableLogic(
      this.deps,
      businessId,
      params,
      prompt,
      refreshAvailability,
    );
  }
}
