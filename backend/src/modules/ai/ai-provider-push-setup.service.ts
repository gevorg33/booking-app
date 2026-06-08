import { Injectable } from '@nestjs/common';
import { PushService } from '../provider-mobile/push.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  dispatchProviderPushSetupIntent,
  type ProviderPushSetupLogicDeps,
} from './ai-provider-push-setup.logic.js';
import { rescueProviderPushSetupIntent } from './ai-provider-push-setup.util.js';

@Injectable()
export class AiProviderPushSetupService {
  private readonly deps: ProviderPushSetupLogicDeps;

  constructor(pushService: PushService) {
    this.deps = { pushService };
  }

  rescueProviderPushSetupIntent(prompt: string, action: string) {
    return rescueProviderPushSetupIntent(prompt, action);
  }

  handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
  ): Promise<CommandResult | null> {
    return dispatchProviderPushSetupIntent(
      this.deps,
      businessId,
      userId,
      action,
      params,
    );
  }
}
