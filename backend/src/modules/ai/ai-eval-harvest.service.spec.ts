import { AiEvalHarvestService } from './ai-eval-harvest.service.js';
import { AiFailureClosureService } from './ai-failure-closure.service.js';
import { buildEvalHarvestCandidatesFromRows } from './ai-command-trace.util.js';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';

describe('AiEvalHarvestService (acc-2.1)', () => {
  const queueRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const businessRepo = {
    find: jest.fn(async () => [{ id: 'biz-1' }]),
  };
  const commandTrace = {
    loadTraceAnalyticsRowsForEval: jest.fn(async () => [
      {
        traceId: 't1',
        surface: 'dashboard',
        locale: 'en',
        action: 'create_booking',
        outcome: 'clarified',
        confidence: 0.4,
        failureSignal: 'suspected_miss',
        feedbackRating: null,
        correctedAction: 'list_bookings',
        rawPrompt: 'book anna@gmail.com for haircut tomorrow',
        createdAt: new Date(),
      },
      {
        traceId: 't2',
        surface: 'customer',
        locale: 'en',
        action: 'create_booking',
        outcome: 'executed',
        confidence: 0.9,
        failureSignal: null,
        feedbackRating: 'down',
        correctedAction: null,
        rawPrompt: 'book anna@gmail.com for haircut tomorrow',
        createdAt: new Date(),
      },
      {
        traceId: 't3',
        surface: 'dashboard',
        locale: 'en',
        action: 'list_bookings',
        outcome: 'executed',
        confidence: 0.95,
        failureSignal: null,
        feedbackRating: null,
        correctedAction: null,
        rawPrompt: 'show appointments today',
        createdAt: new Date(),
      },
    ]),
  };

  const failureClosure = {
    executePipeline: jest.fn(async () => ({
      fixType: 'rescue',
      fixStatus: 'applied',
      fixRef: 'telemetry-rescue:list_bookings->show_appointments',
      summary: 'applied',
    })),
    applyClosureFieldsToRow: jest.fn((row, plan) => {
      row.fixType = plan.fixType;
      row.fixStatus = plan.fixStatus;
      row.fixRef = plan.fixRef;
      row.closureSummary = plan.summary;
      row.closureAppliedAt = new Date();
    }),
  };

  const service = new AiEvalHarvestService(
    queueRepo as any,
    businessRepo as any,
    commandTrace as any,
    failureClosure as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queueRepo.findOne.mockResolvedValue(null);
  });

  it('harvestBusiness inserts anonymized failure prompts from trace rows', async () => {
    const result = await service.harvestBusiness('biz-1', 7);

    expect(result).toEqual({
      periodDays: 7,
      candidates: 1,
      inserted: 1,
      updated: 0,
      skipped: 0,
    });
    expect(queueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        classifiedAction: 'create_booking',
        correctedAction: 'list_bookings',
        promptSnippet: expect.stringContaining('[email]'),
        status: 'pending',
        source: 'harvest',
      }),
    );
    expect(commandTrace.loadTraceAnalyticsRowsForEval).toHaveBeenCalledWith(
      'biz-1',
      7,
    );
  });

  it('harvestBusiness updates pending queue rows instead of duplicating', async () => {
    const rows = await commandTrace.loadTraceAnalyticsRowsForEval('biz-1', 7);
    const [candidate] = buildEvalHarvestCandidatesFromRows(rows, 100);
    queueRepo.findOne.mockResolvedValue({
      id: 'existing',
      businessId: 'biz-1',
      promptHash: candidate.promptHash,
      status: 'pending',
    });

    const result = await service.harvestBusiness('biz-1', 7);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(1);
  });

  it('harvestBusiness skips dismissed/exported duplicates', async () => {
    const rows = await commandTrace.loadTraceAnalyticsRowsForEval('biz-1', 7);
    const [candidate] = buildEvalHarvestCandidatesFromRows(rows, 100);
    queueRepo.findOne.mockResolvedValue({
      id: 'existing',
      businessId: 'biz-1',
      promptHash: candidate.promptHash,
      status: 'dismissed',
    });

    const result = await service.harvestBusiness('biz-1', 7);
    expect(result.skipped).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('upsertHarvestCandidate inserts clarify_quality rows for n99-1.7 auto-queue', async () => {
    const result = await service.upsertHarvestCandidate('biz-1', {
      rank: 1,
      promptHash: 'clarify-hash',
      promptSnippet: 'book haircut',
      action: 'create_booking',
      surface: 'dashboard',
      locale: 'en',
      failureCount: 1,
      avgConfidence: 0.45,
      failureSignals: {
        suspected_miss: 0,
        wrong_execution: 0,
        clarify_abandoned: 1,
        thumbs_down: 0,
        failed_outcome: 0,
        low_confidence: 0,
        human_escalation: 0,
      },
      correctedAction: null,
      lastSeenAt: '2026-06-07T12:00:00Z',
      harvestSource: 'clarify_quality',
      clarifyKind: 'entity_disambiguation',
      nextTurnOutcome: 'second_clarify',
    });

    expect(result).toBe('inserted');
    expect(queueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'clarify_quality',
        labelOutcome: 'clarify',
        expectedClarifyFields: ['entity_disambiguation'],
      }),
    );
  });

  it('harvestAllBusinesses aggregates inserted rows across businesses', async () => {
    const total = await service.harvestAllBusinesses(7);
    expect(total).toBe(1);
    expect(businessRepo.find).toHaveBeenCalled();
  });

  it('approveQueueItem exports deterministic eval fixture snippet', async () => {
    const row: AiEvalLabelQueue = {
      id: 'item-1',
      businessId: 'biz-1',
      promptHash: 'abc123',
      promptSnippet: 'book anna for haircut tomorrow',
      locale: 'en',
      surface: 'dashboard',
      classifiedAction: 'create_booking',
      correctedAction: 'list_bookings',
      confidence: 0.4,
      failureCount: 2,
      failureSignals: {
        suspected_miss: 1,
        wrong_execution: 0,
        clarify_abandoned: 0,
        thumbs_down: 1,
        failed_outcome: 0,
        low_confidence: 0,
      },
      status: 'pending',
      labelOutcome: 'execution',
      expectedAction: null,
      expectedRescuedAction: 'list_bookings',
      rescueFromAction: 'create_booking',
      expectedParams: null,
      expectedClarifyFields: null,
      evalCaseId: null,
      labeledBy: null,
      labeledAt: null,
      source: 'harvest',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    queueRepo.findOne.mockResolvedValue(row);

    const exported = await service.approveQueueItem('biz-1', 'item-1', 'user-1');
    expect(exported.fixtureSnippet).toContain('list_bookings');
    expect(exported.evalCase).toMatchObject({
      corpus: 'harvested',
      expect: expect.objectContaining({ rescuedAction: 'list_bookings' }),
    });
    expect(exported.appendedToFixtures).toBe(false);
    expect(exported.closurePlan).toMatchObject({
      fixType: 'rescue',
      fixStatus: 'applied',
    });
    expect(failureClosure.executePipeline).toHaveBeenCalled();
    expect(queueRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'exported',
        evalCaseId: expect.any(String),
        fixStatus: 'applied',
      }),
    );
  });

  it('exportFixturesModule returns TypeScript module for exported labels', async () => {
    queueRepo.find.mockResolvedValue([
      {
        id: 'exported-1',
        businessId: 'biz-1',
        promptHash: 'abc123',
        promptSnippet: 'book haircut',
        locale: 'en',
        surface: 'dashboard',
        classifiedAction: 'create_booking',
        correctedAction: null,
        confidence: 0.4,
        failureCount: 1,
        failureSignals: null,
        status: 'exported',
        labelOutcome: 'clarify',
        expectedAction: null,
        expectedRescuedAction: null,
        rescueFromAction: null,
        expectedParams: null,
        expectedClarifyFields: ['date'],
        evalCaseId: 'harvest-biz-1-abc123',
        labeledBy: 'user-1',
        labeledAt: new Date(),
        source: 'harvest',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const exported = await service.exportFixturesModule('biz-1');
    expect(exported.caseCount).toBe(1);
    expect(exported.moduleSource).toContain('AI_COMMAND_EVAL_HARVESTED_CASES');
    expect(exported.moduleSource).toContain('compoundExpectEmpty');
  });
});
