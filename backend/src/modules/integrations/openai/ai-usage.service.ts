import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AiUsageLog } from '../entities/ai-usage-log.entity.js';
import {
  AiActorType,
  AiCallContext,
  AiKeySource,
  AiUsageSummary,
  AiUsageSurface,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_OPENAI_MODEL,
} from './openai.types.js';

/** OpenAI list pricing (USD per 1M tokens) — platform-key billing estimates only */
const MODEL_PRICING: Record<
  string,
  { inputPer1M: number; outputPer1M: number }
> = {
  [DEFAULT_OPENAI_MODEL]: { inputPer1M: 0.15, outputPer1M: 0.6 },
  'gpt-5.4-mini': { inputPer1M: 0.75, outputPer1M: 4.5 },
  'gpt-5.4-mini-2026-03-17': { inputPer1M: 0.75, outputPer1M: 4.5 },
};

/** Embedding models bill input tokens only (pipe-1.4.2). */
const EMBEDDING_MODEL_PRICING: Record<string, { inputPer1M: number }> = {
  [DEFAULT_EMBEDDING_MODEL]: { inputPer1M: 0.02 },
  'text-embedding-3-large': { inputPer1M: 0.13 },
  'text-embedding-ada-002': { inputPer1M: 0.1 },
};

export function isEmbeddingModel(model: string): boolean {
  return model.startsWith('text-embedding');
}

@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsageLog) private usageRepo: Repository<AiUsageLog>,
  ) {}

  estimateCostUsd(
    model: string,
    promptTokens: number,
    completionTokens: number,
    keySource: AiKeySource,
  ): number {
    if (keySource !== 'platform') return 0;

    if (isEmbeddingModel(model)) {
      const pricing =
        EMBEDDING_MODEL_PRICING[model] ??
        EMBEDDING_MODEL_PRICING[DEFAULT_EMBEDDING_MODEL];
      return Number(
        ((promptTokens / 1_000_000) * pricing.inputPer1M).toFixed(6),
      );
    }

    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_OPENAI_MODEL];
    const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputPer1M;
    return Number((inputCost + outputCost).toFixed(6));
  }

  async recordUsage(params: {
    context: AiCallContext;
    model: string;
    promptTokens: number;
    completionTokens: number;
    keySource: AiKeySource;
  }): Promise<void> {
    const { context, model, promptTokens, completionTokens, keySource } =
      params;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = this.estimateCostUsd(
      model,
      promptTokens,
      completionTokens,
      keySource,
    );

    await this.usageRepo.save(
      this.usageRepo.create({
        businessId: context.businessId,
        userId: context.userId ?? null,
        actorType: context.actorType,
        surface: context.surface,
        operation: context.operation,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd: estimatedCostUsd.toFixed(6),
        keySource,
      }),
    );
  }

  async getMonthlySummary(businessId: string): Promise<AiUsageSummary> {
    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    const logs = await this.usageRepo.find({
      where: {
        businessId,
        createdAt: Between(periodStart, periodEnd),
      },
      order: { createdAt: 'DESC' },
    });

    const bySurfaceMap = new Map<
      AiUsageSurface,
      { requests: number; totalTokens: number; platformCostUsd: number }
    >();
    const byActorMap = new Map<
      AiActorType,
      { requests: number; totalTokens: number }
    >();

    let promptTokens = 0;
    let completionTokens = 0;
    let estimatedPlatformCostUsd = 0;

    for (const log of logs) {
      promptTokens += log.promptTokens;
      completionTokens += log.completionTokens;
      estimatedPlatformCostUsd += Number(log.estimatedCostUsd);

      const surfaceEntry = bySurfaceMap.get(log.surface) ?? {
        requests: 0,
        totalTokens: 0,
        platformCostUsd: 0,
      };
      surfaceEntry.requests += 1;
      surfaceEntry.totalTokens += log.totalTokens;
      surfaceEntry.platformCostUsd += Number(log.estimatedCostUsd);
      bySurfaceMap.set(log.surface, surfaceEntry);

      const actorEntry = byActorMap.get(log.actorType) ?? {
        requests: 0,
        totalTokens: 0,
      };
      actorEntry.requests += 1;
      actorEntry.totalTokens += log.totalTokens;
      byActorMap.set(log.actorType, actorEntry);
    }

    return {
      period: 'month',
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      totalRequests: logs.length,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedPlatformCostUsd: Number(estimatedPlatformCostUsd.toFixed(6)),
      bySurface: [...bySurfaceMap.entries()].map(([surface, stats]) => ({
        surface,
        ...stats,
        platformCostUsd: Number(stats.platformCostUsd.toFixed(6)),
      })),
      byActorType: [...byActorMap.entries()].map(([actorType, stats]) => ({
        actorType,
        ...stats,
      })),
    };
  }
}
