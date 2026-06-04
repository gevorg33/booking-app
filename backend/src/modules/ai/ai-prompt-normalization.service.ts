import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  buildMultilingualClassifierContext,
  needsMultilingualNormalization,
} from './ai-prompt-i18n.js';

export type PromptNormalizationMethod = 'passthrough' | 'llm' | 'fallback';

export interface PromptNormalizationResult {
  original: string;
  normalized: string;
  method: PromptNormalizationMethod;
  classifierContext: string | null;
}

const NORMALIZE_SYSTEM = `You normalize salon/spa booking dashboard commands into one concise English line for an intent classifier.

Rules:
- Output ONLY the normalized English command (single line, no quotes, no JSON, no explanation).
- Preserve proper names (staff, customers, services) exactly as spelled in the input.
- Preserve explicit dates and times; use 24-hour HH:mm when a time is given.
- Map operational intent clearly (e.g. show appointments, cancel bookings, book appointment, fill open slots, reschedule, check availability, utilization, waitlist).
- Input may be Armenian, Russian, English, or Latin transliteration of hy/ru words.`;

const CACHE_MAX = 512;

@Injectable()
export class AiPromptNormalizationService {
  private readonly logger = new Logger(AiPromptNormalizationService.name);
  private readonly cache = new Map<string, PromptNormalizationResult>();

  constructor(private readonly openAi: OpenAiGatewayService) {}

  async normalizeForClassifier(
    businessId: string,
    userId: string | undefined,
    prompt: string,
  ): Promise<PromptNormalizationResult> {
    const original = prompt.trim();
    if (!original) {
      return {
        original: '',
        normalized: '',
        method: 'passthrough',
        classifierContext: null,
      };
    }

    if (!needsMultilingualNormalization(original)) {
      return {
        original,
        normalized: original,
        method: 'passthrough',
        classifierContext: null,
      };
    }

    const cacheKey = `${businessId}:${hashPrompt(original)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let normalized = original;
    let method: PromptNormalizationMethod = 'passthrough';

    if (await this.openAi.isAvailableForBusiness(businessId)) {
      const llmText = await this.normalizeWithLlm(businessId, userId, original);
      if (llmText) {
        normalized = llmText;
        method = 'llm';
      } else {
        method = 'fallback';
      }
    } else {
      method = 'fallback';
    }

    const result: PromptNormalizationResult = {
      original,
      normalized,
      method,
      classifierContext: buildMultilingualClassifierContext(original, normalized, method),
    };

    this.putCache(cacheKey, result);
    return result;
  }

  private async normalizeWithLlm(
    businessId: string,
    userId: string | undefined,
    prompt: string,
  ): Promise<string | null> {
    const response = await this.openAi.chatCompletion(
      {
        businessId,
        surface: 'dashboard',
        operation: 'normalize_prompt',
        actorType: 'manager',
        userId,
      },
      {
        messages: [
          { role: 'system', content: NORMALIZE_SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        maxTokens: 200,
      },
    );

    const text = response?.choices[0]?.message?.content?.trim();
    if (!text) {
      this.logger.warn(`Prompt normalization returned empty for business=${businessId}`);
      return null;
    }

    return text.replace(/\s+/g, ' ').trim();
  }

  private putCache(key: string, value: PromptNormalizationResult): void {
    if (this.cache.size >= CACHE_MAX) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, value);
  }
}

function hashPrompt(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 24);
}
