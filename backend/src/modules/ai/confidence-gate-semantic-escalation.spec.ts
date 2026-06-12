import { Test } from '@nestjs/testing';
import { CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS } from './confidence-gate.fixtures.js';
import {
  CONFIDENCE_GATE_SEMANTIC_ESCALATION_IT_EACH_SCENARIO_IDS,
  findOrphanConfidenceGateSemanticEscalationIds,
} from './confidence-gate-semantic-escalation.coverage.js';
import {
  DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
  DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
  evaluateConfidenceGate,
  shouldEscalateToSemantic,
} from './confidence-gate.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';

describe('confidence-gate semantic escalation (pipe-1.3.4)', () => {
  describe('shouldEscalateToSemantic unit gate', () => {
    it.each(CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS)(
      '$id',
      ({
        action,
        confidence,
        expectedShouldEscalate,
        expectedGateDecision,
      }) => {
        expect(shouldEscalateToSemantic(action, confidence)).toBe(
          expectedShouldEscalate,
        );

        const gate = evaluateConfidenceGate(action, confidence);
        expect(gate.shouldEscalateToSemantic).toBe(expectedShouldEscalate);
        expect(gate.decision).toBe(expectedGateDecision);
        expect(gate.lowThreshold).toBe(DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE);
        expect(gate.highThreshold).toBe(DEFAULT_SEMANTIC_SKIP_CONFIDENCE);
      },
    );
  });

  describe('CommandUnderstandingPipelineService semantic_match stage', () => {
    let pipeline: CommandUnderstandingPipelineService;
    let semanticMatch: jest.Mock;

    const baseInput = {
      businessId: 'biz-pipe-134',
      effectivePrompt: 'book first available tomorrow',
      surface: 'dashboard' as const,
      confidenceLow: DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
      confidenceHigh: DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
      employees: [{ id: 'emp-1', name: 'Anna' }],
      customers: [{ id: 'cust-1', name: 'James' }],
      timeZone: 'Asia/Yerevan',
    };

    beforeEach(async () => {
      semanticMatch = jest.fn().mockResolvedValue({
        action: 'create_booking',
        confidence: 0.88,
        anchorId: 'en-implied-trim-need',
        paramHints: {},
        reasoning: 'semantic paraphrase',
        rescueReason: 'semantic_match',
      });

      const moduleRef = await Test.createTestingModule({
        providers: [
          CommandUnderstandingPipelineService,
          AiPromptNormalizationService,
          FastIntentHeuristicsService,
          CommandComplexityRouterService,
          {
            provide: IntentDecompositionService,
            useValue: {
              isCompoundPrompt: () => false,
            },
          },
          {
            provide: AiSemanticIntentService,
            useValue: { match: semanticMatch },
          },
          {
            provide: AiIntentRescueService,
            useValue: { rescue: jest.fn().mockReturnValue(null) },
          },
        ],
      }).compile();

      pipeline = moduleRef.get(CommandUnderstandingPipelineService);
    });

    it.each(CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS)(
      '$id — semantic_match trace=$expectedSemanticTraceAction',
      async ({
        action,
        confidence,
        expectSemanticMatchCalled,
        expectedSemanticTraceAction,
        expectedGateDecision,
        expectedShouldEscalate,
      }) => {
        const result = await pipeline.understand({
          ...baseInput,
          effectivePrompt:
            action === 'unknown'
              ? 'my hair is getting pretty long need a trim soon'
              : 'Show appointments today',
          classify: async () => ({
            action,
            params: {},
            reasoning: 'classify',
            confidence,
          }),
        });

        if (expectSemanticMatchCalled) {
          expect(semanticMatch).toHaveBeenCalled();
        } else {
          expect(semanticMatch).not.toHaveBeenCalled();
        }

        expect(
          result.trace.find((entry) => entry.stage === 'confidence_gate')
            ?.action,
        ).toBe(expectedGateDecision);
        expect(result.gate.shouldEscalateToSemantic).toBe(
          expectedShouldEscalate,
        );
        expect(
          result.trace.find((entry) => entry.stage === 'semantic_match')
            ?.action,
        ).toBe(expectedSemanticTraceAction);
      },
    );
  });

  it('covers every pipe-1.3.4 fixture id via it.each', () => {
    expect(
      findOrphanConfidenceGateSemanticEscalationIds(
        CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS.map(
          (scenario) => scenario.id,
        ),
        CONFIDENCE_GATE_SEMANTIC_ESCALATION_IT_EACH_SCENARIO_IDS,
      ),
    ).toEqual([]);
  });
});
