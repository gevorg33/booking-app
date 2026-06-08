import { Injectable } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type {
  ClassificationSurface,
  SemanticIntentMatch,
} from './ai-classification-engine.types.js';
import type { EntityMemory } from './ai-settings.types.js';
import { AiSemanticPhrasingBankService } from './ai-semantic-phrasing-bank.service.js';
import {
  SEMANTIC_EMBEDDING_MIN_SCORE,
  SEMANTIC_LEXICAL_CANDIDATE_LIMIT,
} from './ai-semantic-intent.fixtures.js';
import {
  buildSemanticIntentMatch,
  matchSemanticIntentLexical,
  rankSemanticPhrasesByEmbedding,
  rankSemanticPhrasesLexical,
  resolveSemanticPhraseSource,
} from './ai-semantic-intent.util.js';
import { matchBusinessLearnedParaphrase } from './ai-business-paraphrase.util.js';

export interface SemanticIntentMatchInput {
  businessId: string;
  prompt: string;
  surface: ClassificationSurface;
  entityMemory?: EntityMemory;
  threshold?: number;
}

@Injectable()
export class AiSemanticIntentService {
  constructor(
    private readonly openAi: OpenAiGatewayService,
    private readonly phrasingBank: AiSemanticPhrasingBankService,
  ) {}

  /** acc-3.11 — embed prompt and cosine-match canonical + eval paraphrase bank. */
  async matchIntent(
    input: SemanticIntentMatchInput,
  ): Promise<SemanticIntentMatch | null> {
    const normalizedPrompt = await this.phrasingBank.normalizePromptForMatch(
      input.businessId,
      input.prompt,
    );
    const paraphrases = input.entityMemory?.paraphrases ?? [];

    const businessLearned = matchBusinessLearnedParaphrase(
      normalizedPrompt,
      paraphrases,
      input.surface,
    );
    if (businessLearned) return businessLearned;

    const bank = this.phrasingBank.getPhraseBank(input.surface, paraphrases);

    const lexicalFallback = matchSemanticIntentLexical(
      normalizedPrompt,
      input.surface,
      {
        entityMemory: input.entityMemory,
        threshold: input.threshold,
        bank,
      },
    );

    await this.phrasingBank.warmEmbeddingIndex(
      input.businessId,
      input.surface,
      paraphrases,
    );

    const lexicalCandidates = rankSemanticPhrasesLexical(
      normalizedPrompt,
      bank,
      SEMANTIC_LEXICAL_CANDIDATE_LIMIT,
    );
    const candidatePool = lexicalCandidates.length
      ? lexicalCandidates.map((row) => row.entry)
      : bank;

    const queryEmbeddings = await this.embedQuery(
      input.businessId,
      input.surface,
      normalizedPrompt,
    );
    if (!queryEmbeddings?.[0]) {
      return lexicalFallback;
    }

    const ranked = rankSemanticPhrasesByEmbedding({
      queryEmbedding: queryEmbeddings[0],
      pool: candidatePool,
      embeddingsById: this.phrasingBank.getEmbeddingsById(),
      limit: 1,
      minScore: input.threshold ?? SEMANTIC_EMBEDDING_MIN_SCORE,
    });

    const best = ranked[0];
    if (!best) {
      return lexicalFallback;
    }

    const embeddingMatch = buildSemanticIntentMatch(
      best.entry,
      best.score,
      'embedding',
    );

    if (
      lexicalFallback &&
      (lexicalFallback.source === 'business_alias' ||
        lexicalFallback.source === 'business_learned') &&
      lexicalFallback.confidence >= embeddingMatch.confidence
    ) {
      return lexicalFallback;
    }

    if (lexicalFallback && lexicalFallback.confidence > embeddingMatch.confidence) {
      const lexicalEntry = bank.find(
        (entry) => entry.id === lexicalFallback.matchedPhraseId,
      );
      if (
        lexicalEntry &&
        resolveSemanticPhraseSource(lexicalEntry) !== 'canonical'
      ) {
        return lexicalFallback;
      }
    }

    return embeddingMatch;
  }

  getPhrasingBankService(): AiSemanticPhrasingBankService {
    return this.phrasingBank;
  }

  private async embedQuery(
    businessId: string,
    surface: ClassificationSurface,
    prompt: string,
  ): Promise<number[][] | null> {
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
        operation: 'semantic_intent_match',
        actorType: 'system',
      },
      [prompt],
    );
  }
}
