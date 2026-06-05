import { Injectable } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service.js';
import { resolveRagContextFromSettings } from './ai-rag.util.js';

@Injectable()
export class AiRagService {
  private readonly aiSettings: AiSettingsService;

  constructor(aiSettings: AiSettingsService) {
    this.aiSettings = aiSettings;
  }

  async buildRagContextBlock(businessId: string, prompt: string): Promise<string> {
    const settings = await this.aiSettings.getSettings(businessId);
    return resolveRagContextFromSettings(settings, prompt);
  }
}
