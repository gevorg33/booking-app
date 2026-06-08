import { NotFoundException } from '@nestjs/common';
import { AiEvalHarvestService } from './ai-eval-harvest.service.js';
import type { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';

function buildTraceRow(
  overrides: Partial<AiCommandTrace> & Pick<AiCommandTrace, 'traceId'>,
): AiCommandTrace {
  return {
    id: overrides.traceId,
    traceId: overrides.traceId,
    businessId: 'biz-1',
    surface: 'dashboard',
    userId: 'user-1',
    role: 'owner',
    rawPrompt: 'book anna for haircut tomorrow',
    normalizedPrompt: 'book anna for haircut tomorrow',
    locale: 'en',
    action: 'create_booking',
    confidence: 0.42,
    params: null,
    routingTier: null,
    source: 'llm',
    outcome: 'clarified',
    latencyMs: 100,
    model: null,
    tokenCost: null,
    pipelineStages: null,
    failureSignal: 'suspected_miss',
    feedbackRating: null,
    feedbackReason: null,
    correctedAction: 'list_bookings',
    locationId: null,
    abVariantId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AiEvalHarvestService integration (acc-2.1)', () => {
  const savedTraces: AiCommandTrace[] = [];
  const savedQueue: AiEvalLabelQueue[] = [];

  const traceRepo = {
    find: jest.fn(async () => savedTraces),
    findOne: jest.fn(async ({ where }: { where: Record<string, string> }) =>
      savedTraces.find(
        (row) =>
          row.traceId === where.traceId && row.businessId === where.businessId,
      ),
    ),
  };

  const queueRepo = {
    find: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
      savedQueue.filter(
        (row) =>
          row.businessId === where.businessId &&
          (where.status ? row.status === where.status : true),
      ),
    ),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, string> }) =>
        savedQueue.find(
          (row) =>
            row.businessId === where.businessId &&
            (where.id ? row.id === where.id : row.promptHash === where.promptHash),
        ) ?? null,
    ),
    create: jest.fn((value: AiEvalLabelQueue) => ({
      ...value,
      id: value.id ?? `queue-${savedQueue.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn(async (value: AiEvalLabelQueue) => {
      const index = savedQueue.findIndex((row) => row.id === value.id);
      if (index >= 0) {
        savedQueue[index] = value;
        return value;
      }
      savedQueue.push(value);
      return value;
    }),
  };

  const businessRepo = {
    find: jest.fn(async () => [{ id: 'biz-1' }]),
  };

  const commandTrace = {
    loadTraceAnalyticsRowsForEval: jest.fn(async () =>
      savedTraces.map((trace) => ({
        traceId: trace.traceId,
        surface: trace.surface,
        locale: trace.locale,
        action: trace.action,
        outcome: trace.outcome,
        confidence: trace.confidence,
        failureSignal: trace.failureSignal,
        feedbackRating: trace.feedbackRating,
        correctedAction: trace.correctedAction,
        rawPrompt: trace.rawPrompt,
        createdAt: trace.createdAt,
      })),
    ),
  };

  const service = new AiEvalHarvestService(
    queueRepo as any,
    businessRepo as any,
    commandTrace as any,
    {
      executePipeline: jest.fn(async () => ({
        fixType: 'fewshot',
        fixStatus: 'applied',
        fixRef: 'fewshot:x',
        summary: 'ok',
      })),
      applyClosureFieldsToRow: jest.fn(),
    } as any,
  );

  beforeEach(() => {
    savedTraces.length = 0;
    savedQueue.length = 0;
    jest.clearAllMocks();
    savedTraces.push(
      buildTraceRow({ traceId: 'harvest-1' }),
      buildTraceRow({
        traceId: 'harvest-2',
        rawPrompt: 'book haircut tomorrow',
        feedbackRating: 'down',
        failureSignal: null,
        outcome: 'executed',
        confidence: 0.88,
        correctedAction: null,
      }),
    );
  });

  it('pulls anonymized suspected_miss and thumbs-down traces into the queue', async () => {
    const result = await service.harvestBusiness('biz-1', 7);

    expect(result.candidates).toBe(2);
    expect(result.inserted).toBe(2);
    expect(savedQueue).toHaveLength(2);
    expect(savedQueue.every((row) => row.status === 'pending')).toBe(true);
    expect(savedQueue.every((row) => row.source === 'harvest')).toBe(true);
  });

  it('returns not found when labeling unknown queue item', async () => {
    await expect(service.dismissQueueItem('biz-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
