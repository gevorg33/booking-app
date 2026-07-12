import { Injectable } from '@nestjs/common';
import { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import { rescueConfigureOpenaiIntegrationIntent } from './ai-openai-integration.util.js';
import { dispatchOpenaiIntegrationIntent } from './ai-openai-integration-dispatch.util.js';
import type { OpenaiIntegrationDispatchContext } from './ai-openai-integration-dispatch.build.js';

@Injectable()
export class AiOpenaiIntegrationService {
  constructor(
    private readonly openAiIntegrationService: OpenAiIntegrationService,
  ) {}

  rescueOpenaiIntegrationIntent(prompt: string, action: string) {
    return rescueConfigureOpenaiIntegrationIntent(prompt, action);
  }

  handleConfigureOpenaiIntegration(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: this.openAiIntegrationService },
      businessId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not an openai-integration intent. */
  dispatchIntent(
    ctx: OpenaiIntegrationDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchOpenaiIntegrationIntent(this, ctx);
  }
}
