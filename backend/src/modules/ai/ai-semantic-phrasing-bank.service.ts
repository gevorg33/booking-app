import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { chunkTexts } from './ai-classification-fewshot.util.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import type {
  ClassificationSurface,
  SemanticPhraseEntry,
} from './ai-classification-engine.types.js';
import type { BusinessParaphraseEntry } from './ai-settings.types.js';
import { businessParaphrasesToSemanticEntries } from './ai-business-paraphrase.util.js';
import { SEMANTIC_EMBEDDING_BATCH_SIZE } from './ai-semantic-intent.fixtures.js';
import {
  buildSemanticPhrasingBank,
  summarizeSemanticPhrasingBank,
} from './ai-semantic-phrasing-bank.util.js';

export interface SemanticPhrasingIndexStats {
  phraseCount: number;
  embeddedCount: number;
  indexWarmed: boolean;
  byLocale: Record<string, number>;
  bySource: Record<string, number>;
}

@Injectable()
export class AiSemanticPhrasingBankService {
  private readonly logger = new Logger(AiSemanticPhrasingBankService.name);
  private readonly embeddingByPhraseId = new Map<string, number[]>();
  private readonly normalizedPhraseById = new Map<string, string>();
  private indexWarmed = false;

  constructor(
    private readonly openAi: OpenAiGatewayService,
    private readonly promptNormalization: AiPromptNormalizationService,
  ) {}

  getPhraseBank(
    surface?: ClassificationSurface,
    businessParaphrases: BusinessParaphraseEntry[] = [],
  ): SemanticPhraseEntry[] {
    return buildSemanticPhrasingBank(
      surface,
      businessParaphrasesToSemanticEntries(businessParaphrases, surface),
    );
  }

  getBankSummary(surface?: ClassificationSurface) {
    return summarizeSemanticPhrasingBank(this.getPhraseBank(surface));
  }

  getEmbeddingsById(): ReadonlyMap<string, number[]> {
    return this.embeddingByPhraseId;
  }

  getEmbedding(phraseId: string): number[] | undefined {
    return this.embeddingByPhraseId.get(phraseId);
  }

  /** acc-3.12 — embed full phrasing bank once (canonical + eval rows). */
  async warmEmbeddingIndex(
    businessId: string,
    surface?: ClassificationSurface,
    businessParaphrases: BusinessParaphraseEntry[] = [],
  ): Promise<SemanticPhrasingIndexStats> {
    const bank = this.getPhraseBank(surface, businessParaphrases);
    const missing = bank.filter((entry) => !this.embeddingByPhraseId.has(entry.id));

    if (missing.length > 0) {
      for (const batch of chunkTexts(missing, SEMANTIC_EMBEDDING_BATCH_SIZE)) {
        const normalizedTexts = await Promise.all(
          batch.map((entry) =>
            this.normalizePhraseForIndex(businessId, entry.phrase),
          ),
        );

        const vectors = await this.embedTexts(
          businessId,
          batch[0]?.surface ?? 'dashboard',
          normalizedTexts,
        );
        if (!vectors) {
          this.logger.warn(
            `Semantic phrasing bank embedding index unavailable for business=${businessId}`,
          );
          break;
        }

        for (let i = 0; i < batch.length; i += 1) {
          const vector = vectors[i];
          const entry = batch[i];
          if (!vector || !entry) continue;
          this.embeddingByPhraseId.set(entry.id, vector);
          this.normalizedPhraseById.set(entry.id, normalizedTexts[i] ?? entry.phrase);
        }
      }
    }

    if (this.embeddingByPhraseId.size > 0) {
      this.indexWarmed = true;
    }

    return this.getIndexStats(surface);
  }

  async normalizePromptForMatch(
    businessId: string,
    prompt: string,
  ): Promise<string> {
    const trimmed = prompt.trim();
    if (!trimmed) return trimmed;
    const normalized = await this.promptNormalization.normalizeForClassifier(
      businessId,
      undefined,
      trimmed,
    );
    return normalized.normalized.trim() || trimmed;
  }

  getIndexStats(surface?: ClassificationSurface): SemanticPhrasingIndexStats {
    const summary = this.getBankSummary(surface);
    const bank = this.getPhraseBank(surface);
    const embeddedInBank = bank.filter((entry) =>
      this.embeddingByPhraseId.has(entry.id),
    ).length;

    return {
      phraseCount: summary.total,
      embeddedCount: embeddedInBank,
      indexWarmed: this.indexWarmed && embeddedInBank === summary.total,
      byLocale: summary.byLocale,
      bySource: summary.bySource,
    };
  }

  private async normalizePhraseForIndex(
    businessId: string,
    phrase: string,
  ): Promise<string> {
    return this.normalizePromptForMatch(businessId, phrase);
  }

  private async embedTexts(
    businessId: string,
    surface: ClassificationSurface,
    texts: string[],
  ): Promise<number[][] | null> {
    if (texts.length === 0) return [];
    const usageSurface =
      surface === 'provider'
        ? 'provider_mobile'
        : surface === 'public'
          ? 'public_booking'
          : surface;

    return this.openAi.createEmbeddings(
      {
        businessId,
        surface: usageSurface,
        operation: 'semantic_phrasing_bank_index',
        actorType: 'system',
      },
      texts,
    );
  }
}
