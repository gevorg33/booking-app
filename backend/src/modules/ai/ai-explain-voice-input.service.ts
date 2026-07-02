import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleExplainVoiceInputLogic } from './ai-explain-voice-input.logic.js';

@Injectable()
export class AiExplainVoiceInputService {
  handleExplainVoiceInput(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainVoiceInputLogic(businessId, params, prompt);
  }
}
