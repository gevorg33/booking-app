import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { AiCommandTraceStep } from './entities/ai-command-trace-step.entity.js';
import {
  buildAiCommandTraceRow,
  type RecordAiCommandTraceInput,
} from './ai-command-trace.util.js';
import {
  extractCompoundStepRows,
  type CompoundStepRow,
} from './ai-compound-step-outcome.util.js';
import {
  buildCompletionRateReport,
  type CompletionRateReport,
} from './ai-completion-rate.util.js';
import type { AiCommandTraceSurface } from './entities/ai-command-trace.entity.js';

@Injectable()
export class AiCommandTraceService {
  private readonly logger = new Logger(AiCommandTraceService.name);

  constructor(
    @InjectRepository(AiCommandTrace)
    private readonly traceRepo: Repository<AiCommandTrace>,
    /**
     * Optional so the many specs that construct this service with one
     * repository keep working, and so a deployment that has not run the
     * `ai_command_trace_step` migration degrades to no step rows rather than
     * failing every AI command.
     */
    @Optional()
    @InjectRepository(AiCommandTraceStep)
    private readonly stepRepo?: Repository<AiCommandTraceStep>,
  ) {}

  async record(input: RecordAiCommandTraceInput): Promise<AiCommandTrace> {
    const row = buildAiCommandTraceRow(input);
    return this.traceRepo.save(this.traceRepo.create(row));
  }

  /** Non-blocking persist for gateway hot path (acc-1.2). */
  recordFireAndForget(input: RecordAiCommandTraceInput): void {
    void this.record(input).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to persist ai_command_trace: ${message}`);
    });
    this.recordCompoundStepsFireAndForget(input);
  }

  /**
   * AI-ROADMAP Phase 1 — one row per sub-intent of a compound command.
   *
   * Written independently of the parent trace rather than after it: the parent
   * write is already fire-and-forget, so awaiting it here would put a second
   * round trip on a path that exists precisely to stay off the hot path. The
   * rows are correlated by `trace_id`, which the caller supplies, so they do not
   * need the parent's generated primary key.
   */
  recordCompoundStepsFireAndForget(input: RecordAiCommandTraceInput): void {
    const rows = extractCompoundStepRows(input.result);
    if (rows.length === 0) return;
    void this.recordCompoundSteps({
      traceId: input.traceId,
      businessId: input.businessId,
      surface: input.surface,
      rows,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to persist ai_command_trace_step: ${message}`);
    });
  }

  async recordCompoundSteps(params: {
    traceId?: string;
    businessId: string;
    surface: AiCommandTraceSurface;
    rows: readonly CompoundStepRow[];
  }): Promise<void> {
    if (!this.stepRepo || params.rows.length === 0 || !params.traceId) return;
    await this.stepRepo.insert(
      params.rows.map((row) => ({
        traceId: params.traceId as string,
        businessId: params.businessId,
        surface: params.surface,
        stepIndex: row.stepIndex,
        action: row.action,
        outcome: row.outcome,
        planStepIds: row.planStepIds,
        error: row.error,
      })),
    );
  }

  /**
   * AI-ROADMAP Phase 3 — attach a shadow plan to an already-written trace row.
   *
   * The trace is persisted fire-and-forget as soon as the user's response is
   * ready; the shadow planner finishes later. Updating the same row (rather
   * than inserting a second one) keeps one row per message, so the plan
   * summary and shadow-disagreement views stay accurate without de-duplication.
   */
  async attachPlanFields(
    traceId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await this.traceRepo.update({ traceId }, fields);
  }

  /**
   * AI-ROADMAP §7 — the north-star metric, from the source it was measured on.
   *
   * Deliberately not folded into `AiPlatformService.getCommandAnalytics`: that
   * reads the event store, which cannot reproduce the 64%/27% the roadmap is
   * argued from, and it declares a `targets.completionRate` it never computes.
   * Two numbers called "completion rate" that disagree would be worse than one.
   */
  async getCompletionRate(
    businessId: string,
    periodDays = 30,
  ): Promise<CompletionRateReport> {
    const clampedDays = Math.min(90, Math.max(1, periodDays));
    const cutoff = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const rows = await this.traceRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      // Only the four columns the metric needs — the trace carries prompts and
      // param bags, and a dashboard query has no business loading them.
      select: {
        action: true,
        surface: true,
        outcome: true,
        failureReason: true,
      },
      take: 20000,
    });
    return buildCompletionRateReport(rows);
  }

  async findRecentByBusiness(
    businessId: string,
    periodDays = 30,
    limit = 500,
  ): Promise<AiCommandTrace[]> {
    const clampedDays = Math.min(90, Math.max(1, periodDays));
    const cutoff = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    return this.traceRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'DESC' },
      take: Math.min(5000, Math.max(1, limit)),
    });
  }
}
