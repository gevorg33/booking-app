import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleSpeakAssistantReplyLogic } from './ai-speak-assistant-reply.logic.js';

@Injectable()
export class AiSpeakAssistantReplyService {
  handleSpeakAssistantReply(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleSpeakAssistantReplyLogic(businessId, params, prompt);
  }
}
