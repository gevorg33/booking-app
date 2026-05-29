import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';

interface MemoryExtractResult {
  aliases?: Record<string, EntityMemoryEntry>;
  reasoning?: string;
}

@Injectable()
export class AiEntityMemoryService {
  private readonly logger = new Logger(AiEntityMemoryService.name);

  constructor(
    private openAi: OpenAiGatewayService,
    private aiSettings: AiSettingsService,
  ) {}

  /** Inject learned defaults into classifier context. */
  async buildMemoryContextBlock(businessId: string): Promise<string> {
    const memory = await this.aiSettings.getEntityMemory(businessId);
    const entries = Object.entries(memory.aliases ?? {});
    if (entries.length === 0) return '';

    const lines = entries.slice(0, 20).map(([alias, e]) => {
      const parts: string[] = [];
      if (e.employeeName) parts.push(`provider=${e.employeeName}`);
      if (e.serviceName) parts.push(`service=${e.serviceName}`);
      if (e.customerName) parts.push(`customer=${e.customerName}`);
      if (e.templateName) parts.push(`template=${e.templateName}`);
      return `"${alias}" → ${parts.join(', ') || '—'}`;
    });

    return `Learned entity defaults for this business (use when user mentions alias):\n${lines.join('\n')}`;
  }

  /** After a successful command, LLM extracts aliases to remember. */
  async learnFromCommand(
    businessId: string,
    prompt: string,
    action: string,
    resolved: Record<string, unknown>,
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
        surface: 'dashboard',
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
    const memory = await this.aiSettings.getEntityMemory(businessId);
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
