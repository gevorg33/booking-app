import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  buildMultilingualClassifierContext,
  needsMultilingualNormalization,
} from './ai-prompt-i18n.js';
import {
  buildNormalizationClassifierContext,
  normalizePromptForClassifier,
} from './ai-prompt-normalization.util.js';

/** passthrough = English; multilingual = hy/ru/translit handled directly by classify_intent */
export type PromptNormalizationMethod = 'passthrough' | 'multilingual';

export interface PromptNormalizationResult {
  original: string;
  normalized: string;
  method: PromptNormalizationMethod;
  classifierContext: string | null;
  expansions: string[];
}

const CACHE_MAX = 512;

@Injectable()
export class AiPromptNormalizationService {
  private readonly cache = new Map<string, PromptNormalizationResult>();

  async normalizeForClassifier(
    businessId: string,
    _userId: string | undefined,
    prompt: string,
  ): Promise<PromptNormalizationResult> {
    const original = prompt.trim();
    if (!original) {
      return {
        original: '',
        normalized: '',
        method: 'passthrough',
        classifierContext: null,
        expansions: [],
      };
    }

    if (!needsMultilingualNormalization(original)) {
      const normalizedUpgrade = normalizePromptForClassifier(original);
      return {
        original,
        normalized: normalizedUpgrade.normalized,
        method: 'passthrough',
        classifierContext: buildNormalizationClassifierContext(
          normalizedUpgrade.expansions,
        ),
        expansions: normalizedUpgrade.expansions,
      };
    }

    const cacheKey = `${businessId}:${hashPrompt(original)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const result: PromptNormalizationResult = {
      original,
      normalized: original,
      method: 'multilingual',
      classifierContext: buildMultilingualClassifierContext(
        original,
        original,
        'multilingual',
      ),
      expansions: [],
    };
    const normalizedUpgrade = normalizePromptForClassifier(original);
    if (normalizedUpgrade.expansions.length > 0) {
      result.normalized = normalizedUpgrade.normalized;
      result.expansions = normalizedUpgrade.expansions;
      result.classifierContext = [
        result.classifierContext,
        buildNormalizationClassifierContext(normalizedUpgrade.expansions),
      ]
        .filter(Boolean)
        .join('\n');
    }

    this.putCache(cacheKey, result);
    return result;
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
