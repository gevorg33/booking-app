import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AgentTask } from '../../engine/agent/agent-task.entity.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { CommandResult } from './command-completion.types.js';
import { AiEventsService } from './ai-events.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import {
  executeHumanHandoffLogic,
  shouldExecuteHumanHandoff,
} from './ai-escalation-handoff.logic.js';

@Injectable()
export class AiEscalationHandoffService {
  constructor(
    @InjectRepository(AgentTask)
    private readonly agentTaskRepo: Repository<AgentTask>,
    private readonly aiEvents: AiEventsService,
    private readonly integrations: AiIntegrationsService,
    private readonly aiSettings: AiSettingsService,
  ) {}

  shouldExecute(prompt: string, sessionContext?: Record<string, unknown>): boolean {
    return shouldExecuteHumanHandoff(prompt, sessionContext);
  }

  async execute(input: {
    businessId: string;
    surface: ClassificationSurface;
    sessionContext?: Record<string, unknown>;
    userId?: string;
    customerId?: string;
    prompt?: string;
    actorEmail?: string;
    actorName?: string;
  }): Promise<CommandResult> {
    const settings = await this.aiSettings.getSettings(input.businessId);
    return executeHumanHandoffLogic(
      {
        agentTaskRepo: this.agentTaskRepo,
        aiEvents: this.aiEvents,
        integrations: this.integrations,
        settings,
      },
      input,
    );
  }
}
