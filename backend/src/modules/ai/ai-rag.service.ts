import { Injectable } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service.js';
import { resolveRagContextFromSettings } from './ai-rag.util.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiSemanticPhrasingBankService } from './ai-semantic-phrasing-bank.service.js';
import { AiClassificationFewShotService } from './ai-classification-fewshot.service.js';
import type {
  BuildClassifierAppendixInput,
  ClassificationSurface,
  FewShotExample,
} from './ai-classification-engine.types.js';
import type { EntityMemory } from './ai-settings.types.js';
import {
  isFewShotRetrievalEnabledByDefault,
  prioritizeRarePhrasingFewShots,
  resolveFewShotRetrievalLimit,
} from './ai-n99-fewshot-retrieval.util.js';

@Injectable()
export class AiRagService {
  constructor(
    private readonly aiSettings: AiSettingsService,
    private readonly semanticIntent: AiSemanticIntentService,
    private readonly phrasingBank: AiSemanticPhrasingBankService,
    private readonly fewShotRetriever: AiClassificationFewShotService,
  ) {}

  async buildRagContextBlock(
    businessId: string,
    prompt: string,
  ): Promise<string> {
    const settings = await this.aiSettings.getSettings(businessId);
    return resolveRagContextFromSettings(settings, prompt);
  }

  /** acc-3.12 — warm canonical + eval phrasing bank embeddings once. */
  warmSemanticPhrasingIndex(
    businessId: string,
    surface?: ClassificationSurface,
  ) {
    return this.phrasingBank.warmEmbeddingIndex(businessId, surface);
  }

  getSemanticPhrasingBankStats(surface?: ClassificationSurface) {
    return this.phrasingBank.getIndexStats(surface);
  }

  getSemanticPhrasingBank(surface?: ClassificationSurface) {
    return this.phrasingBank.getPhraseBank(surface);
  }

  /** n99-2.4 / acc-3.1 — top-K labeled cases injected into classify appendix by default. */
  async retrieveClassificationFewShots(
    input: BuildClassifierAppendixInput,
  ): Promise<FewShotExample[]> {
    if (!isFewShotRetrievalEnabledByDefault()) {
      return [];
    }
    const limit = resolveFewShotRetrievalLimit(input);
    const retrieved = await this.fewShotRetriever.retrieveForClassifierAppendix(
      input,
      limit,
    );
    return prioritizeRarePhrasingFewShots(
      retrieved,
      input.prompt,
      input.surface,
      limit,
    );
  }

  /** Warm embedding index for classify few-shot retrieval (acc-3.1). */
  warmClassificationFewShotIndex(
    businessId: string,
    prompt: string,
    surface: ClassificationSurface,
  ) {
    return this.retrieveClassificationFewShots({
      businessId,
      prompt,
      surface,
    });
  }

  /** acc-3.11 — semantic intent rescue via shared embedding index. */
  matchSemanticIntent(
    businessId: string,
    prompt: string,
    surface: ClassificationSurface,
    entityMemory?: EntityMemory,
  ) {
    return this.semanticIntent.matchIntent({
      businessId,
      prompt,
      surface,
      entityMemory,
    });
  }
}
