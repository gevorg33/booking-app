import { Test } from '@nestjs/testing';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { STRUCTURAL_ENRICH_SKIP_SCENARIOS } from './ai-intent-structural-enrich-skip.fixtures.js';
import { STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL } from './ai-intent-structural-enrich-skip.util.js';
import { readStructuralEnrichHints } from './ai-intent-structural-enrich.util.js';

describe('CommandUnderstandingPipelineService structural enrich skip (pipe-1.7.3)', () => {
  let pipeline: CommandUnderstandingPipelineService;
  let intentRescue: jest.Mock;

  const baseInput = {
    businessId: 'biz-1',
    effectivePrompt: 'placeholder',
    surface: 'dashboard' as const,
    confidenceLow: 0.65,
    confidenceHigh: 0.82,
    employees: [{ id: 'emp-1', name: 'Anna' }],
    customers: [{ id: 'cust-1', name: 'James' }],
    timeZone: 'Asia/Yerevan',
  };

  beforeEach(async () => {
    intentRescue = jest.fn().mockReturnValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CommandUnderstandingPipelineService,
        AiPromptNormalizationService,
        FastIntentHeuristicsService,
        CommandComplexityRouterService,
        {
          provide: IntentDecompositionService,
          useValue: {
            isCompoundPrompt: (prompt: string) => /\band then\b|;\s*/i.test(prompt),
          },
        },
        {
          provide: AiSemanticIntentService,
          useValue: { match: jest.fn() },
        },
        {
          provide: AiIntentRescueService,
          useValue: { rescue: intentRescue },
        },
      ],
    }).compile();

    pipeline = moduleRef.get(CommandUnderstandingPipelineService);
  });

  it.each(STRUCTURAL_ENRICH_SKIP_SCENARIOS)(
    'understand $id — structural enrich skip=$expectSkipStructuralEnrich',
    async (scenario) => {
      const result = await pipeline.understand({
        ...baseInput,
        effectivePrompt: scenario.prompt,
        employees: scenario.employees ?? baseInput.employees,
        classify: async () => ({
          action: scenario.classifyAction,
          params: scenario.classifyParams ?? {},
          reasoning: 'classify',
          confidence: scenario.classifyConfidence,
        }),
      });

      expect(result.status).toBe(scenario.expectStatus);
      if (scenario.expectFinalAction) {
        expect(result.action).toBe(scenario.expectFinalAction);
      }

      const structuralTrace = result.trace.find(
        (entry) => entry.stage === 'structural_enrich',
      );
      expect(structuralTrace).toBeDefined();

      if (scenario.expectSkipStructuralEnrich) {
        expect(structuralTrace?.detail).toBe(STRUCTURAL_ENRICH_SKIP_TRACE_DETAIL);
        expect(result.clarifyFields?.length).toBeGreaterThan(0);
        if (scenario.expectNoStructuralHints) {
          expect(readStructuralEnrichHints(result.params)).toBeUndefined();
          expect(result.params.periods).toBeUndefined();
          expect(result.params.dateFrom).toBeUndefined();
        }
      } else {
        expect(structuralTrace?.detail).not.toContain('skipped; self_verify clarify');
        if (scenario.expectStructuralDetailContains) {
          expect(structuralTrace?.detail).toContain(
            scenario.expectStructuralDetailContains,
          );
        }
        expect(readStructuralEnrichHints(result.params)).toBeDefined();
      }
    },
  );
});
