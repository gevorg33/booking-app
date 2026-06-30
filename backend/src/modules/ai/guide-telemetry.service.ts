import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiGuideTelemetry } from './entities/ai-guide-telemetry.entity.js';
import {
  aggregateGuideTelemetryMetrics,
  buildGuideTelemetryAnalyticsSummary,
  buildGuideGroundingFailureEvent,
  buildGuideHandoffEvent,
  buildGuideStepCompletedEvent,
  buildGuideTelemetryRow,
  buildGuideTopicOpenedEvent,
  parseGuideTelemetryEventInput,
  rankUnansweredGuideTopics,
} from './guide/guide-telemetry.util.js';
import { getGuideCorpusTopic } from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import type {
  GuideTelemetryAnalyticsSummary,
  GuideUnansweredTopicRow,
  IngestGuideTelemetryEventInput,
  RecordGuideGroundingFailureInput,
  RecordGuideHandoffInput,
  RecordGuideStepCompletedInput,
  RecordGuideTopicOpenedInput,
} from './guide/guide-telemetry.types.js';

function enrichUnansweredGuideTopics(
  rows: GuideUnansweredTopicRow[],
): GuideUnansweredTopicRow[] {
  return rows.map((row) => {
    if (row.topicId === 'unknown') {
      return row;
    }
    const corpus = getGuideCorpusTopic(row.topicId as GuideCorpusTopicId);
    if (!corpus) {
      return row;
    }
    const titleKey = corpus.content.find((entry) => entry.kind === 'title')?.i18nKey;
    return {
      ...row,
      anchor: corpus.anchor,
      titleKey,
      inCorpus: true,
    };
  });
}

@Injectable()
export class GuideTelemetryService {
  private readonly logger = new Logger(GuideTelemetryService.name);

  constructor(
    @InjectRepository(AiGuideTelemetry)
    private readonly telemetryRepo: Repository<AiGuideTelemetry>,
  ) {}

  async record(
    businessId: string,
    input: IngestGuideTelemetryEventInput,
    userId?: string,
  ): Promise<AiGuideTelemetry> {
    const row = buildGuideTelemetryRow(businessId, userId, input);
    return this.telemetryRepo.save(this.telemetryRepo.create(row));
  }

  recordFireAndForget(
    businessId: string,
    input: IngestGuideTelemetryEventInput,
    userId?: string,
  ): void {
    void this.record(businessId, input, userId).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to persist ai_guide_telemetry: ${message}`);
    });
  }

  recordTopicOpened(input: RecordGuideTopicOpenedInput): void {
    this.recordFireAndForget(
      input.businessId,
      buildGuideTopicOpenedEvent(input),
      input.userId,
    );
  }

  recordGroundingFailure(input: RecordGuideGroundingFailureInput): void {
    this.recordFireAndForget(
      input.businessId,
      buildGuideGroundingFailureEvent(input),
      input.userId,
    );
  }

  async ingestEvents(
    businessId: string,
    events: readonly Record<string, unknown>[],
    userId?: string,
  ): Promise<{ recorded: number; skipped: number }> {
    let recorded = 0;
    let skipped = 0;
    for (const raw of events) {
      const parsed = parseGuideTelemetryEventInput(raw);
      if (!parsed) {
        skipped += 1;
        continue;
      }
      await this.record(businessId, parsed, userId);
      recorded += 1;
    }
    return { recorded, skipped };
  }

  async ingestClientEvents(
    businessId: string,
    events: readonly IngestGuideTelemetryEventInput[],
    userId?: string,
  ): Promise<{ recorded: number; skipped: number }> {
    let recorded = 0;
    let skipped = 0;
    for (const event of events) {
      const parsed = parseGuideTelemetryEventInput(
        event as unknown as Record<string, unknown>,
      );
      if (!parsed) {
        skipped += 1;
        continue;
      }
      await this.record(businessId, parsed, userId);
      recorded += 1;
    }
    return { recorded, skipped };
  }

  recordStepCompleted(input: RecordGuideStepCompletedInput): void {
    this.recordFireAndForget(
      input.businessId,
      buildGuideStepCompletedEvent(input),
      input.userId,
    );
  }

  recordHandoffToAction(input: RecordGuideHandoffInput): void {
    this.recordFireAndForget(
      input.businessId,
      buildGuideHandoffEvent(input),
      input.userId,
    );
  }

  async getAnalytics(
    businessId: string,
    periodDays = 30,
  ): Promise<GuideTelemetryAnalyticsSummary> {
    const clampedDays = Math.min(90, Math.max(7, periodDays));
    const cutoff = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const rows = await this.telemetryRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'ASC' },
      take: 5000,
    });
    const summary = buildGuideTelemetryAnalyticsSummary(rows, clampedDays);
    return {
      ...summary,
      topUnansweredTopics: enrichUnansweredGuideTopics(summary.topUnansweredTopics),
    };
  }
}
