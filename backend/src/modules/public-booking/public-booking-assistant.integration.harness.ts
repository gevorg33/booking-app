import { Test, type TestingModule } from '@nestjs/testing';
import { PublicCommandUnderstandingAdapter } from '../ai/public-command-understanding.adapter.js';
import { CommandUnderstandingPipelineService } from '../ai/command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from '../ai/ai-prompt-normalization.service.js';
import { FastIntentHeuristicsService } from '../ai/fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from '../ai/command-complexity-router.service.js';
import { AiSemanticIntentService } from '../ai/ai-semantic-intent.service.js';
import { AiRagService } from '../ai/ai-rag.service.js';
import { AiIntentRescueService } from '../ai/ai-intent-rescue.service.js';
import { AiSettingsService } from '../ai/ai-settings.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { IntentDecompositionService } from '../ai/intent-decomposition.service.js';
import { isCompoundPrompt } from '../ai/intent-decomposition.util.js';
import { buildDeterministicSemanticEmbedMock } from '../ai/ai-semantic-intent.embedding-mock.util.js';
import { clearIntentAnchorBankCache } from '../ai/intent-anchor.bank.js';
import type { PublicUnderstandDeps } from '../ai/command-understanding-adapter.types.js';

let harnessModuleRef: TestingModule | undefined;
let harnessAdapter: PublicCommandUnderstandingAdapter | undefined;

async function getPublicUnderstandingAdapterForHarness(): Promise<PublicCommandUnderstandingAdapter> {
  if (harnessAdapter) return harnessAdapter;

  clearIntentAnchorBankCache();
  harnessModuleRef = await Test.createTestingModule({
    providers: [
      PublicCommandUnderstandingAdapter,
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
            confidence: { low: 0.65, high: 0.82 },
          }),
        },
      },
      {
        provide: OpenAiGatewayService,
        useValue: {
          isAvailableForBusiness: jest.fn().mockResolvedValue(false),
          embedText: buildDeterministicSemanticEmbedMock(),
        },
      },
    ],
  }).compile();

  harnessAdapter = harnessModuleRef.get(PublicCommandUnderstandingAdapter);
  await harnessModuleRef.get(AiSemanticIntentService).onModuleInit();
  return harnessAdapter!;
}

/** Runs the real understand pipeline (classify + rescue) for public integration specs. */
export function buildPublicUnderstandMock() {
  return {
    understand: jest.fn(async (deps: PublicUnderstandDeps) => {
      const adapter = await getPublicUnderstandingAdapterForHarness();
      return adapter.understand(deps);
    }),
  };
}

export function buildPublicPromptNormalizationMock() {
  return {
    normalizeForClassifier: jest.fn(async (_businessId, _userId, prompt) => ({
      original: prompt,
      normalized: prompt,
      method: 'passthrough',
      classifierContext: null,
    })),
  };
}

export async function resetPublicUnderstandingHarness(): Promise<void> {
  await harnessModuleRef?.close();
  harnessModuleRef = undefined;
  harnessAdapter = undefined;
  clearIntentAnchorBankCache();
}
