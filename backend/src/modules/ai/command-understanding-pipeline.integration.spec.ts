import { Test, type TestingModule } from '@nestjs/testing';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import { AiSettingsService } from './ai-settings.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { SEMANTIC_PARAPHRASE_SCENARIOS } from './ai-semantic-intent.fixtures.js';
import { PIPELINE_UNDERSTAND_STAGE_ORDER } from './command-understanding.types.js';
import { isUnderstandTraceOrdered } from './command-understanding-pipeline.util.js';
import { clearIntentAnchorBankCache } from './intent-anchor.bank.js';
import * as semanticUtil from './ai-semantic-intent.util.js';
import { buildDeterministicSemanticEmbedMock } from './ai-semantic-intent.embedding-mock.util.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';

const ESCALATION_SCENARIOS = SEMANTIC_PARAPHRASE_SCENARIOS.filter(
  (scenario) => scenario.classifyAction === 'unknown',
);

const EN_ESCALATION_SCENARIOS = ESCALATION_SCENARIOS.filter((scenario) =>
  scenario.id.startsWith('en-'),
);

const MULTILINGUAL_ESCALATION_SCENARIOS = ESCALATION_SCENARIOS.filter(
  (scenario) => scenario.id.startsWith('hy-') || scenario.id.startsWith('ru-'),
);

describe('CommandUnderstandingPipelineService (integration pipe-1.0.5)', () => {
  let moduleRef: TestingModule;
  let pipeline: CommandUnderstandingPipelineService;
  let semanticIntent: AiSemanticIntentService;
  let classifyMock: jest.Mock<Promise<ClassifiedIntent | null>>;
  let embedTextMock: jest.Mock;
  let isAvailableForBusinessMock: jest.Mock;

  const baseInput = {
    businessId: 'biz-pipe-int',
    surface: 'dashboard' as const,
    confidenceLow: 0.65,
    confidenceHigh: 0.82,
    employees: [{ id: 'emp-1', name: 'Anna' }],
    customers: [{ id: 'cust-1', name: 'James' }],
    timeZone: 'Asia/Yerevan',
  };

  function traceStages(
    result: Awaited<
      ReturnType<CommandUnderstandingPipelineService['understand']>
    >,
  ) {
    return result.trace.map((entry) => entry.stage);
  }

  function assertOrderedUnderstandStages(
    result: Awaited<
      ReturnType<CommandUnderstandingPipelineService['understand']>
    >,
  ) {
    expect(traceStages(result)).toEqual([...PIPELINE_UNDERSTAND_STAGE_ORDER]);
    expect(isUnderstandTraceOrdered(result.trace)).toBe(true);
  }

  async function buildModule(initSemantic = true) {
    classifyMock = jest.fn();
    embedTextMock = buildDeterministicSemanticEmbedMock();
    isAvailableForBusinessMock = jest.fn().mockResolvedValue(false);

    moduleRef = await Test.createTestingModule({
      providers: [
        CommandUnderstandingPipelineService,
        AiPromptNormalizationService,
        FastIntentHeuristicsService,
        CommandComplexityRouterService,
        {
          provide: IntentDecompositionService,
          useValue: { isCompoundPrompt },
        },
        AiSemanticIntentService,
        AiRagService,
        AiIntentRescueService,
        {
          provide: AiSettingsService,
          useValue: {
            getSettings: jest.fn().mockResolvedValue({
              rag: { enabled: false, documents: [] },
            }),
          },
        },
        {
          provide: OpenAiGatewayService,
          useValue: {
            isAvailableForBusiness: isAvailableForBusinessMock,
            embedText: embedTextMock,
          },
        },
      ],
    }).compile();

    pipeline = moduleRef.get(CommandUnderstandingPipelineService);
    semanticIntent = moduleRef.get(AiSemanticIntentService);
    if (initSemantic) {
      await semanticIntent.onModuleInit();
    }
  }

  beforeEach(async () => {
    clearIntentAnchorBankCache();
    jest.restoreAllMocks();
    await buildModule();
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('normalize runs first; classify receives PipelineContext with i18n (pipe-1.1.1)', async () => {
    const hyPrompt =
      MULTILINGUAL_ESCALATION_SCENARIOS[0]?.prompt ??
      'Ցույց տուր ամրագրումները վաղը';
    classifyMock.mockResolvedValue({
      action: 'show_appointments',
      params: {},
      reasoning: 'hy mock classify',
      confidence: 0.9,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: hyPrompt,
      classify: classifyMock,
    });

    expect(result.trace[0]?.stage).toBe('normalize');
    expect(result.context.method).toBe('multilingual');
    expect(result.context.classifierContext).toBeTruthy();
    expect(classifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        originalPrompt: hyPrompt,
        normalizedPrompt: hyPrompt,
        classifierContext: result.context.classifierContext,
        method: 'multilingual',
      }),
    );
  });

  it('mocked high-confidence classify: ordered stages, embed not used', async () => {
    classifyMock.mockResolvedValue({
      action: 'create_booking',
      params: { bookingFirstAvailable: true },
      reasoning: 'mock classify',
      confidence: 0.99,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'book first available tomorrow',
      classify: classifyMock,
    });

    assertOrderedUnderstandStages(result);
    expect(classifyMock).toHaveBeenCalledTimes(1);
    expect(classifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        normalizedPrompt: 'book first available tomorrow',
        classifierContext: null,
        method: 'passthrough',
      }),
    );
    expect(result.action).toBe('create_booking');
    expect(result.trace.find((t) => t.stage === 'semantic_match')?.action).toBe(
      'skipped',
    );
    expect(embedTextMock).not.toHaveBeenCalled();
  });

  it.each(EN_ESCALATION_SCENARIOS)(
    'mocked unknown classify + real semantic matcher: $id',
    async (scenario) => {
      classifyMock.mockResolvedValue({
        action: scenario.classifyAction ?? 'unknown',
        params: {},
        reasoning: 'mock classify unknown',
        confidence: scenario.classifyConfidence ?? 0.2,
      });

      const result = await pipeline.understand({
        ...baseInput,
        effectivePrompt: scenario.prompt,
        surface: scenario.surface,
        classify: classifyMock,
      });

      assertOrderedUnderstandStages(result);
      expect(classifyMock).toHaveBeenCalled();
      expect(
        result.trace.find((t) => t.stage === 'semantic_match')?.action,
      ).toBe(scenario.expectedAction);
      expect(result.action).toBe(scenario.expectedAction);
      if (scenario.expectedParamHints) {
        for (const [key, value] of Object.entries(
          scenario.expectedParamHints,
        )) {
          expect(result.params[key]).toBe(value);
        }
      }
    },
  );

  it.each(MULTILINGUAL_ESCALATION_SCENARIOS)(
    'mocked unknown classify + multilingual semantic stages: $id',
    async (scenario) => {
      classifyMock.mockResolvedValue({
        action: scenario.classifyAction ?? 'unknown',
        params: {},
        reasoning: 'mock classify unknown',
        confidence: scenario.classifyConfidence ?? 0.2,
      });

      const result = await pipeline.understand({
        ...baseInput,
        effectivePrompt: scenario.prompt,
        surface: scenario.surface,
        classify: classifyMock,
      });

      assertOrderedUnderstandStages(result);
      expect(classifyMock).toHaveBeenCalled();
      expect(
        result.candidates.some(
          (candidate) => candidate.source === 'semantic_match',
        ),
      ).toBe(true);
    },
  );

  it('mocked classify + real semantic resolves availability before rescue stage', async () => {
    classifyMock.mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'mock classify',
      confidence: 0.25,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'Who has a gap soonest tomorrow for massage',
      classify: classifyMock,
    });

    assertOrderedUnderstandStages(result);
    expect(result.action).toBe('check_providers_for_service');
    expect(result.candidates.some((c) => c.source === 'semantic_match')).toBe(
      true,
    );
    expect(result.trace.find((t) => t.stage === 'semantic_match')?.action).toBe(
      'check_providers_for_service',
    );
    expect(result.trace.find((t) => t.stage === 'rescue')).toBeDefined();
  });

  it('mocked classify with parallel resolveRoute: classify stage records route', async () => {
    const route: ComplexityRoute = { tier: 'read_only', reason: 'list query' };
    const resolveRoute = jest.fn().mockResolvedValue(route);
    classifyMock.mockResolvedValue({
      action: 'show_appointments',
      params: {},
      reasoning: 'mock list',
      confidence: 0.91,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'show appointments today',
      classify: classifyMock,
      resolveRoute,
    });

    assertOrderedUnderstandStages(result);
    expect(resolveRoute).toHaveBeenCalled();
    expect(classifyMock).toHaveBeenCalled();
    expect(result.complexityRoute).toEqual(route);
    expect(result.trace.find((t) => t.stage === 'classify')?.detail).toContain(
      'parallel route',
    );
  });

  it('pipe-1.4.3 cosine semantic match when embedding API enabled', async () => {
    await moduleRef.close();
    clearIntentAnchorBankCache();
    await buildModule(false);

    isAvailableForBusinessMock.mockResolvedValue(true);
    jest
      .spyOn(semanticUtil, 'shouldUseDeterministicSemanticFallback')
      .mockReturnValue(false);

    classifyMock.mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'mock classify',
      confidence: 0.2,
    });

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: 'My hair is getting pretty long, need a trim soon',
      classify: classifyMock,
    });

    assertOrderedUnderstandStages(result);
    expect(embedTextMock).toHaveBeenCalled();
    expect(
      embedTextMock.mock.calls.some(
        (call) => call[0]?.operation === 'semantic_intent_match',
      ),
    ).toBe(true);
    expect(result.action).toBe('create_booking');
  });

  it('blocked prompt still emits full ordered understand trace', async () => {
    classifyMock.mockResolvedValue(null);

    const result = await pipeline.understand({
      ...baseInput,
      effectivePrompt: '   ',
      classify: classifyMock,
    });

    assertOrderedUnderstandStages(result);
    expect(result.status).toBe('blocked');
    expect(classifyMock).not.toHaveBeenCalled();
  });
});
