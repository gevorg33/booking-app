import { Test, type TestingModule } from '@nestjs/testing';
import { CustomerCommandUnderstandingAdapter } from './customer-command-understanding.adapter.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { FastIntentHeuristicsService } from './fast-intent-heuristics.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { isCompoundPrompt } from './intent-decomposition.util.js';
import { buildDeterministicSemanticEmbedMock } from './ai-semantic-intent.embedding-mock.util.js';
import { clearIntentAnchorBankCache } from './intent-anchor.bank.js';
import type { CustomerUnderstandDeps } from './command-understanding-adapter.types.js';

let harnessModuleRef: TestingModule | undefined;
let harnessAdapter: CustomerCommandUnderstandingAdapter | undefined;

async function getCustomerUnderstandingAdapterForHarness(): Promise<CustomerCommandUnderstandingAdapter> {
  if (harnessAdapter) return harnessAdapter;

  clearIntentAnchorBankCache();
  harnessModuleRef = await Test.createTestingModule({
    providers: [
      CustomerCommandUnderstandingAdapter,
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

  harnessAdapter = harnessModuleRef.get(CustomerCommandUnderstandingAdapter);
  await harnessModuleRef.get(AiSemanticIntentService).onModuleInit();
  return harnessAdapter!;
}

/** Runs the real understand pipeline (classify + rescue) for customer integration specs. */
export function buildCustomerUnderstandMock() {
  return {
    understand: jest.fn(async (deps: CustomerUnderstandDeps) => {
      const adapter = await getCustomerUnderstandingAdapterForHarness();
      return adapter.understand(deps);
    }),
  };
}

export function buildCustomerAiSettingsMock() {
  return {
    getSettings: jest.fn(async () => ({
      confidence: { low: 0.65, high: 0.82 },
    })),
  };
}

export function buildCustomerPromptNormalizationMock() {
  return {
    normalizeForClassifier: jest.fn(async (_businessId, _userId, prompt) => ({
      original: prompt,
      normalized: prompt,
      method: 'passthrough',
      classifierContext: null,
    })),
  };
}

export async function resetCustomerUnderstandingHarness(): Promise<void> {
  await harnessModuleRef?.close();
  harnessModuleRef = undefined;
  harnessAdapter = undefined;
  clearIntentAnchorBankCache();
}
