import { Injectable } from '@nestjs/common';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import { handleConfigureWhatsappIntegrationLogic } from './ai-whatsapp-integration.logic.js';
import { rescueConfigureWhatsappIntegrationIntent } from './ai-whatsapp-integration.util.js';

@Injectable()
export class AiWhatsappIntegrationService {
  constructor(
    private readonly whatsappIntegrationService: WhatsAppIntegrationService,
  ) {}

  rescueWhatsappIntegrationIntent(prompt: string, action: string) {
    return rescueConfigureWhatsappIntegrationIntent(prompt, action);
  }

  handleConfigureWhatsappIntegration(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: this.whatsappIntegrationService },
      businessId,
      params,
      prompt,
    );
  }
}
