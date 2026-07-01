import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleExplainRtlLayoutLogic } from './ai-explain-rtl-layout.logic.js';

@Injectable()
export class AiExplainRtlLayoutService {
  handleExplainRtlLayout(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainRtlLayoutLogic(businessId, params, prompt);
  }
}
