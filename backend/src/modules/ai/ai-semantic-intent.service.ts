import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { getIntentAnchorBank } from './intent-anchor.bank.js';
import type {
  IntentAnchor,
  SemanticIntentMatch,
  SemanticIntentMatchOptions,
} from './ai-semantic-intent.types.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  rankAnchorsEmbedding,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
  SEMANTIC_MATCH_THRESHOLD,
  shouldUseDeterministicSemanticFallback,
} from './ai-semantic-intent.util.js';
import { isSemanticStealProtectedPrompt } from './semantic-steal-guard.util.js';
import { commandSurfaceToAiUsageSurface } from './ai-usage-surface.util.js';

/** pipe-1.4.3 — pre-embed anchor bank; cosine-match prompt vs anchors at runtime. */
export const SEMANTIC_INTENT_EMBEDDING_PIPE_MARKER = 'pipe-1.4.3';

@Injectable()
export class AiSemanticIntentService implements OnModuleInit {
  private readonly logger = new Logger(AiSemanticIntentService.name);
  private embeddingWarmup: Promise<void> | null = null;

  constructor(
    private readonly openAi: OpenAiGatewayService,
    private readonly rag: AiRagService,
    private readonly promptNormalization: AiPromptNormalizationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const bank = getIntentAnchorBank();
    this.rag.registerSemanticAnchors(bank);
    await this.ensureAnchorEmbeddings('bootstrap', undefined, bank);
  }

  private async ensureAnchorEmbeddings(
    businessId: string,
    userId: string | undefined,
    anchors: IntentAnchor[] = getIntentAnchorBank(),
  ): Promise<void> {
    if (
      shouldUseDeterministicSemanticFallback(
        await this.hasEmbeddingApi(businessId),
      )
    ) {
      return;
    }
    if (this.rag.semanticAnchorEmbeddedCount() >= anchors.length) return;
    if (this.embeddingWarmup) {
      await this.embeddingWarmup;
      return;
    }

    this.embeddingWarmup = this.warmAnchorEmbeddings(
      businessId,
      userId,
      anchors,
    );
    try {
      await this.embeddingWarmup;
    } finally {
      this.embeddingWarmup = null;
    }
  }

  private async warmAnchorEmbeddings(
    businessId: string,
    userId: string | undefined,
    anchors: IntentAnchor[],
  ): Promise<void> {
    this.rag.registerSemanticAnchors(anchors);
    for (const anchor of anchors) {
      if (this.rag.hasSemanticAnchorEmbedding(anchor.id)) continue;

      const embedding = await this.openAi.embedText(
        {
          businessId,
          surface: 'dashboard',
          operation: 'semantic_intent_anchor',
          actorType: 'system',
          userId,
        },
        anchor.phrase,
      );
      if (embedding) {
        this.rag.setSemanticAnchorEmbedding(anchor.id, embedding);
      }
    }
    this.logger.log(
      `Semantic intent anchors embedded: ${this.rag.semanticAnchorEmbeddedCount()}/${anchors.length}`,
    );
  }

  private async hasEmbeddingApi(businessId: string): Promise<boolean> {
    return this.openAi.isAvailableForBusiness(businessId);
  }

  async match(
    options: SemanticIntentMatchOptions,
  ): Promise<SemanticIntentMatch | null> {
    const rawPrompt = options.prompt.trim();
    if (!rawPrompt) return null;

    if (isSemanticStealProtectedPrompt(rawPrompt)) {
      return null;
    }

    const prompt = await this.resolveMatchPrompt(options, rawPrompt);

    const bank = getIntentAnchorBank();
    const anchors = filterAnchorsForSurface(
      bank,
      options.surface,
      options.allowedActions,
      options.lastAction,
    );
    if (anchors.length === 0) return null;

    const hasApi = await this.hasEmbeddingApi(options.businessId);
    const useDeterministic = shouldUseDeterministicSemanticFallback(hasApi);

    if (useDeterministic) {
      const ranked = rankAnchorsDeterministic(prompt, anchors);
      return resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_CONCEPT_THRESHOLD,
      });
    }

    await this.ensureAnchorEmbeddings(options.businessId, options.userId, bank);

    const promptEmbedding = await this.embedPromptForMatch(options, prompt);
    if (!promptEmbedding) {
      const ranked = rankAnchorsDeterministic(prompt, anchors);
      return resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_CONCEPT_THRESHOLD,
      });
    }

    return this.cosineMatchPromptToAnchors(
      prompt,
      promptEmbedding,
      bank,
      anchors,
      options,
    );
  }

  private async embedPromptForMatch(
    options: SemanticIntentMatchOptions,
    prompt: string,
  ): Promise<number[] | null> {
    return this.openAi.embedText(
      {
        businessId: options.businessId,
        surface: commandSurfaceToAiUsageSurface(options.surface),
        operation: 'semantic_intent_match',
        actorType: 'system',
        userId: options.userId,
      },
      prompt,
    );
  }

  /** Cosine similarity: prompt embedding vs pre-embedded anchor vectors (pipe-1.4.3). */
  private cosineMatchPromptToAnchors(
    prompt: string,
    promptEmbedding: number[],
    bank: IntentAnchor[],
    anchors: IntentAnchor[],
    options: SemanticIntentMatchOptions,
  ): SemanticIntentMatch | null {
    const indexHits = this.rag.searchSemanticAnchors(promptEmbedding, {
      surface: options.surface,
      allowedActions: options.allowedActions,
      minScore: SEMANTIC_MATCH_THRESHOLD * 0.9,
      limit: 5,
    });

    if (indexHits.length > 0) {
      const anchorById = new Map(bank.map((anchor) => [anchor.id, anchor]));
      const ranked = indexHits
        .map((hit) => {
          const anchor = anchorById.get(hit.id);
          if (!anchor) return null;
          return { anchor, score: hit.score };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      const fromIndex = resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_MATCH_THRESHOLD,
      });
      if (fromIndex) return fromIndex;
    }

    const anchorEmbeddings = new Map<string, number[]>();
    for (const entry of this.rag.getSemanticAnchorEntries()) {
      if (entry.embedding?.length) {
        anchorEmbeddings.set(entry.id, entry.embedding);
      }
    }

    const ranked = rankAnchorsEmbedding(
      prompt,
      promptEmbedding,
      anchors,
      anchorEmbeddings,
    );
    return resolveSemanticMatch(ranked, {
      threshold: SEMANTIC_MATCH_THRESHOLD,
    });
  }

  private async resolveMatchPrompt(
    options: SemanticIntentMatchOptions,
    rawPrompt: string,
  ): Promise<string> {
    const preNormalized = options.normalizedPrompt?.trim();
    if (preNormalized) return preNormalized;

    const norm = await this.promptNormalization.normalizeForClassifier(
      options.businessId,
      options.userId,
      rawPrompt,
    );
    return norm.normalized.trim() || rawPrompt;
  }

  /** Test helper — rank without OpenAI. */
  matchDeterministic(
    prompt: string,
    anchors: IntentAnchor[] = getIntentAnchorBank(),
  ): SemanticIntentMatch | null {
    const ranked = rankAnchorsDeterministic(prompt, anchors);
    return resolveSemanticMatch(ranked, {
      threshold: SEMANTIC_CONCEPT_THRESHOLD,
    });
  }
}
