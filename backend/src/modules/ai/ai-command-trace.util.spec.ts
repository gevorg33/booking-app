import {
  aggregateTraceAccuracyAnalytics,
  buildAccuracySlo,
  buildEvalHarvestCandidatesFromRows,
  buildAiCommandTracePayload,
  buildConfusionMatrix,
  buildWorstPromptsFeed,
  computePromptSimilarity,
  exportWorstPromptsEvalDrafts,
  exportWorstPromptsFromRows,
  cosineSimilarity,
  detectPromptLocale,
  inferClassificationSource,
  extractTaskIdFromResult,
  isClarifyAbandonCandidate,
  isClarifyContinuation,
  isClarifyFollowUpSuccess,
  isEvalHarvestCandidate,
  isRetryCandidateOutcome,
  isTraceAccurate,
  isUndoCorrectionCandidate,
  isWithinUndoWindow,
  isWrongExecutionCandidate,
  mapResultToTraceOutcome,
  normalizeFeedbackReason,
  redactTraceParams,
  tokenizePromptForSimilarity,
  UNDO_WINDOW_MS,
} from './ai-command-trace.util.js';
import {
  ACCURACY_SLO_TARGET,
  ACCURACY_SLO_WEEKLY_ALERT_DELTA,
} from './ai-platform.util.js';

describe('ai-command-trace.util (acc-1)', () => {
  it('detectPromptLocale classifies hy, ru, translit, and en', () => {
    expect(detectPromptLocale('հանդիպում')).toBe('hy');
    expect(detectPromptLocale('запись на завтра')).toBe('ru');
    expect(detectPromptLocale('zapis na zavtra')).toBe('translit');
    expect(detectPromptLocale('book Anna tomorrow')).toBe('en');
  });

  it('maps command results to trace outcomes', () => {
    expect(
      mapResultToTraceOutcome({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      }),
    ).toBe('executed');
    expect(
      mapResultToTraceOutcome({
        success: true,
        action: 'create_booking',
        summary: 'need date',
        details: { clarify: true, missing: [{ field: 'date' }] },
      }),
    ).toBe('clarified');
    expect(
      mapResultToTraceOutcome({
        success: false,
        action: 'security_blocked',
        summary: 'blocked',
        details: {},
      }),
    ).toBe('security_blocked');
  });

  it('infers deterministic source from read_only routing tier', () => {
    expect(
      inferClassificationSource(
        { success: true, action: 'list_bookings', summary: 'ok', details: {} },
        'read_only',
      ),
    ).toBe('deterministic');
    expect(
      inferClassificationSource(
        {
          success: true,
          action: 'create_booking',
          summary: 'ok',
          details: { _complexityRoute: { tier: 'simple_mutate' } },
        },
        undefined,
      ),
    ).toBe('llm');
  });

  it('redacts sensitive params and PHI when HIPAA mode is on', () => {
    const redacted = redactTraceParams(
      { customerName: 'Anna', serviceName: 'Cut', notes: 'clinical follow-up' },
      true,
    );
    expect(redacted?.customerName).toBe('[REDACTED]');
    expect(redacted?.serviceName).toBe('Cut');
    expect(redacted?.notes).toBe('[REDACTED]');
  });

  it('buildAiCommandTracePayload captures classifier metadata', () => {
    const payload = buildAiCommandTracePayload({
      traceId: 'trace-1',
      businessId: 'biz-1',
      surface: 'dashboard',
      rawPrompt: 'show bookings today',
      result: {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {
          confidence: 0.91,
          pipelineTrace: [{ stage: 'classify', action: 'list_bookings', at: 't' }],
          params: { date: 'today' },
        },
      },
      latencyMs: 120,
    });
    expect(payload.traceId).toBe('trace-1');
    expect(payload.outcome).toBe('executed');
    expect(payload.confidence).toBe(0.91);
    expect(payload.pipelineStages).toHaveLength(1);
  });

  it('cosineSimilarity supports embedding-based retry detection', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
  });

  it('computePromptSimilarity flags lexical rephrases above threshold', () => {
    const score = computePromptSimilarity(
      'book anna for haircut tomorrow',
      'book anna for haircut tomorrow please',
    );
    expect(score).toBeGreaterThan(0.8);
    expect(tokenizePromptForSimilarity('')).toEqual([]);
  });

  it('aggregateTraceAccuracyAnalytics computes SLO and confusion matrix', () => {
    const now = new Date();
    const summary = aggregateTraceAccuracyAnalytics(
      [
        {
          traceId: 't1',
          surface: 'dashboard',
          locale: 'en',
          action: 'list_bookings',
          outcome: 'executed',
          confidence: 0.9,
          failureSignal: null,
          feedbackRating: null,
          correctedAction: null,
          rawPrompt: 'show bookings',
          createdAt: now,
        },
        {
          traceId: 't2',
          surface: 'dashboard',
          locale: 'en',
          action: 'create_booking',
          outcome: 'clarified',
          confidence: 0.4,
          failureSignal: 'suspected_miss',
          feedbackRating: 'down',
          correctedAction: 'list_bookings',
          rawPrompt: 'book anna',
          createdAt: now,
        },
      ],
      30,
    );
    expect(summary.totalCommands).toBe(2);
    expect(summary.clarifyRate).toBe(0.5);
    expect(summary.noClarifyCompletionRate).toBe(0.5);
    expect(summary.misclassificationRate).toBe(0.5);
    expect(summary.byIntent.list_bookings).toEqual({
      total: 1,
      accurate: 1,
      clarify: 0,
      failures: 0,
    });
    expect(summary.byIntent.create_booking).toEqual({
      total: 1,
      accurate: 0,
      clarify: 1,
      failures: 1,
    });
    expect(summary.byLocale.en).toEqual({ total: 2, accurate: 1 });
    expect(summary.bySurface.dashboard).toEqual({ total: 2, accurate: 1 });
    expect(summary.confusionMatrix[0]).toEqual({
      from: 'create_booking',
      to: 'list_bookings',
      count: 1,
      share: 1,
      retryCount: 1,
      undoCount: 0,
    });
    expect(summary.worstPrompts.length).toBeGreaterThan(0);
    expect(summary.worstPrompts[0]?.rank).toBe(1);
    expect(summary.worstPrompts[0]?.promptHash).toEqual(expect.any(String));
    expect(summary.clarifyQualityTarget).toBe(0.9);
    expect(summary.worstClarifies).toEqual(expect.any(Array));
    expect(summary.accuracySlo.target).toBe(0.99);
  });

  it('buildAccuracySlo computes rolling accuracy, trend, and weekly alert (acc-1.11)', () => {
    const baseRow = {
      traceId: 'slo',
      surface: 'dashboard' as const,
      locale: 'en' as const,
      action: 'list_bookings',
      outcome: 'executed' as const,
      confidence: 0.95,
      failureSignal: null,
      feedbackRating: null,
      correctedAction: null,
      rawPrompt: 'list bookings',
    };
    const inaccurate = {
      ...baseRow,
      traceId: 'slo-bad',
      outcome: 'clarified' as const,
      confidence: 0.4,
      failureSignal: 'suspected_miss' as const,
    };
    const dayAgo = (days: number) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - days);
      return d;
    };

    const currentWeekRows = Array.from({ length: 9 }, (_, index) => ({
      ...baseRow,
      traceId: `current-${index}`,
      createdAt: dayAgo(index % 6),
    }));
    currentWeekRows.push({
      ...inaccurate,
      createdAt: dayAgo(2),
    });

    const previousWeekRows = Array.from({ length: 10 }, (_, index) => ({
      ...baseRow,
      traceId: `prev-${index}`,
      createdAt: dayAgo(8 + (index % 6)),
    }));

    const slo = buildAccuracySlo([...currentWeekRows, ...previousWeekRows]);

    expect(slo.target).toBe(ACCURACY_SLO_TARGET);
    expect(slo.rolling7CommandCount).toBe(10);
    expect(slo.rolling7DayAccuracy).toBeCloseTo(0.9, 5);
    expect(slo.previous7DayAccuracy).toBeCloseTo(1, 5);
    expect(slo.weeklyDelta).toBeCloseTo(-0.1, 5);
    expect(slo.gapToTarget).toBeCloseTo(0.9 - ACCURACY_SLO_TARGET, 5);
    expect(slo.meetsTarget).toBe(false);
    expect(slo.alert).toBe(slo.weeklyDelta < ACCURACY_SLO_WEEKLY_ALERT_DELTA);
    expect(slo.trend).toHaveLength(7);
  });

  it('buildEvalHarvestCandidatesFromRows anonymizes and filters harvest signals (acc-2.1)', () => {
    const rows = [
      {
        traceId: 'miss',
        surface: 'dashboard',
        locale: 'en',
        action: 'create_booking',
        outcome: 'clarified' as const,
        confidence: 0.42,
        failureSignal: 'suspected_miss' as const,
        feedbackRating: null,
        correctedAction: 'list_bookings',
        rawPrompt: 'book anna@gmail.com tomorrow',
        createdAt: new Date(),
      },
      {
        traceId: 'good',
        surface: 'dashboard',
        locale: 'en',
        action: 'list_bookings',
        outcome: 'executed' as const,
        confidence: 0.95,
        failureSignal: null,
        feedbackRating: null,
        correctedAction: null,
        rawPrompt: 'show appointments today',
        createdAt: new Date(),
      },
      {
        traceId: 'down',
        surface: 'customer',
        locale: 'en',
        action: 'create_booking',
        outcome: 'executed' as const,
        confidence: 0.88,
        failureSignal: null,
        feedbackRating: 'down' as const,
        correctedAction: null,
        rawPrompt: 'book haircut tomorrow',
        createdAt: new Date(),
      },
    ];

    expect(isEvalHarvestCandidate(rows[0])).toBe(true);
    expect(isEvalHarvestCandidate(rows[1])).toBe(false);
    expect(isEvalHarvestCandidate(rows[2])).toBe(true);

    const harvest = buildEvalHarvestCandidatesFromRows(rows, 10);
    expect(harvest).toHaveLength(2);
    expect(harvest[0]?.promptSnippet).toContain('[email]');
    expect(harvest.some((entry) => entry.failureSignals.thumbs_down === 1)).toBe(
      true,
    );
  });

  it('buildWorstPromptsFeed ranks by failure count and exports eval drafts (acc-1.10)', () => {
    const rows = [
      {
        traceId: 'w1',
        surface: 'dashboard',
        locale: 'en',
        action: 'create_booking',
        outcome: 'clarified' as const,
        confidence: 0.4,
        failureSignal: 'suspected_miss' as const,
        feedbackRating: null,
        correctedAction: 'list_bookings',
        rawPrompt: 'book anna for haircut tomorrow',
        createdAt: new Date('2026-01-01T10:00:00Z'),
      },
      {
        traceId: 'w2',
        surface: 'dashboard',
        locale: 'en',
        action: 'create_booking',
        outcome: 'failed' as const,
        confidence: 0.35,
        failureSignal: null,
        feedbackRating: 'down' as const,
        correctedAction: null,
        rawPrompt: 'book anna for haircut tomorrow',
        createdAt: new Date('2026-01-02T10:00:00Z'),
      },
    ];

    const feed = buildWorstPromptsFeed(rows, 10);
    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({
      rank: 1,
      failureCount: 2,
      action: 'create_booking',
      correctedAction: 'list_bookings',
      failureSignals: {
        suspected_miss: 1,
        thumbs_down: 1,
        low_confidence: 2,
      },
    });

    const exported = exportWorstPromptsFromRows(rows, 30, 10);
    expect(exported.totalFailures).toBe(2);
    expect(exported.prompts[0]?.promptSnippet.length).toBeGreaterThan(0);

    const evalExport = exportWorstPromptsEvalDrafts(rows, 'biz-abc', 30, 10);
    expect(evalExport.drafts).toHaveLength(1);
    expect(evalExport.drafts[0]).toMatchObject({
      source: 'acc-1.10',
      surface: 'dashboard',
      locale: 'en',
      expect: {
        action: 'create_booking',
        rescuedAction: 'list_bookings',
      },
    });
    expect(evalExport.drafts[0]?.note).toContain('2 failures');
  });

  it('isWithinUndoWindow and isWrongExecutionCandidate follow acc-1.6', () => {
    const recent = new Date(Date.now() - 30_000);
    const stale = new Date(Date.now() - UNDO_WINDOW_MS - 1_000);
    expect(isWithinUndoWindow(recent)).toBe(true);
    expect(isWithinUndoWindow(stale)).toBe(false);
    expect(isWrongExecutionCandidate('executed', null, recent)).toBe(true);
    expect(isWrongExecutionCandidate('executed', 'suspected_miss', recent)).toBe(
      false,
    );
    expect(isWrongExecutionCandidate('clarified', null, recent)).toBe(false);
    expect(
      extractTaskIdFromResult({
        success: true,
        action: 'cancel_bookings',
        summary: 'ok',
        details: { taskId: 'task-1' },
      }),
    ).toBe('task-1');
  });

  it('isRetryCandidateOutcome and isTraceAccurate follow acc-1 rules', () => {
    expect(isRetryCandidateOutcome('clarified')).toBe(true);
    expect(isRetryCandidateOutcome('executed')).toBe(false);
    expect(isClarifyAbandonCandidate('clarified', null)).toBe(true);
    expect(isClarifyAbandonCandidate('clarified', 'suspected_miss')).toBe(false);
    expect(
      isClarifyFollowUpSuccess('create_booking', 'executed', 'create_booking'),
    ).toBe(true);
    expect(
      isClarifyFollowUpSuccess('create_booking', 'executed', 'list_bookings'),
    ).toBe(false);
    expect(
      isClarifyContinuation('create_booking', 'clarified', 'create_booking'),
    ).toBe(true);
    expect(
      isTraceAccurate({
        traceId: 'x',
        surface: 'dashboard',
        locale: 'en',
        action: 'x',
        outcome: 'clarified',
        confidence: 0.5,
        failureSignal: null,
        feedbackRating: null,
        correctedAction: null,
        rawPrompt: 'p',
        createdAt: new Date(),
      }),
    ).toBe(true);
    expect(normalizeFeedbackReason('wrong_date')).toBe('wrong_date');
    expect(normalizeFeedbackReason('nope')).toBeNull();
  });

  it('buildConfusionMatrix aggregates retry and undo correction sources (acc-1.9)', () => {
    const matrix = buildConfusionMatrix(
      [
        {
          traceId: 'retry',
          surface: 'dashboard',
          locale: 'en',
          action: 'create_booking',
          outcome: 'clarified',
          confidence: 0.4,
          failureSignal: 'suspected_miss',
          feedbackRating: null,
          correctedAction: 'list_bookings',
          rawPrompt: 'book anna',
          createdAt: new Date(),
        },
        {
          traceId: 'undo',
          surface: 'dashboard',
          locale: 'en',
          action: 'cancel_bookings',
          outcome: 'executed',
          confidence: 0.9,
          failureSignal: 'wrong_execution',
          feedbackRating: null,
          correctedAction: 'reschedule_booking',
          rawPrompt: 'cancel anna',
          createdAt: new Date(),
        },
        {
          traceId: 'undo-dup',
          surface: 'dashboard',
          locale: 'en',
          action: 'cancel_bookings',
          outcome: 'executed',
          confidence: 0.8,
          failureSignal: 'wrong_execution',
          feedbackRating: null,
          correctedAction: 'reschedule_booking',
          rawPrompt: 'cancel anna again',
          createdAt: new Date(),
        },
      ],
      10,
    );

    expect(matrix).toHaveLength(2);
    expect(matrix[0]).toMatchObject({
      from: 'cancel_bookings',
      to: 'reschedule_booking',
      count: 2,
      undoCount: 2,
      retryCount: 0,
    });
    expect(matrix[1]).toMatchObject({
      from: 'create_booking',
      to: 'list_bookings',
      count: 1,
      retryCount: 1,
      undoCount: 0,
    });
    expect(matrix[0]?.share).toBeCloseTo(2 / 3);
  });

  it('isUndoCorrectionCandidate accepts wrong_execution traces with a new action', () => {
    expect(
      isUndoCorrectionCandidate(
        {
          outcome: 'executed',
          failureSignal: 'wrong_execution',
          correctedAction: null,
          action: 'cancel_bookings',
        },
        'list_bookings',
      ),
    ).toBe(true);
    expect(
      isUndoCorrectionCandidate(
        {
          outcome: 'executed',
          failureSignal: 'wrong_execution',
          correctedAction: null,
          action: 'cancel_bookings',
        },
        'cancel_bookings',
      ),
    ).toBe(false);
  });
});
