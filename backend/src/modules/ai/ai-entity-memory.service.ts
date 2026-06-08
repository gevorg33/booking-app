import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { formatEntityMemoryContextBlock } from './ai-entity-memory.util.js';
import {
  approveAliasSuggestion,
  mergePendingAliasSuggestions,
} from './ai-alias-suggestion.util.js';
import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';
import { extractDeterministicPhrasingAliases } from './ai-classification-phrasing.util.js';
import { extractClarifyMemoryEntityAliases } from './ai-clarify-answer-reuse.util.js';
import {
  buildBusinessParaphraseEntry,
  mapLearnSurfaceToClassificationSurface,
  mapTraceSurfaceToClassificationSurface,
} from './ai-business-paraphrase.util.js';
import type { AiCommandSurface } from './ai-platform.util.js';

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
    surface: 'dashboard' | 'provider_mobile' | 'customer' | 'public' = 'dashboard',
  ): Promise<void> {
    const clarifyMemory =
      (resolved._clarifyMemory as Record<string, string> | undefined) ??
      undefined;
    const mergedResolved = clarifyMemory
      ? { ...resolved, ...clarifyMemory }
      : resolved;

    const clarifyAliases = clarifyMemory
      ? extractClarifyMemoryEntityAliases(prompt, clarifyMemory)
      : {};
    if (Object.keys(clarifyAliases).length > 0) {
      await this.aiSettings.mergeEntityMemory(businessId, clarifyAliases);
      this.logger.debug(
        `Clarify memory aliases learned: ${Object.keys(clarifyAliases).join(', ')}`,
      );
    }

    const deterministicAliases = extractDeterministicPhrasingAliases(
      prompt,
      mergedResolved,
    );
    if (Object.keys(deterministicAliases).length > 0) {
      await this.aiSettings.mergeEntityMemory(businessId, deterministicAliases);
      this.logger.debug(
        `Phrasing memory learned: ${Object.keys(deterministicAliases).join(', ')}`,
      );
    }

    if (surface !== 'public') {
      await this.learnRecurringParaphrase(businessId, prompt, action, surface);
    }

    if (!(await this.openAi.isAvailableForBusiness(businessId))) return;

    const usageSurface =
      surface === 'public'
        ? 'public_booking'
        : surface === 'provider_mobile'
          ? 'provider_mobile'
          : surface;

    const system = `You maintain per-business entity memory for a booking system.
Given a user command and resolved entities, extract short aliases the user might reuse (e.g. "Gevorg" → provider name, "body massage" → service name).
Return JSON: { "aliases": { "alias_lower": { "employeeName": string|null, "serviceName": string|null, "customerName": string|null, "templateName": string|null } }, "reasoning": string }
Only add aliases clearly implied. Max 3 new aliases per turn.`;

    const user = JSON.stringify({ prompt, action, resolved });

    const result = await this.openAi.completeJson<MemoryExtractResult>(
      {
        businessId,
        surface: usageSurface,
        operation: 'entity_memory_learn',
        actorType: 'system',
      },
      system,
      user,
      { maxTokens: 400 },
    );

    if (!result?.aliases || Object.keys(result.aliases).length === 0) return;

    await this.aiSettings.mergeEntityMemory(businessId, result.aliases);
    this.logger.debug(
      `Entity memory updated: ${Object.keys(result.aliases).join(', ')}`,
    );
  }

  /** acc-3.13 — store prompt→action from trace retry/undo corrections. */
  async learnFromCorrection(
    businessId: string,
    prompt: string,
    correctedAction: string,
    surface: AiCommandSurface | 'dashboard' | 'provider_mobile' | 'customer',
    wrongAction?: string,
  ): Promise<void> {
    if (wrongAction && wrongAction === correctedAction) return;

    const classificationSurface =
      surface === 'provider_mobile' || surface === 'customer' || surface === 'dashboard'
        ? mapLearnSurfaceToClassificationSurface(surface)
        : mapTraceSurfaceToClassificationSurface(surface);

    const entry = buildBusinessParaphraseEntry({
      prompt,
      action: correctedAction,
      surface: classificationSurface,
      source: 'correction',
    });
    if (!entry) return;

    await this.aiSettings.mergeBusinessParaphrases(businessId, [entry]);
    this.logger.debug(
      `Business paraphrase correction learned: ${entry.normalizedPhrase} → ${correctedAction}`,
    );
  }

  private async learnRecurringParaphrase(
    businessId: string,
    prompt: string,
    action: string,
    surface: 'dashboard' | 'provider_mobile' | 'customer',
  ): Promise<void> {
    const entry = buildBusinessParaphraseEntry({
      prompt,
      action,
      surface: mapLearnSurfaceToClassificationSurface(surface),
      source: 'recurring',
    });
    if (!entry) return;

    await this.aiSettings.mergeBusinessParaphrases(businessId, [entry]);
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

    const result = await this.openAi.completeJson<
      EntityMemoryEntry & { confidence?: number }
    >(
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

  /** acc-6.3 — pending alias suggestions for admin approval. */
  async listPendingAliasSuggestions(businessId: string) {
    const memory = await this.getEntityMemory(businessId);
    return memory.pendingAliasSuggestions ?? [];
  }

  async mergeAliasSuggestions(
    businessId: string,
    suggestions: NonNullable<EntityMemory['pendingAliasSuggestions']>,
  ): Promise<EntityMemory> {
    const memory = await this.getEntityMemory(businessId);
    const updated = mergePendingAliasSuggestions(memory, suggestions);
    return this.aiSettings.saveEntityMemory(businessId, updated);
  }

  async approvePendingAliasSuggestion(
    businessId: string,
    suggestionId: string,
  ): Promise<EntityMemory> {
    const memory = await this.getEntityMemory(businessId);
    const updated = approveAliasSuggestion(memory, suggestionId);
    return this.aiSettings.saveEntityMemory(businessId, updated);
  }
}
