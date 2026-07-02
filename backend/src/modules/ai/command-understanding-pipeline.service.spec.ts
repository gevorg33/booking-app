import { Test } from '@nestjs/testing';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';
import { isUnderstandTraceOrdered } from './command-understanding-pipeline.util.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';

describe('CommandUnderstandingPipelineService (pipe-1.0.2 / pipe-1.0.3)', () => {
  let pipeline: CommandUnderstandingPipelineService;
  let semanticMatch: jest.Mock;
  let intentRescue: jest.Mock;

  const baseInput = {
    businessId: 'biz-1',
    effectivePrompt: 'book first available tomorrow',
    surface: 'dashboard' as const,
    confidenceLow: 0.65,
    confidenceHigh: 0.82,
    employees: [{ id: 'emp-1', name: 'Anna' }],
    customers: [{ id: 'cust-1', name: 'James' }],
    timeZone: 'Asia/Yerevan',
  };

  function buildTestingModule() {
    return Test.createTestingModule({
      providers: [
        CommandUnderstandingPipelineService,
        AiPromptNormalizationService,
        FastIntentHeuristicsService,
        CommandComplexityRouterService,
        {
          provide: IntentDecompositionService,
          useValue: {
            isCompoundPrompt: (prompt: string) =>
              /\band then\b|;\s*/i.test(prompt),
          },
        },
        {
          provide: AiSemanticIntentService,
          useValue: { match: semanticMatch },
        },
        {
          provide: AiIntentRescueService,
          useValue: { rescue: intentRescue },
        },
      ],
    });
  }

  beforeEach(async () => {
    semanticMatch = jest.fn();
    intentRescue = jest.fn().mockReturnValue(null);

    const moduleRef = await buildTestingModule().compile();
    pipeline = moduleRef.get(CommandUnderstandingPipelineService);
  });

  it('constructs through Nest DI (ai.module providers graph)', async () => {
    const moduleRef = await buildTestingModule().compile();
    expect(moduleRef.get(CommandUnderstandingPipelineService)).toBeInstanceOf(
      CommandUnderstandingPipelineService,
    );
    expect(moduleRef.get(AiPromptNormalizationService)).toBeInstanceOf(
      AiPromptNormalizationService,
    );
  });

  function traceStages(
    result: Awaited<ReturnType<typeof pipeline.understand>>,
  ) {
    return result.trace.map((entry) => entry.stage);
  }

  it('records all understand stages in order', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'book first available tomorrow',
      classify: async (ctx) => {
        expect(ctx.normalizedPrompt).toBe('book first available tomorrow');
        expect(ctx.classifierContext).toBeNull();
        return {
          action: 'create_booking',
          params: { bookingFirstAvailable: true },
          reasoning: 'classify',
          confidence: 0.99,
        };
      },
    });

    expect(traceStages(result)).toEqual([...PIPELINE_UNDERSTAND_STAGE_ORDER]);
    expect(isUnderstandTraceOrdered(result.trace)).toBe(true);
    expect(result.status).toBe('resolved');
    expect(result.action).toBe('create_booking');
    expect(result.context.normalizedPrompt).toBe(
      'book first available tomorrow',
    );
    expect(semanticMatch).not.toHaveBeenCalled();
  });

  it('normalize runs first and passes classifierContext to classify for HY prompts', async () => {
    const hyPrompt = 'Ցույց տուր ամրագրումները վաղը';
    let receivedContext:
      | Awaited<
          ReturnType<CommandUnderstandingPipelineService['understand']>
        >['context']
      | null = null;

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: hyPrompt,
      classify: async (ctx) => {
        receivedContext = ctx;
        return {
          action: 'show_appointments',
          params: {},
          reasoning: 'hy classify',
          confidence: 0.9,
        };
      },
    });

    expect(result.trace[0]?.stage).toBe('normalize');
    expect(result.context.method).toBe('multilingual');
    expect(result.context.classifierContext).toBeTruthy();
    expect(receivedContext?.normalizedPrompt).toBe(hyPrompt);
    expect(receivedContext?.classifierContext).toBe(
      result.context.classifierContext,
    );
  });

  it('skips semantic_match when confidence gate passes', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      classify: async () => ({
        action: 'show_appointments',
        params: {},
        reasoning: 'high confidence',
        confidence: 0.95,
      }),
    });

    const semanticTrace = result.trace.find(
      (t) => t.stage === 'semantic_match',
    );
    expect(semanticTrace?.action).toBe('skipped');
    expect(semanticMatch).not.toHaveBeenCalled();
    expect(result.gate.decision).toBe('skip_semantic');
  });

  it('pipe-1.3.3 uses aiConfig confidence bands instead of util defaults', async () => {
    semanticMatch.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.88,
      anchorId: 'en-test',
      paramHints: {},
      reasoning: 'semantic',
      rescueReason: 'semantic_match',
    });

    const result = await pipeline.understand({
      ...baseInput,
      confidenceLow: 0.55,
      confidenceHigh: 0.85,
      classify: async () => ({
        action: 'create_booking',
        params: {},
        reasoning: 'medium',
        confidence: 0.6,
      }),
    });

    expect(semanticMatch).not.toHaveBeenCalled();
    expect(result.gate.lowThreshold).toBe(0.55);
    expect(result.gate.highThreshold).toBe(0.85);
    expect(result.gate.decision).toBe('ambiguous_band');
    expect(result.gate.shouldEscalateToSemantic).toBe(false);
  });

  it.each([
    {
      id: 'pipe-1.3.2-high-confidence-skips-semantic',
      classify: {
        action: 'show_appointments',
        params: {},
        reasoning: 'high',
        confidence: 0.82,
      },
      expectSemanticCalled: false,
      expectedGateDecision: 'skip_semantic' as const,
    },
    {
      id: 'pipe-1.3.2-unknown-at-0.20-escalates',
      classify: {
        action: 'unknown',
        params: {},
        reasoning: 'unclear',
        confidence: 0.2,
      },
      expectSemanticCalled: true,
      expectedGateDecision: 'escalate_semantic' as const,
    },
    {
      id: 'pipe-1.3.2-below-low-0.64-escalates',
      classify: {
        action: 'create_booking',
        params: {},
        reasoning: 'weak',
        confidence: 0.64,
      },
      expectSemanticCalled: true,
      expectedGateDecision: 'escalate_semantic' as const,
    },
  ])(
    '$id',
    async ({ classify, expectSemanticCalled, expectedGateDecision }) => {
      semanticMatch.mockResolvedValue({
        action: 'create_booking',
        confidence: 0.88,
        anchorId: 'en-test',
        paramHints: {},
        reasoning: 'semantic',
        rescueReason: 'semantic_match',
      });

      const result = await pipeline.understand({
        ...baseInput,
        classify: async () => classify,
      });

      if (expectSemanticCalled) {
        expect(semanticMatch).toHaveBeenCalled();
      } else {
        expect(semanticMatch).not.toHaveBeenCalled();
        expect(
          result.trace.find((t) => t.stage === 'semantic_match')?.action,
        ).toBe('skipped');
      }
      expect(result.gate.decision).toBe(expectedGateDecision);
      expect(result.gate.shouldEscalateToSemantic).toBe(expectSemanticCalled);
    },
  );

  it('runs semantic_match when classify is unknown with low confidence', async () => {
    semanticMatch.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.88,
      anchorId: 'en-implied-trim-need',
      paramHints: {},
      reasoning: 'semantic paraphrase',
      rescueReason: 'semantic_match',
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'my hair is getting pretty long need a trim soon',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'unclear',
        confidence: 0.2,
      }),
    });

    expect(semanticMatch).toHaveBeenCalled();
    expect(result.trace.find((t) => t.stage === 'semantic_match')?.action).toBe(
      'create_booking',
    );
    expect(result.action).toBe('create_booking');
    expect(result.candidates.some((c) => c.source === 'semantic_match')).toBe(
      true,
    );
  });

  it('applies rescue after rerank', async () => {
    intentRescue.mockReturnValue({
      action: 'check_providers_for_service',
      params: { allProviders: true },
      reasoning: 'domain rescue',
      rescued: true,
      rescueReason: 'team_wide_availability',
    });

    const result = await pipeline.understand({
      ...baseInput,
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'missed',
        confidence: 0.3,
      }),
    });

    expect(intentRescue).toHaveBeenCalled();
    expect(result.trace.find((t) => t.stage === 'rescue')?.action).toBe(
      'check_providers_for_service',
    );
    expect(result.candidates.some((c) => c.source === 'rescue')).toBe(true);
  });

  it('runs parallel classify + resolveRoute', async () => {
    const route: ComplexityRoute = { tier: 'read_only', reason: 'list query' };
    let routeCalled = false;
    let classifyCalled = false;

    const result = await pipeline.understand({
      ...baseInput,
      resolveRoute: async () => {
        routeCalled = true;
        return route;
      },
      classify: async () => {
        classifyCalled = true;
        return {
          action: 'show_appointments',
          params: {},
          reasoning: 'list',
          confidence: 0.9,
        };
      },
    });

    expect(routeCalled).toBe(true);
    expect(classifyCalled).toBe(true);
    expect(result.complexityRoute).toEqual(route);
    expect(result.trace.find((t) => t.stage === 'classify')?.detail).toContain(
      'parallel route',
    );
  });

  it('invokes narrowReclassify when top-two are ambiguous', async () => {
    semanticMatch.mockResolvedValue({
      action: 'check_providers_for_service',
      confidence: 0.69,
      anchorId: 'en-check-who-free',
      paramHints: {},
      reasoning: 'semantic availability',
      rescueReason: 'semantic_match',
    });

    const narrowReclassify = jest.fn().mockResolvedValue({
      action: 'create_booking',
      params: { bookingFirstAvailable: true },
      reasoning: 'narrow',
      confidence: 0.93,
    });

    const result = await pipeline.understand({
      ...baseInput,
      confidenceLow: 0.75,
      narrowReclassify,
      classify: async () => ({
        action: 'create_booking',
        params: {},
        reasoning: 'classify',
        confidence: 0.7,
      }),
    });

    expect(narrowReclassify).toHaveBeenCalledWith(
      expect.arrayContaining(['create_booking', 'check_providers_for_service']),
      expect.objectContaining({
        normalizedPrompt: 'book first available tomorrow',
      }),
    );
    const shortlist = narrowReclassify.mock.calls[0]?.[0] as string[];
    expect(shortlist.length).toBeLessThanOrEqual(10);
    expect(shortlist.length).toBeGreaterThan(2);
    expect(
      result.trace.find((t) => t.stage === 'narrow_reclassify')?.action,
    ).toBe('create_booking');
  });

  it('fast_heuristics stage emits read-only IntentCandidate before classify (pipe-1.2.1)', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Show appointments today',
      classify: async () => ({
        action: 'show_appointments',
        params: {},
        reasoning: 'classify',
        confidence: 0.99,
      }),
    });

    const fastTrace = result.trace.find((t) => t.stage === 'fast_heuristics');
    expect(fastTrace?.action).toBe('show_appointments');
    expect(
      result.candidates.some(
        (candidate) =>
          candidate.source === 'fast_heuristic' &&
          candidate.action === 'show_appointments',
      ),
    ).toBe(true);
  });

  it('pipe-1.4.6 passes surface-restricted allowedActions to semantic match', async () => {
    semanticMatch.mockResolvedValue(null);

    await pipeline.understand({
      ...baseInput,
      surface: 'public',
      effectivePrompt: 'they need regular work time on the calendar',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    expect(semanticMatch).toHaveBeenCalledTimes(1);
    const call = semanticMatch.mock.calls[0]?.[0] as {
      allowedActions?: string[];
      surface: string;
    };
    expect(call.surface).toBe('public');
    expect(call.allowedActions).toEqual(
      expect.arrayContaining(['create_booking', 'check_providers_for_service']),
    );
    expect(call.allowedActions).not.toContain('create_direct_schedule');
  });

  it('pipe-1.4.6 narrows allowedActions when session lastAction is check_providers_for_service', async () => {
    semanticMatch.mockResolvedValue(null);

    await pipeline.understand({
      ...baseInput,
      lastAction: 'check_providers_for_service',
      effectivePrompt: 'book whoever is free first',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    const call = semanticMatch.mock.calls[0]?.[0] as {
      allowedActions?: string[];
      lastAction?: string;
    };
    expect(call.lastAction).toBe('check_providers_for_service');
    expect(call.allowedActions).toEqual(
      expect.arrayContaining([
        'check_providers_for_service',
        'create_booking',
        'book_nearest_slot',
      ]),
    );
    expect(call.allowedActions).not.toContain('create_direct_schedule');
  });

  it('pipe-1.4.6 skips semantic match when surface has no semantic anchors', async () => {
    semanticMatch.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.9,
      anchorId: 'en-book-gap-soonest',
      paramHints: {},
      reasoning: 'semantic',
      rescueReason: 'semantic_match',
    });

    const result = await pipeline.understand({
      ...baseInput,
      surface: 'provider',
      effectivePrompt: 'book first available tomorrow',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    expect(semanticMatch).not.toHaveBeenCalled();
    const semanticTrace = result.trace.find(
      (t) => t.stage === 'semantic_match',
    );
    expect(semanticTrace?.action).toBe('skipped');
    expect(semanticTrace?.detail).toContain('no semantic anchors');
  });

  it('pipe-1.4.5 merges classifier, semantic, and heuristic candidates at rerank', async () => {
    semanticMatch.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.88,
      anchorId: 'en-implied-trim',
      paramHints: { bookingFirstAvailable: true },
      reasoning: 'semantic paraphrase',
      rescueReason: 'semantic_match',
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Show appointments today',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    const sources = new Set(
      result.candidates.map((candidate) => candidate.source),
    );
    expect(sources.has('fast_heuristic')).toBe(true);
    expect(sources.has('classifier')).toBe(true);
    expect(sources.has('semantic_match')).toBe(true);

    const rerankTrace = result.trace.find((entry) => entry.stage === 'rerank');
    expect(rerankTrace?.detail).toContain('merged=3');
    expect(result.action).toBe('create_booking');
    expect(
      result.candidates.some(
        (candidate) => candidate.source === 'semantic_match',
      ),
    ).toBe(true);
  });

  it('phase 1 defers fast_heuristic when confident classifier disagrees (pipe-1.2.2)', async () => {
    const classify = jest.fn().mockResolvedValue({
      action: 'create_booking',
      params: {},
      reasoning: 'classify',
      confidence: 0.95,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Show appointments today',
      classify,
    });

    expect(classify).toHaveBeenCalled();
    expect(result.action).toBe('create_booking');
    expect(result.trace.find((t) => t.stage === 'rerank')?.detail).toContain(
      'phase1',
    );
    expect(
      result.candidates.some(
        (c) =>
          c.source === 'fast_heuristic' && c.action === 'show_appointments',
      ),
    ).toBe(true);
  });

  it('high-confidence heuristic wins re-rank when classifier is unknown (pipe-1.2.2)', async () => {
    semanticMatch.mockResolvedValue(null);

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Who can do facemassage today?',
      employees: [{ id: 'emp-1', name: 'Gevorg Gasparyan' }],
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    expect(result.action).toBe('check_providers_for_service');
    expect(
      result.candidates.some(
        (c) =>
          c.source === 'fast_heuristic' &&
          c.action === 'check_providers_for_service' &&
          c.confidence >= 0.9,
      ),
    ).toBe(true);
    expect(result.trace.find((t) => t.stage === 'classify')?.action).toBe(
      'unknown',
    );
  });

  it('tier-only heuristic below 0.90 does not feed re-rank (pipe-1.2.2)', async () => {
    semanticMatch.mockResolvedValue(null);

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Summarize utilization this week',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    const fastTrace = result.trace.find((t) => t.stage === 'fast_heuristics');
    expect(fastTrace?.detail).toContain('rerank_eligible=0');
    expect(
      result.candidates.filter(
        (c) => c.source === 'fast_heuristic' && c.confidence >= 0.9,
      ),
    ).toHaveLength(0);
  });

  it('fast_heuristics stage emits compound routing candidate (pipe-1.2.1)', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Cancel appointments; clear schedule for Anna',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'compound',
        confidence: 0.3,
      }),
    });

    const fastTrace = result.trace.find((t) => t.stage === 'fast_heuristics');
    expect(fastTrace?.action).toBe('unknown');
    expect(
      result.candidates.some(
        (candidate) =>
          candidate.source === 'fast_heuristic' &&
          candidate.paramHints?.complexityTier === 'compound',
      ),
    ).toBe(true);
  });

  it('pipe-1.5.2 passes semantic winner param hints into rescue (not action)', async () => {
    semanticMatch.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.88,
      anchorId: 'en-implied-trim',
      paramHints: { bookingFirstAvailable: true },
      reasoning: 'semantic paraphrase',
      rescueReason: 'semantic_match',
    });
    intentRescue.mockImplementation((input) => {
      expect(input.semanticParamHints).toEqual({
        bookingFirstAvailable: true,
      });
      return {
        action: 'create_booking',
        params: {},
        reasoning: 'domain rescue',
        rescued: true,
        rescueReason: 'create_booking_pattern',
      };
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'schedule anna for a trim tomorrow',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    expect(intentRescue).toHaveBeenCalled();
    expect(result.params.bookingFirstAvailable).toBe(true);
    expect(result.trace.find((t) => t.stage === 'rescue')?.detail).toContain(
      'semanticHints=bookingFirstAvailable',
    );
  });

  it('pipe-1.7.2 structural_enrich defaults work-time periods without hours', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Create work time for Gevorg next week',
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      classify: async () => ({
        action: 'create_direct_schedule',
        params: { date: '2026-06-16' },
        reasoning: 'classify',
        confidence: 0.9,
      }),
    });

    expect(result.status).toBe('resolved');
    expect(result.params.timeFrom).toBe('09:00');
    expect(result.params.timeTo).toBe('19:00');
    expect(result.params.periods).toEqual([
      { startTime: '09:00', endTime: '19:00', type: 'service_block' },
    ]);
    expect(
      result.trace.find((t) => t.stage === 'structural_enrich')?.detail,
    ).toContain('workTimeDefault');
  });

  it('pipe-1.7.1 structural_enrich applies date range and employee matching', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Clear Gevorg schedule for the next 5 days',
      employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
      classify: async () => ({
        action: 'clear_schedule',
        params: {},
        reasoning: 'classify',
        confidence: 0.9,
      }),
    });

    expect(result.status).toBe('resolved');
    expect(result.params.dateFrom).toBeTruthy();
    expect(result.params.dateTo).toBeTruthy();
    expect(result.params.employeeName).toBe('Gevorg Gasparyan');
    expect(
      result.trace.find((t) => t.stage === 'structural_enrich')?.detail,
    ).toContain('dateRange');
  });

  it('pipe-1.6.2 self_verify clarify on uncorrectable fail + low confidence', async () => {
    intentRescue.mockReturnValue(null);

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Block Gevorg schedule tomorrow',
      classify: async () => ({
        action: 'create_booking',
        params: {},
        reasoning: 'low classify',
        confidence: 0.42,
      }),
    });

    expect(result.status).toBe('clarify');
    expect(result.action).toBe('create_booking');
    expect(result.confidence).toBeLessThan(0.55);
    expect(result.clarifyFields).toEqual(['intentChoice']);
    expect(result.clarifySummary).toContain('schedule');
    expect(result.clarifySuggestions?.length).toBeGreaterThanOrEqual(2);
    expect(
      result.trace.find((t) => t.stage === 'self_verify')?.detail,
    ).toContain('clarify:schedule_vocab_mismatch');
    expect(
      result.trace.find((t) => t.stage === 'structural_enrich')?.detail,
    ).toContain('skipped; self_verify clarify');
  });

  it('pipe-1.6.1 self_verify corrects booking vs clear mismatch', async () => {
    intentRescue.mockReturnValue({
      action: 'create_booking',
      params: {},
      reasoning: 'wrong rescue',
      rescued: true,
      rescueReason: 'create_booking_pattern',
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Clear Gevorg schedule for tomorrow',
      classify: async () => ({
        action: 'unknown',
        params: {},
        reasoning: 'miss',
        confidence: 0.2,
      }),
    });

    expect(result.action).toBe('clear_schedule');
    expect(
      result.trace.find((t) => t.stage === 'self_verify')?.detail,
    ).toContain('booking_vs_clear_mismatch');
  });

  it('returns blocked status for empty prompt', async () => {
    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: '   ',
      classify: async () => null,
    });

    expect(result.status).toBe('blocked');
    expect(result.blockReason).toContain('empty prompt');
    expect(isUnderstandTraceOrdered(result.trace)).toBe(true);
  });
});
