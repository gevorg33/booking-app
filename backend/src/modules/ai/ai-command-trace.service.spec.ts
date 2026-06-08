import { NotFoundException } from '@nestjs/common';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import type { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { computePromptSimilarity, UNDO_WINDOW_MS } from './ai-command-trace.util.js';

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
    confidence: 0.4,
    params: null,
    routingTier: null,
    source: 'llm',
    outcome: 'clarified',
    latencyMs: 100,
    model: null,
    tokenCost: null,
    pipelineStages: null,
    failureSignal: null,
    feedbackRating: null,
    feedbackReason: null,
    correctedAction: null,
    locationId: null,
    abVariantId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function matchesNullField(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === 'object' &&
      value !== null &&
      '_type' in value &&
      (value as { _type: string })._type === 'isNull')
  );
}

describe('AiCommandTraceService (acc-1)', () => {
  const saved: AiCommandTrace[] = [];

  const traceRepo = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (entity) => {
      const row = entity as AiCommandTrace;
      if (!row.createdAt) {
        row.createdAt = new Date();
      }
      const existingIndex = saved.findIndex(
        (savedRow) => savedRow.traceId === row.traceId,
      );
      if (existingIndex >= 0) {
        saved[existingIndex] = row;
      } else {
        saved.unshift(row);
      }
      return row;
    }),
    find: jest.fn(async (options?: { where?: Record<string, unknown> }) => {
      const where = options?.where ?? {};
      return saved.filter((row) => {
        if (where.businessId && row.businessId !== where.businessId) return false;
        if (where.surface && row.surface !== where.surface) return false;
        if (where.userId && row.userId !== where.userId) return false;
        if (where.outcome && row.outcome !== where.outcome) return false;
        if (
          'failureSignal' in where &&
          matchesNullField(where.failureSignal) &&
          row.failureSignal != null
        ) {
          return false;
        }
        return true;
      });
    }),
    findOne: jest.fn(async ({ where }: { where: { traceId: string; businessId: string } }) =>
      saved.find(
        (row) => row.traceId === where.traceId && row.businessId === where.businessId,
      ) ?? null,
    ),
  };

  const promptSimilarity = {
    scoreAgainstPriorPrompts: jest.fn(
      async (
        _businessId: string,
        _userId: string | undefined,
        _surface: string,
        newPrompt: string,
        priorPrompts: string[],
      ) =>
        priorPrompts.map((prior) => computePromptSimilarity(prior, newPrompt)),
    ),
  };

  const agentTasks: Array<Record<string, unknown>> = [];
  const agentTaskRepo = {
    findOne: jest.fn(async ({ where }: { where: { id: string; businessId: string } }) =>
      agentTasks.find(
        (task) => task.id === where.id && task.businessId === where.businessId,
      ) ?? null,
    ),
    save: jest.fn(async (entity) => {
      const idx = agentTasks.findIndex((task) => task.id === entity.id);
      if (idx >= 0) agentTasks[idx] = entity;
      else agentTasks.push(entity);
      return entity;
    }),
  };

  const entityMemory = {
    learnFromCorrection: jest.fn(),
  };

  const evalHarvest = {
    upsertHarvestCandidate: jest.fn(async () => 'inserted' as const),
  };

  const service = new AiCommandTraceService(
    traceRepo as any,
    agentTaskRepo as any,
    promptSimilarity as any,
    entityMemory as any,
    evalHarvest as any,
  );

  beforeEach(() => {
    saved.length = 0;
    agentTasks.length = 0;
    jest.clearAllMocks();
  });

  it('records a trace row for each command', async () => {
    await service.recordTrace({
      traceId: 'trace-1',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'show bookings',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: { confidence: 0.9 },
      },
      startedAtMs: Date.now() - 50,
    });

    expect(traceRepo.save).toHaveBeenCalled();
    expect(saved[0]?.action).toBe('list_bookings');
    expect(saved[0]?.outcome).toBe('executed');
  });

  it('flags suspected_miss when a similar prompt follows clarify/fail (acc-1.4)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'prior',
        rawPrompt: 'book anna for haircut tomorrow',
        outcome: 'clarified',
      }),
    );

    await service.recordTrace({
      traceId: 'trace-2',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'book anna for haircut tomorrow please',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 20,
    });

    expect(promptSimilarity.scoreAgainstPriorPrompts).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      'dashboard',
      'book anna for haircut tomorrow please',
      ['book anna for haircut tomorrow'],
    );
    expect(saved.find((row) => row.traceId === 'prior')?.failureSignal).toBe(
      'suspected_miss',
    );
    expect(saved.find((row) => row.traceId === 'prior')?.correctedAction).toBe(
      'list_bookings',
    );
    expect(entityMemory.learnFromCorrection).toHaveBeenCalledWith(
      'biz-1',
      'book anna for haircut tomorrow',
      'list_bookings',
      'dashboard',
      'create_booking',
    );
  });

  it('flags suspected_miss from embedding similarity above threshold even when lexical score is low', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'prior-embed',
        rawPrompt: 'who has the earliest opening today',
        outcome: 'failed',
      }),
    );
    promptSimilarity.scoreAgainstPriorPrompts.mockResolvedValueOnce([0.91]);

    await service.recordTrace({
      traceId: 'trace-embed',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'first available slot today',
      result: {
        success: true,
        action: 'check_availability',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 15,
    });

    expect(saved.find((row) => row.traceId === 'prior-embed')?.failureSignal).toBe(
      'suspected_miss',
    );
    expect(
      saved.find((row) => row.traceId === 'prior-embed')?.correctedAction,
    ).toBe('check_availability');
  });

  it('does not flag when surface, user, or outcome do not match retry rules', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'other-surface',
        surface: 'provider',
        rawPrompt: 'book anna for haircut tomorrow',
      }),
    );
    saved.push(
      buildTraceRow({
        traceId: 'other-user',
        userId: 'user-2',
        rawPrompt: 'book anna for haircut tomorrow',
      }),
    );
    saved.push(
      buildTraceRow({
        traceId: 'executed-prior',
        outcome: 'executed',
        rawPrompt: 'book anna for haircut tomorrow',
      }),
    );

    await service.recordTrace({
      traceId: 'trace-3',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'book anna for haircut tomorrow please',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 20,
    });

    expect(saved.find((row) => row.traceId === 'other-surface')?.failureSignal).toBeNull();
    expect(saved.find((row) => row.traceId === 'other-user')?.failureSignal).toBeNull();
    expect(saved.find((row) => row.traceId === 'executed-prior')?.failureSignal).toBeNull();
  });

  it('flags clarify_abandoned on unrelated follow-up when retry similarity is low', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'prior-low',
        rawPrompt: 'cancel all appointments tomorrow',
      }),
    );
    promptSimilarity.scoreAgainstPriorPrompts.mockResolvedValueOnce([0.42]);

    await service.recordTrace({
      traceId: 'trace-low',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'show revenue this week',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 20,
    });

    expect(saved.find((row) => row.traceId === 'prior-low')?.failureSignal).toBe(
      'clarify_abandoned',
    );
  });

  it('marks clarify_abandoned via explicit API (acc-1.5)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-1',
        rawPrompt: 'book anna',
      }),
    );

    const result = await service.markClarifyAbandoned('clarify-1', 'biz-1');
    expect(result).toEqual({ ok: true, flagged: true });
    expect(saved.find((row) => row.traceId === 'clarify-1')?.failureSignal).toBe(
      'clarify_abandoned',
    );
  });

  it('does not overwrite existing failure signals on explicit abandon', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-flagged',
        rawPrompt: 'book anna',
        failureSignal: 'suspected_miss',
        correctedAction: 'list_bookings',
      }),
    );

    const result = await service.markClarifyAbandoned('clarify-flagged', 'biz-1');
    expect(result.flagged).toBe(false);
    expect(saved.find((row) => row.traceId === 'clarify-flagged')?.failureSignal).toBe(
      'suspected_miss',
    );
  });

  it('auto-flags clarify_abandoned when user pivots to a different command (acc-1.5)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-pending',
        rawPrompt: 'book anna for haircut',
        action: 'create_booking',
        outcome: 'clarified',
      }),
    );

    await service.recordTrace({
      traceId: 'trace-pivot',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'show todays bookings',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 10,
    });

    expect(saved.find((row) => row.traceId === 'clarify-pending')?.failureSignal).toBe(
      'clarify_abandoned',
    );
  });

  it('keeps clarify trace clean when follow-up executes the same intent (acc-1.5)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-resolved',
        rawPrompt: 'book anna for haircut',
        action: 'create_booking',
        outcome: 'clarified',
      }),
    );

    await service.recordTrace({
      traceId: 'trace-follow-up',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'tomorrow at 3pm',
      result: {
        success: true,
        action: 'create_booking',
        summary: 'booked',
        details: {},
      },
      startedAtMs: Date.now() - 10,
    });

    expect(saved.find((row) => row.traceId === 'clarify-resolved')?.failureSignal).toBeNull();
  });

  it('records feedback, abandon, and undo failure signals', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-1',
        rawPrompt: 'book anna',
      }),
    );

    await service.markClarifyAbandoned('clarify-1', 'biz-1');
    expect(saved.find((row) => row.traceId === 'clarify-1')?.failureSignal).toBe(
      'clarify_abandoned',
    );

    await service.recordFeedback('clarify-1', 'biz-1', {
      rating: 'down',
      reason: 'wrong_date',
    });
    expect(saved.find((row) => row.traceId === 'clarify-1')?.feedbackRating).toBe('down');
    expect(saved.find((row) => row.traceId === 'clarify-1')?.feedbackReason).toBe(
      'wrong_date',
    );

    saved.unshift(
      buildTraceRow({
        traceId: 'exec-1',
        rawPrompt: 'cancel anna',
        action: 'cancel_bookings',
        outcome: 'executed',
        confidence: 0.9,
      }),
    );

    await service.markWrongExecutionFromUndo({
      businessId: 'biz-1',
      userId: 'user-1',
    });
    expect(saved.find((row) => row.traceId === 'exec-1')?.failureSignal).toBe(
      'wrong_execution',
    );
  });

  it('flags wrong_execution by explicit traceId within undo window (acc-1.6)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'exec-linked',
        rawPrompt: 'cancel anna tomorrow',
        action: 'cancel_bookings',
        outcome: 'executed',
        confidence: 0.92,
      }),
    );

    const result = await service.markWrongExecutionFromUndo({
      businessId: 'biz-1',
      userId: 'user-1',
      traceId: 'exec-linked',
    });

    expect(result).toEqual({ ok: true, flagged: true, traceId: 'exec-linked' });
    expect(saved.find((row) => row.traceId === 'exec-linked')?.failureSignal).toBe(
      'wrong_execution',
    );
  });

  it('does not flag wrong_execution when undo window expired (acc-1.6)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'exec-old',
        rawPrompt: 'cancel anna',
        action: 'cancel_bookings',
        outcome: 'executed',
        createdAt: new Date(Date.now() - UNDO_WINDOW_MS - 5_000),
      }),
    );

    const result = await service.markWrongExecutionFromUndo({
      businessId: 'biz-1',
      userId: 'user-1',
      traceId: 'exec-old',
    });

    expect(result.flagged).toBe(false);
    expect(saved.find((row) => row.traceId === 'exec-old')?.failureSignal).toBeNull();
  });

  it('does not overwrite an existing failure signal on undo (acc-1.6)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'exec-flagged',
        rawPrompt: 'cancel anna',
        action: 'cancel_bookings',
        outcome: 'executed',
        failureSignal: 'suspected_miss',
      }),
    );

    const result = await service.markWrongExecutionFromUndo({
      businessId: 'biz-1',
      userId: 'user-1',
      traceId: 'exec-flagged',
    });

    expect(result.flagged).toBe(false);
    expect(saved.find((row) => row.traceId === 'exec-flagged')?.failureSignal).toBe(
      'suspected_miss',
    );
  });

  it('links executed traces to agent tasks for undo correlation (acc-1.6)', async () => {
    agentTasks.push({
      id: 'task-1',
      businessId: 'biz-1',
      context: { businessId: 'biz-1' },
    });

    await service.recordTrace({
      traceId: 'trace-task',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'cancel anna tomorrow',
      result: {
        success: true,
        action: 'cancel_bookings',
        summary: 'ok',
        details: { taskId: 'task-1' },
      },
      startedAtMs: Date.now() - 40,
    });

    expect(agentTasks[0]?.context).toEqual(
      expect.objectContaining({ _traceId: 'trace-task' }),
    );
  });

  it('throws when trace is missing', async () => {
    await expect(
      service.recordFeedback('missing', 'biz-1', { rating: 'up' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns accuracy analytics from stored traces', async () => {
    saved.push(
      buildTraceRow({
        traceId: 't1',
        rawPrompt: 'show bookings',
        action: 'list_bookings',
        outcome: 'executed',
        confidence: 0.9,
        routingTier: 'read_only',
        source: 'deterministic',
        latencyMs: 40,
      }),
    );

    const analytics = await service.getAccuracyAnalytics('biz-1', 30);
    expect(analytics.totalCommands).toBe(1);
    expect(analytics.noClarifyCompletionRate).toBe(1);
  });

  it('links undo wrong_execution to the next different intent (acc-1.9)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'undone',
        action: 'cancel_bookings',
        outcome: 'executed',
        failureSignal: 'wrong_execution',
        rawPrompt: 'cancel anna tomorrow',
      }),
    );

    await service.recordTrace({
      traceId: 'follow-up',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'show anna bookings instead',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      },
      startedAtMs: Date.now() - 10,
    });

    expect(saved.find((row) => row.traceId === 'undone')?.correctedAction).toBe(
      'list_bookings',
    );
  });

  it('exports confusion matrix pairs ranked by count (acc-1.9)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'retry-row',
        action: 'create_booking',
        outcome: 'clarified',
        failureSignal: 'suspected_miss',
        correctedAction: 'list_bookings',
      }),
      buildTraceRow({
        traceId: 'undo-row',
        action: 'cancel_bookings',
        outcome: 'executed',
        failureSignal: 'wrong_execution',
        correctedAction: 'reschedule_booking',
      }),
    );

    const matrix = await service.exportConfusionMatrix('biz-1', 30, 10);
    expect(matrix.totalCorrections).toBe(2);
    expect(matrix.pairs).toHaveLength(2);
    expect(matrix.pairs[0]).toMatchObject({
      from: expect.any(String),
      to: expect.any(String),
      count: 1,
      share: 0.5,
    });
  });

  it('exports worst prompts feed and eval drafts (acc-1.10)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'bad-1',
        rawPrompt: 'book anna for haircut tomorrow',
        action: 'create_booking',
        outcome: 'clarified',
        failureSignal: 'suspected_miss',
        confidence: 0.42,
        correctedAction: 'list_bookings',
      }),
      buildTraceRow({
        traceId: 'bad-2',
        rawPrompt: 'book anna for haircut tomorrow',
        action: 'create_booking',
        outcome: 'failed',
        feedbackRating: 'down',
        confidence: 0.38,
      }),
    );

    const feed = await service.exportWorstPrompts('biz-1', 30, 10);
    expect(feed.totalFailures).toBe(2);
    expect(feed.prompts).toHaveLength(1);
    expect(feed.prompts[0]?.rank).toBe(1);
    expect(feed.prompts[0]?.failureCount).toBe(2);

    const evalExport = await service.exportWorstPromptsForEval('biz-1', 30, 10);
    expect(evalExport.businessId).toBe('biz-1');
    expect(evalExport.drafts).toHaveLength(1);
    expect(evalExport.drafts[0]?.source).toBe('acc-1.10');
    expect(evalExport.drafts[0]?.expect.rescuedAction).toBe('list_bookings');
  });

  it('exports accuracy SLO snapshot (acc-1.11)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'slo-good',
        action: 'list_bookings',
        outcome: 'executed',
        failureSignal: null,
        confidence: 0.95,
        createdAt: new Date(Date.now() - 2 * 86_400_000),
      }),
      buildTraceRow({
        traceId: 'slo-bad',
        action: 'create_booking',
        outcome: 'clarified',
        failureSignal: 'suspected_miss',
        createdAt: new Date(Date.now() - 10 * 86_400_000),
      }),
    );

    const slo = await service.exportAccuracySlo('biz-1', 30);
    expect(slo.target).toBe(0.99);
    expect(slo.trend).toHaveLength(7);
    expect(typeof slo.alert).toBe('boolean');
    expect(typeof slo.meetsTarget).toBe('boolean');
  });

  it('auto-queues second-clarify pairs to eval labeling (n99-1.7)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-prior',
        userId: 'user-1',
        action: 'create_booking',
        outcome: 'clarified',
        rawPrompt: 'book haircut',
        params: { _clarifyKind: 'entity_disambiguation' },
        createdAt: new Date(Date.now() - 20_000),
      }),
    );

    await service.recordTrace({
      traceId: 'clarify-follow',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-1',
      role: 'owner',
      rawPrompt: 'with gevorg',
      result: {
        success: true,
        action: 'create_booking',
        summary: 'clarify again',
        details: { confidence: 0.52, clarify: true },
      },
      startedAtMs: Date.now() - 50,
    });

    expect(evalHarvest.upsertHarvestCandidate).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        harvestSource: 'clarify_quality',
        nextTurnOutcome: 'second_clarify',
      }),
    );
  });

  it('auto-queues abandoned clarify pivots to eval labeling (n99-1.7)', async () => {
    saved.push(
      buildTraceRow({
        traceId: 'clarify-abandon',
        userId: 'user-2',
        action: 'cancel_booking',
        outcome: 'clarified',
        rawPrompt: 'cancel maybe',
        params: { _clarifyKind: 'intent_disambiguation' },
        createdAt: new Date(Date.now() - 30_000),
      }),
    );

    await service.recordTrace({
      traceId: 'clarify-pivot',
      businessId: 'biz-1',
      surface: 'dashboard',
      userId: 'user-2',
      role: 'owner',
      rawPrompt: 'show my appointments',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: { confidence: 0.9 },
      },
      startedAtMs: Date.now() - 50,
    });

    expect(evalHarvest.upsertHarvestCandidate).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        harvestSource: 'clarify_quality',
        nextTurnOutcome: 'abandon',
      }),
    );
  });
});
