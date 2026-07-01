import { Test, type TestingModule } from '@nestjs/testing';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { buildPipelineContext } from './command-understanding-context.util.js';
import {
  PROMPT_NORMALIZE_CACHE_SCENARIOS,
  PROMPT_NORMALIZE_EMPTY_SCENARIOS,
  PROMPT_NORMALIZE_PASSTHROUGH_SCENARIOS,
} from './command-understanding-normalize.fixtures.js';

const USER_ID = 'user-norm-spec';

describe('command-understanding normalize (pipe-1.1.2)', () => {
  describe('AiPromptNormalizationService', () => {
    let service: AiPromptNormalizationService;

    beforeEach(() => {
      service = new AiPromptNormalizationService();
    });

    it.each(PROMPT_NORMALIZE_PASSTHROUGH_SCENARIOS)(
      'passthrough $id ($language)',
      async (scenario) => {
        const result = await service.normalizeForClassifier(
          scenario.businessId,
          USER_ID,
          scenario.prompt,
        );

        expect(result.method).toBe(scenario.expectedMethod);
        expect(result.normalized).toBe(scenario.expectedNormalized);
        expect(result.original).toBe(scenario.expectedNormalized);

        if (scenario.expectClassifierContext) {
          expect(result.classifierContext).toBeTruthy();
          expect(result.classifierContext).toContain(scenario.prompt);
          if (scenario.language === 'hy' || scenario.language === 'ru') {
            expect(result.classifierContext).toContain('Armenian/Russian');
          }
        } else {
          expect(result.classifierContext).toBeNull();
        }

        const context = buildPipelineContext(scenario.prompt, result);
        expect(context.normalizedPrompt).toBe(scenario.expectedNormalized);
        expect(context.method).toBe(scenario.expectedMethod);
        expect(context.classifierContext).toBe(result.classifierContext);
      },
    );

    it.each(PROMPT_NORMALIZE_EMPTY_SCENARIOS)(
      'empty prompt $id',
      async (scenario) => {
        const result = await service.normalizeForClassifier(
          scenario.businessId,
          USER_ID,
          scenario.prompt,
        );

        expect(result.method).toBe('passthrough');
        expect(result.normalized).toBe('');
        expect(result.original).toBe('');
        expect(result.classifierContext).toBeNull();

        const context = buildPipelineContext(scenario.prompt, result);
        expect(context.normalizedPrompt).toBe('');
        expect(context.classifierContext).toBeNull();
      },
    );

    it.each(PROMPT_NORMALIZE_CACHE_SCENARIOS)(
      'cache hit returns same object reference $id',
      async (scenario) => {
        const first = await service.normalizeForClassifier(
          scenario.businessId,
          USER_ID,
          scenario.prompt,
        );
        const second = await service.normalizeForClassifier(
          scenario.businessId,
          USER_ID,
          scenario.prompt,
        );

        expect(first).toBe(second);
        expect(first.method).toBe('multilingual');
        expect(first.normalized).toBe(scenario.prompt);
        expect(first.classifierContext).toBeTruthy();
      },
    );

    it('does not share cache across businesses for the same prompt', async () => {
      const scenario = PROMPT_NORMALIZE_CACHE_SCENARIOS[0];
      const first = await service.normalizeForClassifier(
        scenario.businessId,
        USER_ID,
        scenario.prompt,
      );
      const second = await service.normalizeForClassifier(
        'biz-norm-cache-other',
        USER_ID,
        scenario.prompt,
      );

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('CommandUnderstandingPipelineService stageNormalize', () => {
    let moduleRef: TestingModule;
    let pipeline: CommandUnderstandingPipelineService;
    let normalizationService: AiPromptNormalizationService;
    let classifyMock: jest.Mock;

    const pipelineBase = {
      surface: 'dashboard' as const,
      confidenceLow: 0.65,
      confidenceHigh: 0.82,
      employees: [{ id: 'emp-1', name: 'Anna' }],
      customers: [{ id: 'cust-1', name: 'James' }],
      timeZone: 'Asia/Yerevan',
    };

    beforeEach(async () => {
      classifyMock = jest.fn().mockResolvedValue({
        action: 'show_appointments',
        params: {},
        reasoning: 'mock classify',
        confidence: 0.9,
      });

      moduleRef = await Test.createTestingModule({
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
            useValue: { match: jest.fn() },
          },
          {
            provide: AiIntentRescueService,
            useValue: { rescue: jest.fn().mockReturnValue(null) },
          },
        ],
      }).compile();

      pipeline = moduleRef.get(CommandUnderstandingPipelineService);
      normalizationService = moduleRef.get(AiPromptNormalizationService);
    });

    afterEach(async () => {
      await moduleRef?.close();
    });

    it.each(
      PROMPT_NORMALIZE_PASSTHROUGH_SCENARIOS.filter(
        (scenario) => scenario.language === 'hy' || scenario.language === 'ru',
      ),
    )('pipeline passes HY/RU through unchanged: $id', async (scenario) => {
      const result = await pipeline.understand({
        ...pipelineBase,
        businessId: scenario.businessId,
        effectivePrompt: scenario.prompt,
        classify: classifyMock,
      });

      expect(result.trace[0]?.stage).toBe('normalize');
      expect(result.context.method).toBe('multilingual');
      expect(result.context.normalizedPrompt).toBe(scenario.expectedNormalized);
      expect(result.context.classifierContext).toBeTruthy();
      expect(classifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          normalizedPrompt: scenario.expectedNormalized,
          classifierContext: result.context.classifierContext,
          method: 'multilingual',
        }),
      );
    });

    it.each(PROMPT_NORMALIZE_EMPTY_SCENARIOS)(
      'pipeline blocks empty prompt before classify: $id',
      async (scenario) => {
        const result = await pipeline.understand({
          ...pipelineBase,
          businessId: scenario.businessId,
          effectivePrompt: scenario.prompt,
          classify: classifyMock,
        });

        expect(result.status).toBe('blocked');
        expect(result.blockReason).toContain('empty prompt');
        expect(result.trace[0]?.stage).toBe('normalize');
        expect(result.context.normalizedPrompt).toBe('');
        expect(classifyMock).not.toHaveBeenCalled();
      },
    );

    it.each(PROMPT_NORMALIZE_CACHE_SCENARIOS)(
      'pipeline reuses normalization cache on repeat calls: $id',
      async (scenario) => {
        const normalizeSpy = jest.spyOn(
          normalizationService,
          'normalizeForClassifier',
        );

        const first = await pipeline.understand({
          ...pipelineBase,
          businessId: scenario.businessId,
          effectivePrompt: scenario.prompt,
          classify: classifyMock,
        });
        const second = await pipeline.understand({
          ...pipelineBase,
          businessId: scenario.businessId,
          effectivePrompt: scenario.prompt,
          classify: classifyMock,
        });

        expect(normalizeSpy).toHaveBeenCalledTimes(2);
        expect(first.normalization).toBe(second.normalization);
        expect(first.context.classifierContext).toBe(
          second.context.classifierContext,
        );
      },
    );

    it('pipeline skips normalization service when promptNorm is pre-supplied', async () => {
      const hyPrompt = PROMPT_NORMALIZE_PASSTHROUGH_SCENARIOS.find(
        (scenario) => scenario.id === 'hy-passthrough-list',
      )!.prompt;
      const promptNorm = await normalizationService.normalizeForClassifier(
        'biz-norm-pre',
        USER_ID,
        hyPrompt,
      );
      const normalizeSpy = jest.spyOn(
        normalizationService,
        'normalizeForClassifier',
      );

      const result = await pipeline.understand({
        ...pipelineBase,
        businessId: 'biz-norm-pre',
        effectivePrompt: hyPrompt,
        promptNorm,
        classify: classifyMock,
      });

      expect(normalizeSpy).not.toHaveBeenCalled();
      expect(result.context).toEqual(
        buildPipelineContext(hyPrompt, promptNorm),
      );
      expect(result.normalization).toBe(promptNorm);
    });
  });
});
