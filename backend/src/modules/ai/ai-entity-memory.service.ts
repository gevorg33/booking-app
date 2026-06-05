import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { formatEntityMemoryContextBlock } from './ai-entity-memory.util.js';
import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';

interface MemoryExtractResult {
  aliases?: Record<string, EntityMemoryEntry>;
  reasoning?: string;
}

@Injectable()
export class AiEntityMemoryService {
  private readonly logger = new Logger(AiEntityMemoryService.name);

  private readonly openAi: OpenAiGatewayService;
  private readonly aiSettings: AiSettingsService;

  constructor(openAi: OpenAiGatewayService, aiSettings: AiSettingsService) {
    this.openAi = openAi;
    this.aiSettings = aiSettings;
  }

  async getEntityMemory(businessId: string): Promise<EntityMemory> {
    return this.aiSettings.getEntityMemory(businessId);
  }

  /** Inject learned defaults into classifier context. */
  async buildMemoryContextBlock(businessId: string): Promise<string> {
    const memory = await this.getEntityMemory(businessId);
    return formatEntityMemoryContextBlock(memory);
  }

  /** After a successful command, LLM extracts aliases to remember. */
  async learnFromCommand(
    businessId: string,
    prompt: string,
    action: string,
    resolved: Record<string, unknown>,
    surface: 'dashboard' | 'provider_mobile' = 'dashboard',
  ): Promise<void> {
    if (!(await this.openAi.isAvailableForBusiness(businessId))) return;

    const system = `You maintain per-business entity memory for a booking system.
Given a user command and resolved entities, extract short aliases the user might reuse (e.g. "Gevorg" → provider name, "body massage" → service name).
Return JSON: { "aliases": { "alias_lower": { "employeeName": string|null, "serviceName": string|null, "customerName": string|null, "templateName": string|null } }, "reasoning": string }
Only add aliases clearly implied. Max 3 new aliases per turn.`;

    const user = JSON.stringify({ prompt, action, resolved });

    const result = await this.openAi.completeJson<MemoryExtractResult>(
      {
        businessId,
        surface,
        operation: 'entity_memory_learn',
        actorType: 'system',
      },
      system,
      user,
      { maxTokens: 400 },
    );

    if (!result?.aliases || Object.keys(result.aliases).length === 0) return;

    await this.aiSettings.mergeEntityMemory(businessId, result.aliases);
    this.logger.debug(`Entity memory updated: ${Object.keys(result.aliases).join(', ')}`);
  }

  /** LLM resolves ambiguous mention using memory + catalog. */
  async resolveMention(
    businessId: string,
    mention: string,
    catalogSummary: string,
  ): Promise<EntityMemoryEntry | null> {
    const memory = await this.getEntityMemory(businessId);
    const direct = memory.aliases?.[mention.toLowerCase().trim()];
    if (direct) return direct;

    if (!(await this.openAi.isAvailableForBusiness(businessId))) return null;

    const system = `Match a user mention to business entities using memory and catalog.
Return JSON: { "employeeName": string|null, "serviceName": string|null, "customerName": string|null, "templateName": string|null, "confidence": number }`;

    const user = JSON.stringify({
      mention,
      memory: memory.aliases,
      catalog: catalogSummary,
    });

    const result = await this.openAi.completeJson<EntityMemoryEntry & { confidence?: number }>(
      {
        businessId,
        surface: 'dashboard',
        operation: 'entity_memory_resolve',
        actorType: 'system',
      },
      system,
      user,
      { maxTokens: 300 },
    );

    if (!result || (result.confidence ?? 0) < 0.6) return null;
    return result;
  }
}
