import { Test, type TestingModule } from '@nestjs/testing';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { SEMANTIC_STEAL_GUARD_SCENARIOS } from './semantic-steal-guard.fixtures.js';
import { SEMANTIC_STEAL_FORBIDDEN_ACTIONS } from './semantic-steal-guard.util.js';
import { isUnderstandTraceOrdered } from './command-understanding-pipeline.util.js';
import { clearIntentAnchorBankCache } from './intent-anchor.bank.js';

describe('semantic steal guard pipeline integration (pipe-1.5.3 / acc-2.8)', () => {
  let moduleRef: TestingModule;
  let pipeline: CommandUnderstandingPipelineService;
  let semanticIntent: AiSemanticIntentService;
  let classifyMock: jest.Mock;

  const baseInput = {
    businessId: 'biz-steal-guard',
    surface: 'dashboard' as const,
    confidenceLow: 0.65,
    confidenceHigh: 0.82,
    employees: [
      { id: 'emp-1', name: 'Maria' },
      { id: 'emp-2', name: 'Gevorg Gasparyan' },
    ],
    customers: [{ id: 'cust-1', name: 'James' }],
    timeZone: 'Asia/Yerevan',
  };

  beforeEach(async () => {
    clearIntentAnchorBankCache();
    classifyMock = jest.fn().mockResolvedValue({
      action: 'unknown',
      params: {},
      reasoning: 'mock unknown for steal guard',
      confidence: 0.2,
    });

    moduleRef = await Test.createTestingModule({
      providers: [
        CommandUnderstandingPipelineService,
        AiPromptNormalizationService,
        FastIntentHeuristicsService,
        CommandComplexityRouterService,
        AiIntentRescueService,
        AiSemanticIntentService,
        AiRagService,
        {
          provide: IntentDecompositionService,
          useValue: { isCompoundPrompt },
        },
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
            isAvailableForBusiness: jest.fn().mockResolvedValue(false),
            embedText: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    pipeline = moduleRef.get(CommandUnderstandingPipelineService);
    semanticIntent = moduleRef.get(AiSemanticIntentService);
    await semanticIntent.onModuleInit();
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it.each(SEMANTIC_STEAL_GUARD_SCENARIOS)(
    '$id keeps $expectedAction after unknown classify + semantic escalation path',
    async (scenario) => {
      const matchSpy = jest.spyOn(semanticIntent, 'match');

      const result = await pipeline.understand({
        ...baseInput,
        effectivePrompt: scenario.prompt,
        surface: scenario.surface,
        classify: classifyMock,
      });

      expect(classifyMock).toHaveBeenCalled();
      expect(matchSpy).not.toHaveBeenCalled();
      expect(result.action).toBe(scenario.expectedAction);
      expect(
        SEMANTIC_STEAL_FORBIDDEN_ACTIONS.includes(
          result.action as (typeof SEMANTIC_STEAL_FORBIDDEN_ACTIONS)[number],
        ),
      ).toBe(false);
      expect(
        result.candidates.some(
          (candidate) =>
            candidate.source === 'semantic_match' &&
            SEMANTIC_STEAL_FORBIDDEN_ACTIONS.includes(
              candidate.action as (typeof SEMANTIC_STEAL_FORBIDDEN_ACTIONS)[number],
            ),
        ),
      ).toBe(false);
      expect(
        result.trace.find((t) => t.stage === 'semantic_match')?.detail,
      ).toContain('domain-protected');
      expect(isUnderstandTraceOrdered(result.trace)).toBe(true);
      if (scenario.rescueReason) {
        expect(result.trace.find((t) => t.stage === 'rescue')?.action).toBe(
          scenario.expectedAction,
        );
      }

      matchSpy.mockRestore();
    },
  );
});
