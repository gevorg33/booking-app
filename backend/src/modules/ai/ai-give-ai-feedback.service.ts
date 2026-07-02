import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleGiveAiFeedbackLogic } from './ai-give-ai-feedback.logic.js';

@Injectable()
export class AiGiveAiFeedbackService {
  handleGiveAiFeedback(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleGiveAiFeedbackLogic(businessId, params, prompt);
  }
}
