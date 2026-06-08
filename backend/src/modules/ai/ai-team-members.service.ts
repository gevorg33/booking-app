import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { TeamMembersService } from '../business/team-members.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleUpdateTeamMemberRoleLogic,
  type TeamMembersLogicDeps,
} from './ai-team-members.logic.js';

@Injectable()
export class AiTeamMembersService {
  private readonly deps: TeamMembersLogicDeps;

  constructor(
    teamMembersService: TeamMembersService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
  ) {
    this.deps = { teamMembersService, businessRepo };
  }

  async handleUpdateTeamMemberRole(
    businessId: string,
    requesterId: string | undefined,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleUpdateTeamMemberRoleLogic(
      this.deps,
      businessId,
      requesterId,
      params,
    );
  }
}
