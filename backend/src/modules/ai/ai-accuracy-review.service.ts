import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiEventsService } from './ai-events.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import {
  aggregateTraceAccuracyAnalytics,
  exportWorstPromptsFromRows,
} from './ai-command-trace.util.js';
import {
  ACCURACY_REVIEW_WORST_PROMPTS_TOP_N,
  buildWeeklyAccuracyReviewDigest,
  formatAccuracyReviewDigestEmailHtml,
  formatAccuracyReviewDigestSummary,
  splitTraceRowsByPeriod,
  type AccuracyReviewDigest,
} from './ai-accuracy-review.util.js';
import { buildAccuracyExitGateFromAnalytics } from './ai-accuracy-exit-gate.util.js';
import { buildAccuracyLadderProgress } from './ai-accuracy-ratchet.util.js';
import { AiAccuracyRatchetService } from './ai-accuracy-ratchet.service.js';
import { loadEvalBaseline } from './eval/ai-command-eval.report.js';

export interface AccuracyProgramStatus {
  exitGate: ReturnType<typeof buildAccuracyExitGateFromAnalytics>;
  ladder: ReturnType<typeof buildAccuracyLadderProgress>;
  ratchet: ReturnType<AiAccuracyRatchetService['getStatus']>;
  recommendedActions: string[];
  headline: AccuracyReviewDigest['headline'];
  escalation: AccuracyReviewDigest['escalationSummary'];
}

export interface AccuracyReviewResponse extends AccuracyReviewDigest {
  lastPublishedAt?: string;
}

@Injectable()
export class AiAccuracyReviewService {
  private readonly logger = new Logger(AiAccuracyReviewService.name);

  constructor(
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    private readonly commandTrace: AiCommandTraceService,
    private readonly aiEvents: AiEventsService,
    private readonly emailService: EmailService,
    private readonly aiSettings: AiSettingsService,
    private readonly ratchetService: AiAccuracyRatchetService,
  ) {}

  /** acc-6.1 — compile digest for current vs prior period. */
  async buildReviewDigest(
    businessId: string,
    periodDays = 7,
  ): Promise<AccuracyReviewResponse> {
    const windowRows = await this.commandTrace.loadTraceAnalyticsRowsForEval(
      businessId,
      periodDays * 2,
    );
    const { current: currentRows, previous: previousRows } = splitTraceRowsByPeriod(
      windowRows,
      periodDays,
    );
    const analytics = aggregateTraceAccuracyAnalytics(currentRows, periodDays);
    const windowAnalytics = aggregateTraceAccuracyAnalytics(
      windowRows,
      periodDays * 2,
    );
    const previousAnalytics = previousRows.length
      ? aggregateTraceAccuracyAnalytics(previousRows, periodDays)
      : undefined;
    const previousWorst = previousRows.length
      ? exportWorstPromptsFromRows(
          previousRows,
          periodDays,
          ACCURACY_REVIEW_WORST_PROMPTS_TOP_N,
        ).prompts
      : [];

    const digest = buildWeeklyAccuracyReviewDigest({
      analytics: {
        ...analytics,
        accuracySlo: windowAnalytics.accuracySlo,
      },
      rows: currentRows,
      previousAnalytics,
      previousWorstPrompts: previousWorst,
      businessId,
    });

    const settings = await this.aiSettings.getSettings(businessId);
    return {
      ...digest,
      lastPublishedAt: settings.accuracyProgram?.lastWeeklyReviewPublishedAt,
    };
  }

  /** acc-6.4/6.8 — program ladder + exit gate (30d window). */
  async buildProgramStatus(
    businessId: string,
    periodDays = 30,
  ): Promise<AccuracyProgramStatus> {
    const rows = await this.commandTrace.loadTraceAnalyticsRowsForEval(
      businessId,
      periodDays,
    );
    const analytics = await this.commandTrace.getAccuracyAnalytics(
      businessId,
      periodDays,
    );
    const digest = buildWeeklyAccuracyReviewDigest({
      analytics,
      rows,
      businessId,
    });
    const exitGate =
      analytics.exitGate ?? buildAccuracyExitGateFromAnalytics(analytics, rows);
    const baseline = loadEvalBaseline();
    const accurate =
      analytics.totalCommands > 0
        ? Object.values(analytics.byIntent).reduce((s, v) => s + v.accurate, 0) /
          analytics.totalCommands
        : 0;
    const ladder = buildAccuracyLadderProgress({
      ciFloor: baseline.accuracyFloor,
      liveNoClarifyRate: analytics.noClarifyCompletionRate,
      liveAccurateRate: accurate,
    });
    const ratchet = this.ratchetService.getStatus({
      liveNoClarifyRate: analytics.noClarifyCompletionRate,
      liveAccurateRate: accurate,
    });

    return {
      exitGate,
      ladder,
      ratchet,
      recommendedActions: digest.recommendedActions,
      headline: digest.headline,
      escalation: digest.escalationSummary,
    };
  }

  async publishWeeklyReviewForBusiness(
    businessId: string,
  ): Promise<{ alertSent: boolean; emailed: boolean }> {
    const review = await this.buildReviewDigest(businessId, 7);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, name: true, email: true },
    });
    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }

    this.aiEvents.emitAlert(businessId, {
      alertType: 'report',
      title: 'Weekly AI accuracy review',
      message: formatAccuracyReviewDigestSummary(review),
      route: '/dashboard/ai-ops',
    });

    let emailed = false;
    if (business.email) {
      const html = formatAccuracyReviewDigestEmailHtml(review, business.name);
      const result = await this.emailService.send({
        to: business.email,
        subject: `Weekly AI accuracy review — ${business.name}`,
        html,
        text: formatAccuracyReviewDigestSummary(review),
      });
      emailed = result.ok;
      if (!result.ok) {
        this.logger.warn(
          `Accuracy review email failed for ${businessId}: ${result.error}`,
        );
      }
    }

    await this.aiSettings.updateSettings(businessId, {
      accuracyProgram: {
        lastWeeklyReview: review as unknown as Record<string, unknown>,
        lastWeeklyReviewPublishedAt: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Published accuracy review for ${businessId} (${review.headline.totalCommands} commands, email=${emailed})`,
    );
    return { alertSent: true, emailed };
  }

  async publishWeeklyReviewsForAllBusinesses(): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
      select: { id: true },
      take: 500,
    });
    let count = 0;
    for (const { id } of businesses) {
      try {
        await this.publishWeeklyReviewForBusiness(id);
        count += 1;
      } catch (error) {
        this.logger.warn(
          `Accuracy review failed for ${id}: ${(error as Error).message}`,
        );
      }
    }
    return count;
  }
}
