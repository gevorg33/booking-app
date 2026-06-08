import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { AiCommandSurface } from './ai-platform.util.js';
import {
  computePromptSimilarity,
  cosineSimilarity,
} from './ai-command-trace.util.js';

const EMBEDDING_CACHE_MAX = 256;

@Injectable()
export class AiPromptSimilarityService {
  private readonly embeddingCache = new Map<string, number[]>();

  constructor(private readonly openAi: OpenAiGatewayService) {}

  /**
   * acc-1.4 — embedding cosine similarity with lexical Jaccard fallback when OpenAI is unavailable.
   */
  async scoreAgainstPriorPrompts(
    businessId: string,
    userId: string | undefined,
    surface: AiCommandSurface,
    newPrompt: string,
    priorPrompts: string[],
  ): Promise<number[]> {
    if (!priorPrompts.length) return [];

    const embeddings = await this.embedPrompts(
      businessId,
      userId,
      surface,
      newPrompt,
      priorPrompts,
    );
    if (embeddings) {
      const [newEmbedding, ...priorEmbeddings] = embeddings;
      return priorEmbeddings.map((priorEmbedding) =>
        cosineSimilarity(newEmbedding, priorEmbedding),
      );
    }

    return priorPrompts.map((prior) =>
      computePromptSimilarity(prior, newPrompt),
    );
  }

  private async embedPrompts(
    businessId: string,
    userId: string | undefined,
    surface: AiCommandSurface,
    newPrompt: string,
    priorPrompts: string[],
  ): Promise<number[][] | null> {
    const ordered = [newPrompt, ...priorPrompts];
    const resolved: number[][] = [];
    const missingIndexes: number[] = [];
    const missingTexts: string[] = [];

    for (let i = 0; i < ordered.length; i += 1) {
      const text = ordered[i];
      const cacheKey = hashPrompt(text);
      const cached = this.embeddingCache.get(cacheKey);
      if (cached) {
        resolved[i] = cached;
      } else {
        missingIndexes.push(i);
        missingTexts.push(text);
      }
    }

    if (missingTexts.length) {
      const usageSurface =
        surface === 'provider'
          ? 'provider_mobile'
          : surface === 'public'
            ? 'public_booking'
            : surface;
      const fetched = await this.openAi.createEmbeddings(
        {
          businessId,
          surface: usageSurface,
          operation: 'retry_rephrase_similarity',
          actorType: userId ? 'manager' : 'system',
          userId,
        },
        missingTexts,
      );
      if (!fetched) return null;

      for (let j = 0; j < missingIndexes.length; j += 1) {
        const index = missingIndexes[j];
        const embedding = fetched[j];
        if (!embedding) return null;
        resolved[index] = embedding;
        this.putEmbeddingCache(hashPrompt(ordered[index]), embedding);
      }
    }

    return ordered.map((_, index) => resolved[index]);
  }

  private putEmbeddingCache(key: string, embedding: number[]): void {
    if (this.embeddingCache.size >= EMBEDDING_CACHE_MAX) {
      const first = this.embeddingCache.keys().next().value;
      if (first) this.embeddingCache.delete(first);
    }
    this.embeddingCache.set(key, embedding);
  }
}

function hashPrompt(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}
