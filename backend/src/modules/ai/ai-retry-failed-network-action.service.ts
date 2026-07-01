import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { handleRetryFailedNetworkActionLogic } from './ai-retry-failed-network-action.logic.js';

@Injectable()
export class AiRetryFailedNetworkActionService {
  handleRetryFailedNetworkAction(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleRetryFailedNetworkActionLogic(businessId, params, prompt);
  }
}
