import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { buildEvalHarvestCandidatesFromRows } from './ai-command-trace.util.js';
import {
  AiEvalLabelQueue,
  type AiEvalLabelQueueStatus,
} from './entities/ai-eval-label-queue.entity.js';
import {
  appendEvalCaseToHarvestedCasesFile,
  applyLabelDraftToQueueRow,
  buildEvalCaseFromLabelQueueItem,
  buildEvalCaseId,
  formatEvalCaseFixtureSnippet,
  formatHarvestedCasesModule,
} from './eval/ai-eval-label.util.js';
import { AiFailureClosureService } from './ai-failure-closure.service.js';
import type {
  AiEvalFixturesModuleExport,
  AiEvalHarvestResult,
  AiEvalLabelQueueExport,
  AiEvalLabelQueueItem,
  AiEvalLabelQueueUpdate,
  AiEvalLabeledCaseExport,
  AiWorstPromptEntry,
} from './ai-platform.util.js';

const DEFAULT_HARVEST_PERIOD_DAYS = 7;
const DEFAULT_HARVEST_LIMIT = 100;

@Injectable()
export class AiEvalHarvestService {
  private readonly logger = new Logger(AiEvalHarvestService.name);

  constructor(
    @InjectRepository(AiEvalLabelQueue)
    private readonly queueRepo: Repository<AiEvalLabelQueue>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @Inject(forwardRef(() => AiCommandTraceService))
    private readonly commandTrace: AiCommandTraceService,
    private readonly failureClosure: AiFailureClosureService,
  ) {}

  async listQueue(
    businessId: string,
    status: AiEvalLabelQueueStatus = 'pending',
    limit = 50,
  ): Promise<AiEvalLabelQueueExport> {
    const cappedLimit = Math.min(100, Math.max(5, limit));
    const rows = await this.queueRepo.find({
      where: { businessId, status },
      order: { failureCount: 'DESC', createdAt: 'DESC' },
      take: cappedLimit,
    });
    return {
      businessId,
      status,
      total: rows.length,
      items: rows.map((row) => this.toQueueItem(row)),
    };
  }

  async listClosureQueue(
    businessId: string,
    fixStatus: 'open' | 'applied' | 'dismissed' = 'open',
    limit = 50,
  ): Promise<AiEvalLabelQueueExport> {
    const cappedLimit = Math.min(100, Math.max(5, limit));
    const rows = await this.queueRepo.find({
      where: { businessId, fixStatus },
      order: { labeledAt: 'DESC', createdAt: 'DESC' },
      take: cappedLimit,
    });
    return {
      businessId,
      status: 'exported',
      total: rows.length,
      items: rows.map((row) => this.toQueueItem(row)),
    };
  }

  async harvestBusiness(
    businessId: string,
    periodDays = DEFAULT_HARVEST_PERIOD_DAYS,
  ): Promise<AiEvalHarvestResult> {
    const rows = await this.commandTrace.loadTraceAnalyticsRowsForEval(
      businessId,
      periodDays,
    );
    const candidates = buildEvalHarvestCandidatesFromRows(
      rows,
      DEFAULT_HARVEST_LIMIT,
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const entry of candidates) {
      const result = await this.upsertHarvestCandidate(businessId, entry);
      if (result === 'inserted') inserted += 1;
      else if (result === 'updated') updated += 1;
      else skipped += 1;
    }

    return {
      periodDays,
      candidates: candidates.length,
      inserted,
      updated,
      skipped,
    };
  }

  /** acc-2 / n99-1.7 — upsert one harvested or auto-queued eval label candidate. */
  async upsertHarvestCandidate(
    businessId: string,
    entry: AiWorstPromptEntry,
  ): Promise<'inserted' | 'updated' | 'skipped'> {
    const existing = await this.queueRepo.findOne({
      where: { businessId, promptHash: entry.promptHash },
    });
    if (existing) {
      if (existing.status === 'pending' || existing.status === 'labeled') {
        existing.failureCount = Math.max(existing.failureCount, entry.failureCount);
        existing.failureSignals = entry.failureSignals;
        existing.confidence = entry.avgConfidence;
        existing.promptSnippet = entry.promptSnippet;
        existing.classifiedAction = entry.action;
        existing.correctedAction = entry.correctedAction;
        if (entry.harvestSource === 'clarify_quality') {
          existing.source = 'clarify_quality';
          existing.labelOutcome = 'clarify';
          if (entry.clarifyKind) {
            existing.expectedClarifyFields = [entry.clarifyKind];
          }
        }
        await this.queueRepo.save(existing);
        return 'updated';
      }
      return 'skipped';
    }

    await this.queueRepo.save(
      this.queueRepo.create({
        businessId,
        promptHash: entry.promptHash,
        promptSnippet: entry.promptSnippet,
        locale: entry.locale,
        surface: entry.surface,
        classifiedAction: entry.action,
        correctedAction: entry.correctedAction,
        confidence: entry.avgConfidence,
        failureCount: entry.failureCount,
        failureSignals: entry.failureSignals,
        status: 'pending',
        source:
          entry.harvestSource === 'clarify_quality'
            ? 'clarify_quality'
            : entry.harvestSource === 'escalation'
              ? 'escalation'
              : 'harvest',
        labelOutcome:
          entry.harvestSource === 'clarify_quality' ||
          entry.harvestSource === 'escalation'
            ? 'clarify'
            : 'execution',
        expectedClarifyFields:
          (entry.harvestSource === 'clarify_quality' ||
            entry.harvestSource === 'escalation') &&
          entry.clarifyKind
            ? [entry.clarifyKind]
            : null,
      }),
    );
    return 'inserted';
  }

  async harvestAllBusinesses(
    periodDays = DEFAULT_HARVEST_PERIOD_DAYS,
  ): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
      select: { id: true },
      take: 500,
    });
    let total = 0;
    for (const { id } of businesses) {
      try {
        const result = await this.harvestBusiness(id, periodDays);
        total += result.inserted;
      } catch (error) {
        this.logger.warn(
          `Eval harvest failed for ${id}: ${(error as Error).message}`,
        );
      }
    }
    if (total > 0) {
      this.logger.log(`Harvested ${total} new eval label queue item(s)`);
    }
    return total;
  }

  async updateQueueItem(
    businessId: string,
    itemId: string,
    update: AiEvalLabelQueueUpdate,
    labeledBy?: string,
  ): Promise<AiEvalLabelQueueItem> {
    const row = await this.requireQueueItem(businessId, itemId);
    applyLabelDraftToQueueRow(row, update);
    if (
      update.labelOutcome !== undefined ||
      update.expectedAction !== undefined ||
      update.expectedRescuedAction !== undefined ||
      update.expectedParams !== undefined ||
      update.expectedClarifyFields !== undefined
    ) {
      row.status = 'labeled';
      row.labeledBy = labeledBy ?? row.labeledBy;
      row.labeledAt = new Date();
    }
    const saved = await this.queueRepo.save(row);
    return this.toQueueItem(saved);
  }

  async approveQueueItem(
    businessId: string,
    itemId: string,
    labeledBy?: string,
  ): Promise<AiEvalLabeledCaseExport> {
    const row = await this.requireQueueItem(businessId, itemId);
    if (!row.expectedAction && !row.expectedRescuedAction && row.labelOutcome !== 'clarify') {
      row.expectedAction = row.classifiedAction;
      if (row.correctedAction) {
        row.expectedRescuedAction = row.correctedAction;
      }
    }
    row.evalCaseId = buildEvalCaseId(row, businessId);
    row.status = 'exported';
    row.labeledBy = labeledBy ?? row.labeledBy;
    row.labeledAt = new Date();

    const closurePlan = await this.failureClosure.executePipeline(businessId, row);
    this.failureClosure.applyClosureFieldsToRow(row, closurePlan);
    await this.queueRepo.save(row);

    const evalCase = buildEvalCaseFromLabelQueueItem(row, businessId);
    const appendResult = appendEvalCaseToHarvestedCasesFile(evalCase);

    return {
      businessId,
      itemId: row.id,
      evalCase: evalCase as unknown as Record<string, unknown>,
      fixtureSnippet: formatEvalCaseFixtureSnippet(evalCase),
      appendedToFixtures: appendResult.appended,
      fixturesPath: appendResult.appended
        ? 'src/modules/ai/eval/ai-command-eval.harvested.cases.ts'
        : undefined,
      appendReason: appendResult.reason,
      harvestedCaseCount: appendResult.totalCases,
      closurePlan: closurePlan as unknown as Record<string, unknown>,
    };
  }

  async exportFixturesModule(businessId: string): Promise<AiEvalFixturesModuleExport> {
    const rows = await this.queueRepo.find({
      where: { businessId, status: 'exported' },
      order: { labeledAt: 'DESC', createdAt: 'DESC' },
      take: 500,
    });
    const cases = rows.map((row) => buildEvalCaseFromLabelQueueItem(row, businessId));
    return {
      businessId,
      generatedAt: new Date().toISOString(),
      caseCount: cases.length,
      moduleSource: formatHarvestedCasesModule(cases),
      cases: cases as unknown as Record<string, unknown>[],
    };
  }

  async dismissQueueItem(
    businessId: string,
    itemId: string,
  ): Promise<AiEvalLabelQueueItem> {
    const row = await this.requireQueueItem(businessId, itemId);
    row.status = 'dismissed';
    const saved = await this.queueRepo.save(row);
    return this.toQueueItem(saved);
  }

  private async requireQueueItem(
    businessId: string,
    itemId: string,
  ): Promise<AiEvalLabelQueue> {
    const row = await this.queueRepo.findOne({
      where: { id: itemId, businessId },
    });
    if (!row) {
      throw new NotFoundException('Eval label queue item not found');
    }
    return row;
  }

  private toQueueItem(row: AiEvalLabelQueue): AiEvalLabelQueueItem {
    return {
      id: row.id,
      promptHash: row.promptHash,
      promptSnippet: row.promptSnippet,
      locale: row.locale,
      surface: row.surface,
      classifiedAction: row.classifiedAction,
      correctedAction: row.correctedAction,
      confidence: row.confidence,
      failureCount: row.failureCount,
      failureSignals: row.failureSignals,
      status: row.status,
      labelOutcome: row.labelOutcome ?? 'execution',
      expectedAction: row.expectedAction,
      expectedRescuedAction: row.expectedRescuedAction,
      rescueFromAction: row.rescueFromAction,
      expectedParams: row.expectedParams,
      expectedClarifyFields: row.expectedClarifyFields,
      evalCaseId: row.evalCaseId,
      source: row.source,
      fixType: row.fixType,
      fixStatus: row.fixStatus,
      fixRef: row.fixRef,
      closureSummary: row.closureSummary,
      closureAppliedAt: row.closureAppliedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      labeledAt: row.labeledAt?.toISOString() ?? null,
    };
  }
}
