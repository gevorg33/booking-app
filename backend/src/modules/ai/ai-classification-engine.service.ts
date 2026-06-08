import { Injectable } from '@nestjs/common';
import type {
  BuildClassifierAppendixInput,
  ClassificationEngineAppendix,
  EnrichClassificationInput,
  EnrichedClassification,
} from './ai-classification-engine.types.js';
import { AiClassificationSelfCheckService } from './ai-classification-selfcheck.service.js';
import { AiClassificationEscalationService } from './ai-classification-escalation.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import {
  buildClassifierAppendix,
  enrichClassifiedIntent,
  matchSemanticIntent,
} from './ai-classification-engine.util.js';
import { attachFieldConfidenceMetadata } from './ai-classification-field-confidence.util.js';

@Injectable()
export class AiClassificationEngineService {
  constructor(
    private readonly rag: AiRagService,
    private readonly selfCheck: AiClassificationSelfCheckService,
    private readonly escalation: AiClassificationEscalationService,
    private readonly semanticIntent: AiSemanticIntentService,
  ) {}

  async buildClassifierAppendix(
    input: BuildClassifierAppendixInput,
  ): Promise<ClassificationEngineAppendix> {
    const fewShots = await this.rag.retrieveClassificationFewShots(input);
    return buildClassifierAppendix(input, fewShots);
  }

  async enrichClassification(
    input: EnrichClassificationInput,
  ): Promise<EnrichedClassification> {
    const enriched = await enrichClassifiedIntent(
      {
        ...input,
        semanticMatcher: async (matcherInput) =>
          this.semanticIntent.matchIntent({
            businessId: matcherInput.businessId ?? input.businessId ?? 'unknown',
            prompt: matcherInput.prompt,
            surface: matcherInput.surface,
            entityMemory: matcherInput.entityMemory,
          }),
      },
      async (enrichInput, intent) =>
        this.selfCheck.verifyClassification({
          ...enrichInput,
          intent,
        }),
    );

    const withTieBreaker = await this.escalation.applyTieBreakerIfNeeded(
      input,
      enriched,
    );
    if (withTieBreaker.tieBreaker) {
      const reverified = await this.selfCheck.verifyClassification({
        ...input,
        intent: withTieBreaker.intent,
        skipLlmSelfCheck: true,
      });
      withTieBreaker.intent.confidence = reverified.confidence;
      withTieBreaker.intent.params = withTieBreaker.intent.params ?? {};
      attachFieldConfidenceMetadata(
        input.prompt,
        input.surface,
        withTieBreaker.intent,
        reverified.fieldConfidence,
      );
      withTieBreaker.verification = reverified;
      if (!reverified.ok) {
        withTieBreaker.intent.params._classificationNeedsClarify = true;
        withTieBreaker.intent.params._classificationVerifyReasons =
          reverified.reasons;
      } else {
        delete withTieBreaker.intent.params._classificationNeedsClarify;
        delete withTieBreaker.intent.params._classificationVerifyReasons;
      }
    }

    return withTieBreaker;
  }

  matchSemanticIntentLexical(
    prompt: string,
    surface: EnrichClassificationInput['surface'],
    entityMemory?: EnrichClassificationInput['entityMemory'],
  ) {
    return matchSemanticIntent(prompt, surface, { entityMemory });
  }

  matchSemanticIntentEmbedding(
    businessId: string,
    prompt: string,
    surface: EnrichClassificationInput['surface'],
    entityMemory?: EnrichClassificationInput['entityMemory'],
  ) {
    return this.semanticIntent.matchIntent({
      businessId,
      prompt,
      surface,
      entityMemory,
    });
  }
}
