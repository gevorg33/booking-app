import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { isHipaaModeActive } from '../../common/utils/business-compliance.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  AiCommandTrace,
  type AiCommandFailureSignal,
  type AiCommandTraceOutcome,
} from './entities/ai-command-trace.entity.js';
import type { AiCommandSurface } from './ai-platform.util.js';
import { AiPromptSimilarityService } from './ai-prompt-similarity.service.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { exportEscalationAnalyticsFromRows } from './ai-escalation-analytics.util.js';
import { buildAccuracyExitGateFromAnalytics } from './ai-accuracy-exit-gate.util.js';
import { AiEvalHarvestService } from './ai-eval-harvest.service.js';
import {
  buildClarifyEvalLabelCandidateFromPair,
} from './ai-clarify-quality.util.js';
import { findClarifyAutoQueueCandidatesOnTraceWrite } from './ai-n99-clarify-quality.util.js';
import { AgentTask } from '../../engine/agent/agent-task.entity.js';
import {
  aggregateTraceAccuracyAnalytics,
  buildAiCommandTracePayload,
  CLARIFY_ABANDON_WINDOW_MS,
  exportConfusionMatrixFromRows,
  exportWorstPromptsEvalDrafts,
  exportWorstPromptsFromRows,
  exportAccuracySloFromRows,
  extractTaskIdFromResult,
  isClarifyAbandonCandidate,
  isClarifyContinuation,
  isClarifyFollowUpSuccess,
  isRetryCandidateOutcome,
  isUndoCorrectionCandidate,
  isWithinUndoWindow,
  isWrongExecutionCandidate,
  PROMPT_SIMILARITY_THRESHOLD,
  RETRY_WINDOW_MS,
  UNDO_WINDOW_MS,
  traceEntityToAnalyticsRow,
  type AiCommandTraceFeedbackInput,
  type AiCommandTraceRecordInput,
  type AiTraceAnalyticsRow,
  normalizeFeedbackReason,
} from './ai-command-trace.util.js';
import type {
  AiAccuracyAnalyticsSummary,
  AiAccuracySloExport,
  AiConfusionMatrixExport,
  AiWorstPromptsEvalExport,
  AiWorstPromptsExport,
} from './ai-platform.util.js';

export interface MarkWrongExecutionFromUndoParams {
  businessId: string;
  userId?: string;
  traceId?: string;
  /** Prefer the trace nearest this agent-task completion time (acc-1.6). */
  anchorTime?: Date;
}

export interface RecordAiCommandTraceParams {
  traceId: string;
  businessId: string;
  surface: AiCommandSurface;
  userId?: string;
  role?: string;
  rawPrompt: string;
  normalizedPrompt?: string;
  result: CommandResult | Record<string, unknown>;
  startedAtMs: number;
  locationId?: string;
  abVariantId?: string;
  businessSettings?: Record<string, unknown>;
  routingTier?: string;
  model?: string;
  tokenCost?: number;
}

@Injectable()
export class AiCommandTraceService {
  private readonly logger = new Logger(AiCommandTraceService.name);

  constructor(
    @InjectRepository(AiCommandTrace)
    private readonly traceRepo: Repository<AiCommandTrace>,
    @InjectRepository(AgentTask)
    private readonly agentTaskRepo: Repository<AgentTask>,
    private readonly promptSimilarity: AiPromptSimilarityService,
    private readonly entityMemory: AiEntityMemoryService,
    @Inject(forwardRef(() => AiEvalHarvestService))
    private readonly evalHarvest: AiEvalHarvestService,
  ) {}

  async recordTrace(params: RecordAiCommandTraceParams): Promise<void> {
    try {
      const hipaaMode = isHipaaModeActive(params.businessSettings);
      const latencyMs = Math.max(0, Date.now() - params.startedAtMs);
      const payload = buildAiCommandTracePayload({
        traceId: params.traceId,
        businessId: params.businessId,
        surface: params.surface,
        userId: params.userId,
        role: params.role,
        rawPrompt: params.rawPrompt,
        normalizedPrompt: params.normalizedPrompt,
        result: params.result,
        latencyMs,
        locationId: params.locationId,
        abVariantId: params.abVariantId,
        hipaaMode,
        routingTier: params.routingTier,
        model: params.model,
        tokenCost: params.tokenCost,
      } satisfies AiCommandTraceRecordInput);

      const saved = await this.traceRepo.save(this.traceRepo.create(payload));
      if (payload.outcome === 'executed') {
        await this.linkAgentTaskCommandTrace(
          params.businessId,
          params.traceId,
          extractTaskIdFromResult(params.result),
        );
      }
      await this.detectRetryRephrase({
        businessId: params.businessId,
        surface: params.surface,
        userId: params.userId,
        rawPrompt: params.rawPrompt,
        newAction: payload.action,
        newTraceId: params.traceId,
      });
      await this.detectUndoCorrection({
        businessId: params.businessId,
        surface: params.surface,
        userId: params.userId,
        newAction: payload.action,
        newTraceId: params.traceId,
      });
      await this.abandonSupersededClarifyTraces({
        businessId: params.businessId,
        surface: params.surface,
        userId: params.userId,
        newTraceId: params.traceId,
        newAction: payload.action,
        newOutcome: payload.outcome,
      });
      await this.autoQueueBadClarifyOutcomes({
        businessId: params.businessId,
        surface: params.surface,
        userId: params.userId,
        newTrace: saved,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record AI command trace ${params.traceId}: ${String(error)}`,
      );
    }
  }

  private async detectRetryRephrase(params: {
    businessId: string;
    surface: AiCommandSurface;
    userId?: string;
    rawPrompt: string;
    newAction: string;
    newTraceId: string;
  }): Promise<void> {
    const since = new Date(Date.now() - RETRY_WINDOW_MS);
    const recent = await this.traceRepo.find({
      where: {
        businessId: params.businessId,
        surface: params.surface,
        ...(params.userId ? { userId: params.userId } : {}),
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
      take: 8,
    });

    const candidates = recent.filter(
      (prior) =>
        prior.traceId !== params.newTraceId &&
        isRetryCandidateOutcome(prior.outcome),
    );
    if (!candidates.length) return;

    const similarities = await this.promptSimilarity.scoreAgainstPriorPrompts(
      params.businessId,
      params.userId,
      params.surface,
      params.rawPrompt,
      candidates.map((prior) => prior.rawPrompt),
    );

    for (let i = 0; i < candidates.length; i += 1) {
      if (similarities[i] < PROMPT_SIMILARITY_THRESHOLD) continue;
      const prior = candidates[i];
      prior.failureSignal = 'suspected_miss';
      prior.correctedAction = params.newAction;
      await this.traceRepo.save(prior);
      void this.entityMemory.learnFromCorrection(
        params.businessId,
        prior.rawPrompt,
        params.newAction,
        params.surface,
        prior.action,
      );
      break;
    }
  }

  private async detectUndoCorrection(params: {
    businessId: string;
    surface: AiCommandSurface;
    userId?: string;
    newAction: string;
    newTraceId: string;
  }): Promise<void> {
    const since = new Date(Date.now() - RETRY_WINDOW_MS);
    const recent = await this.traceRepo.find({
      where: {
        businessId: params.businessId,
        surface: params.surface,
        ...(params.userId ? { userId: params.userId } : {}),
        failureSignal: 'wrong_execution',
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const undone = recent.find(
      (prior) =>
        prior.traceId !== params.newTraceId &&
        isUndoCorrectionCandidate(
          {
            failureSignal: prior.failureSignal,
            correctedAction: prior.correctedAction,
            action: prior.action,
            outcome: prior.outcome,
          },
          params.newAction,
        ),
    );
    if (!undone) return;

    undone.correctedAction = params.newAction;
    await this.traceRepo.save(undone);
    void this.entityMemory.learnFromCorrection(
      params.businessId,
      undone.rawPrompt,
      params.newAction,
      params.surface,
      undone.action,
    );
  }

  async markClarifyAbandoned(
    traceId: string,
    businessId: string,
  ): Promise<{ ok: true; flagged: boolean }> {
    const trace = await this.requireTrace(traceId, businessId);
    if (!isClarifyAbandonCandidate(trace.outcome, trace.failureSignal)) {
      return { ok: true, flagged: false };
    }
    trace.failureSignal = 'clarify_abandoned';
    await this.traceRepo.save(trace);
    const candidate = buildClarifyEvalLabelCandidateFromPair({
      clarify: traceEntityToAnalyticsRow(trace),
      outcome: 'abandon',
    });
    if (candidate) {
      await this.evalHarvest.upsertHarvestCandidate(businessId, candidate);
    }
    return { ok: true, flagged: true };
  }

  private async autoQueueBadClarifyOutcomes(params: {
    businessId: string;
    surface: AiCommandSurface;
    userId?: string;
    newTrace: AiCommandTrace;
  }): Promise<void> {
    try {
      const since = new Date(Date.now() - CLARIFY_ABANDON_WINDOW_MS);
      const recentClarifies = await this.traceRepo.find({
        where: {
          businessId: params.businessId,
          surface: params.surface,
          ...(params.userId ? { userId: params.userId } : {}),
          outcome: 'clarified',
          createdAt: MoreThan(since),
        },
        order: { createdAt: 'DESC' },
        take: 8,
      });

      const candidates = findClarifyAutoQueueCandidatesOnTraceWrite({
        newTrace: params.newTrace,
        recentClarifies: recentClarifies.filter(
          (row) => row.traceId !== params.newTrace.traceId,
        ),
      });

      for (const entry of candidates) {
        await this.evalHarvest.upsertHarvestCandidate(params.businessId, entry);
      }
    } catch (error) {
      this.logger.warn(
        `Clarify auto-queue failed for ${params.newTrace.traceId}: ${String(error)}`,
      );
    }
  }

  private async abandonSupersededClarifyTraces(params: {
    businessId: string;
    surface: AiCommandSurface;
    userId?: string;
    newTraceId: string;
    newAction: string;
    newOutcome: AiCommandTraceOutcome;
  }): Promise<void> {
    const since = new Date(Date.now() - CLARIFY_ABANDON_WINDOW_MS);
    const pending = await this.traceRepo.find({
      where: {
        businessId: params.businessId,
        surface: params.surface,
        ...(params.userId ? { userId: params.userId } : {}),
        outcome: 'clarified',
        failureSignal: IsNull(),
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    for (const prior of pending) {
      if (prior.traceId === params.newTraceId) continue;
      if (
        isClarifyFollowUpSuccess(
          prior.action,
          params.newOutcome,
          params.newAction,
        )
      ) {
        continue;
      }
      if (
        isClarifyContinuation(prior.action, params.newOutcome, params.newAction)
      ) {
        continue;
      }
      prior.failureSignal = 'clarify_abandoned';
      await this.traceRepo.save(prior);
    }
  }

  async recordFeedback(
    traceId: string,
    businessId: string,
    input: AiCommandTraceFeedbackInput,
  ): Promise<void> {
    const trace = await this.requireTrace(traceId, businessId);
    trace.feedbackRating = input.rating;
    trace.feedbackReason = normalizeFeedbackReason(input.reason);
    if (input.rating === 'down' && !trace.failureSignal) {
      trace.failureSignal = 'suspected_miss';
    }
    await this.traceRepo.save(trace);
  }

  async markWrongExecutionFromUndo(
    params: MarkWrongExecutionFromUndoParams,
  ): Promise<{ ok: true; flagged: boolean; traceId?: string }> {
    if (params.traceId) {
      return this.flagTraceWrongExecution(params.businessId, params.traceId);
    }

    const since = new Date(Date.now() - UNDO_WINDOW_MS);
    const recent = await this.traceRepo.find({
      where: {
        businessId: params.businessId,
        ...(params.userId ? { userId: params.userId } : {}),
        outcome: 'executed',
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (!recent.length) {
      return { ok: true, flagged: false };
    }

    const trace = params.anchorTime
      ? recent.reduce((best, row) => {
          const rowDiff = Math.abs(
            row.createdAt.getTime() - params.anchorTime!.getTime(),
          );
          const bestDiff = Math.abs(
            best.createdAt.getTime() - params.anchorTime!.getTime(),
          );
          return rowDiff < bestDiff ? row : best;
        })
      : recent[0];

    if (!isWrongExecutionCandidate(trace.outcome, trace.failureSignal, trace.createdAt)) {
      return { ok: true, flagged: false };
    }

    trace.failureSignal = 'wrong_execution';
    await this.traceRepo.save(trace);
    return { ok: true, flagged: true, traceId: trace.traceId };
  }

  private async flagTraceWrongExecution(
    businessId: string,
    traceId: string,
  ): Promise<{ ok: true; flagged: boolean; traceId?: string }> {
    const trace = await this.requireTrace(traceId, businessId);
    if (!isWrongExecutionCandidate(trace.outcome, trace.failureSignal, trace.createdAt)) {
      return { ok: true, flagged: false };
    }
    trace.failureSignal = 'wrong_execution';
    await this.traceRepo.save(trace);
    return { ok: true, flagged: true, traceId: trace.traceId };
  }

  private async linkAgentTaskCommandTrace(
    businessId: string,
    traceId: string,
    taskId?: string,
  ): Promise<void> {
    if (!taskId) return;
    try {
      const task = await this.agentTaskRepo.findOne({
        where: { id: taskId, businessId },
      });
      if (!task) return;
      task.context = { ...(task.context ?? {}), _traceId: traceId };
      await this.agentTaskRepo.save(task);
    } catch (error) {
      this.logger.warn(
        `Failed to link command trace ${traceId} to agent task ${taskId}: ${String(error)}`,
      );
    }
  }

  async getAccuracyAnalytics(
    businessId: string,
    periodDays = 30,
  ): Promise<AiAccuracyAnalyticsSummary> {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    const analytics = aggregateTraceAccuracyAnalytics(rows, periodDays);
    return {
      ...analytics,
      exitGate: buildAccuracyExitGateFromAnalytics(analytics, rows),
    };
  }

  async exportWorstPrompts(
    businessId: string,
    periodDays = 30,
    limit = 50,
  ): Promise<AiWorstPromptsExport> {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    return exportWorstPromptsFromRows(rows, periodDays, limit);
  }

  async exportWorstPromptsForEval(
    businessId: string,
    periodDays = 30,
    limit = 50,
  ): Promise<AiWorstPromptsEvalExport> {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    return exportWorstPromptsEvalDrafts(rows, businessId, periodDays, limit);
  }

  async exportConfusionMatrix(
    businessId: string,
    periodDays = 30,
    limit = 25,
  ): Promise<AiConfusionMatrixExport> {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    return exportConfusionMatrixFromRows(rows, periodDays, limit);
  }

  async exportAccuracySlo(
    businessId: string,
    periodDays = 30,
  ): Promise<AiAccuracySloExport> {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    return exportAccuracySloFromRows(rows);
  }

  /** acc-6.7 — escalation rate + recent handoffs for weekly triage. */
  async exportEscalationAnalytics(
    businessId: string,
    periodDays = 7,
    recentLimit = 10,
  ) {
    const rows = await this.loadTraceAnalyticsRows(businessId, periodDays);
    return exportEscalationAnalyticsFromRows(rows, periodDays, recentLimit);
  }

  async loadTraceAnalyticsRowsForEval(
    businessId: string,
    periodDays = 7,
  ): Promise<AiTraceAnalyticsRow[]> {
    return this.loadTraceAnalyticsRows(businessId, periodDays);
  }

  private async loadTraceAnalyticsRows(
    businessId: string,
    periodDays: number,
  ): Promise<AiTraceAnalyticsRow[]> {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - periodDays);

    const traces = await this.traceRepo.find({
      where: {
        businessId,
        createdAt: MoreThan(start),
      },
      order: { createdAt: 'DESC' },
      take: 10000,
    });

    return traces.map((trace) => traceEntityToAnalyticsRow(trace));
  }

  private async requireTrace(
    traceId: string,
    businessId: string,
  ): Promise<AiCommandTrace> {
    const trace = await this.traceRepo.findOne({
      where: { traceId, businessId },
    });
    if (!trace) {
      throw new NotFoundException(`AI command trace ${traceId} not found`);
    }
    return trace;
  }
}
