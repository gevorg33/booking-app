import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { FewShotExample } from './ai-classification-engine.types.js';
import type { BuildClassifierAppendixInput } from './ai-classification-engine.types.js';
import {
  AiEvalLabelQueue,
  type AiEvalLabelOutcome,
} from './entities/ai-eval-label-queue.entity.js';
import { buildEvalCaseFromLabelQueueItem } from './eval/ai-eval-label.util.js';
import {
  DEFAULT_FEWSHOT_LIMIT,
  FEWSHOT_BUSINESS_PRIORITY_SLOTS,
  FEWSHOT_EMBEDDING_BATCH_SIZE,
  FEWSHOT_MIN_EMBEDDING_SCORE,
  chunkTexts,
  evalCaseToFewShotExample,
  filterFewShotPoolBySurface,
  getDefaultGlobalFewShotPool,
  harvestedCasesForBusiness,
  mergeFewShotRetrievalResults,
  rankFewShotExamplesByEmbedding,
  retrieveFewShotExamplesByTokenOverlap,
  type FewShotRetrievalExample,
  type RetrieveFewShotInput,
} from './ai-classification-fewshot.util.js';

@Injectable()
export class AiClassificationFewShotService {
  private readonly logger = new Logger(AiClassificationFewShotService.name);
  private globalPool: FewShotRetrievalExample[] | null = null;
  private readonly embeddingByExampleId = new Map<string, number[]>();

  constructor(
    private readonly openAi: OpenAiGatewayService,
    @InjectRepository(AiEvalLabelQueue)
    private readonly labelQueueRepo: Repository<AiEvalLabelQueue>,
  ) {}

  /** acc-3.1 — embed prompt and retrieve top-K similar labeled eval cases. */
  async retrieveFewShotExamples(
    input: RetrieveFewShotInput,
  ): Promise<FewShotExample[]> {
    const limit = input.limit ?? DEFAULT_FEWSHOT_LIMIT;
    const globalPool = filterFewShotPoolBySurface(
      this.getGlobalPool(),
      input.surface,
    );
    const businessPool = filterFewShotPoolBySurface(
      [
        ...(input.businessExamples ?? []),
        ...(await this.loadBusinessFewShotExamples(input.businessId)),
      ],
      input.surface,
    );
    const combinedPool = [...businessPool, ...globalPool];

    if (combinedPool.length === 0) return [];

    const lexicalCandidateLimit = Math.max((input.limit ?? DEFAULT_FEWSHOT_LIMIT) * 8, 24);
    const lexicalCandidates = retrieveFewShotExamplesByTokenOverlap(
      input.prompt,
      input.surface,
      combinedPool,
      lexicalCandidateLimit,
    );
    const candidatePool =
      lexicalCandidates.length > 0
        ? lexicalCandidates
        : combinedPool.slice(0, lexicalCandidateLimit);

    const queryEmbedding = await this.embedTexts(input.businessId, input.surface, [
      input.prompt,
    ]);
    if (!queryEmbedding?.[0]) {
      return retrieveFewShotExamplesByTokenOverlap(
        input.prompt,
        input.surface,
        combinedPool,
        limit,
      );
    }

    await this.ensureExampleEmbeddings(
      input.businessId,
      input.surface,
      candidatePool,
    );

    const businessCandidates = candidatePool.filter(
      (entry) => entry.source === 'business',
    );
    const globalCandidates = candidatePool.filter(
      (entry) => entry.source !== 'business',
    );

    const businessRanked = rankFewShotExamplesByEmbedding({
      queryEmbedding: queryEmbedding[0],
      pool: businessCandidates,
      embeddingsById: this.embeddingByExampleId,
      limit: Math.max(limit, FEWSHOT_BUSINESS_PRIORITY_SLOTS),
      minScore: FEWSHOT_MIN_EMBEDDING_SCORE - 0.08,
    }).map((row) => row.example);

    const globalRanked = rankFewShotExamplesByEmbedding({
      queryEmbedding: queryEmbedding[0],
      pool: globalCandidates,
      embeddingsById: this.embeddingByExampleId,
      limit,
      minScore: FEWSHOT_MIN_EMBEDDING_SCORE,
    }).map((row) => row.example);

    const merged = mergeFewShotRetrievalResults(
      businessRanked,
      globalRanked,
      limit,
    );
    if (merged.length > 0) return merged;

    return retrieveFewShotExamplesByTokenOverlap(
      input.prompt,
      input.surface,
      combinedPool,
      limit,
    );
  }

  async retrieveForClassifierAppendix(
    input: BuildClassifierAppendixInput,
    limit = DEFAULT_FEWSHOT_LIMIT,
  ): Promise<FewShotExample[]> {
    return this.retrieveFewShotExamples({
      businessId: input.businessId,
      prompt: input.prompt,
      surface: input.surface,
      limit,
    });
  }

  private getGlobalPool(): FewShotRetrievalExample[] {
    if (!this.globalPool) {
      this.globalPool = getDefaultGlobalFewShotPool();
      this.logger.log(
        `Loaded ${this.globalPool.length} global few-shot examples from acc-2 eval corpus`,
      );
    }
    return this.globalPool;
  }

  private async loadBusinessFewShotExamples(
    businessId: string,
  ): Promise<FewShotRetrievalExample[]> {
    const harvestedModule = require('./eval/ai-command-eval.harvested.cases.js') as {
      AI_COMMAND_EVAL_HARVESTED_CASES: import('./eval/ai-command-eval.types.js').AiCommandEvalCase[];
    };
    const fixtureCases = harvestedCasesForBusiness(
      businessId,
      harvestedModule.AI_COMMAND_EVAL_HARVESTED_CASES,
    );
    const rows = await this.labelQueueRepo.find({
      where: {
        businessId,
        status: In(['labeled', 'exported']),
      },
      order: { labeledAt: 'DESC', failureCount: 'DESC', createdAt: 'DESC' },
      take: 120,
    });

    const fromQueue = rows
      .filter((row) => this.isQueueRowFewShotEligible(row))
      .map((row) =>
        evalCaseToFewShotExample(
          buildEvalCaseFromLabelQueueItem(row, businessId),
          'business',
          businessId,
        ),
      )
      .filter((entry): entry is FewShotRetrievalExample => entry !== null);

    return [...fromQueue, ...fixtureCases];
  }

  private isQueueRowFewShotEligible(row: AiEvalLabelQueue): boolean {
    if ((row.labelOutcome as AiEvalLabelOutcome) === 'clarify') {
      return false;
    }
    return Boolean(
      row.expectedRescuedAction ??
        row.expectedAction ??
        row.correctedAction ??
        row.classifiedAction,
    );
  }

  private async ensureExampleEmbeddings(
    businessId: string,
    surface: RetrieveFewShotInput['surface'],
    examples: FewShotRetrievalExample[],
  ): Promise<void> {
    const missing = examples.filter(
      (entry) => !this.embeddingByExampleId.has(entry.id),
    );
    if (missing.length === 0) return;

    for (const batch of chunkTexts(missing, FEWSHOT_EMBEDDING_BATCH_SIZE)) {
      const vectors = await this.embedTexts(
        businessId,
        surface,
        batch.map((entry) => entry.prompt),
      );
      if (!vectors) {
        this.logger.warn(
          `Few-shot embedding index unavailable for business=${businessId}; using lexical fallback`,
        );
        return;
      }
      for (let i = 0; i < batch.length; i += 1) {
        const vector = vectors[i];
        if (vector) {
          this.embeddingByExampleId.set(batch[i]!.id, vector);
        }
      }
    }
  }

  private async embedTexts(
    businessId: string,
    surface: RetrieveFewShotInput['surface'],
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
        operation: 'classify_fewshot_retrieval',
        actorType: 'system',
      },
      texts,
    );
  }
}
