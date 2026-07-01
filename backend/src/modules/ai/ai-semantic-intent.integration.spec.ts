import { Test } from '@nestjs/testing';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { SEMANTIC_PARAPHRASE_SCENARIOS } from './ai-semantic-intent.fixtures.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';

describe('AiSemanticIntentService (integration)', () => {
  let service: AiSemanticIntentService;
  let rag: AiRagService;
  let promptNormalization: AiPromptNormalizationService;

  beforeEach(async () => {
    clearIntentAnchorBankCache();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiSemanticIntentService,
        AiRagService,
        AiPromptNormalizationService,
        {
          provide: AiSettingsService,
          useValue: {
            getSettings: jest
              .fn()
              .mockResolvedValue({ rag: { enabled: false, documents: [] } }),
          },
        },
        {
          provide: OpenAiGatewayService,
          useValue: {
            isAvailableForBusiness: jest.fn().mockResolvedValue(false),
            embedText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AiSemanticIntentService);
    rag = moduleRef.get(AiRagService);
    promptNormalization = moduleRef.get(AiPromptNormalizationService);
    await service.onModuleInit();
  });

  it('registers eval-seeded anchors in AiRagService index', () => {
    expect(rag.semanticAnchorIndexSize()).toBe(getIntentAnchorBank().length);
  });

  it.each(
    SEMANTIC_PARAPHRASE_SCENARIOS.filter((s) => s.classifyAction === 'unknown'),
  )('match() resolves $id without embeddings', async (scenario) => {
    const match = await service.match({
      businessId: 'biz-1',
      prompt: scenario.prompt,
      surface: scenario.surface,
    });
    expect(match?.action).toBe(scenario.expectedAction);
    expect(match?.rescueReason).toBe('semantic_match');
  });

  it('match() normalizes multilingual prompts via AiPromptNormalizationService', async () => {
    const normSpy = jest.spyOn(promptNormalization, 'normalizeForClassifier');
    await service.match({
      businessId: 'biz-1',
      prompt: 'Запиши на ближайшее свободное время',
      surface: 'dashboard',
    });
    expect(normSpy).toHaveBeenCalledWith(
      'biz-1',
      undefined,
      'Запиши на ближайшее свободное время',
    );
    normSpy.mockRestore();
  });

  it('match() returns null for empty prompt', async () => {
    expect(
      await service.match({
        businessId: 'biz-1',
        prompt: '   ',
        surface: 'dashboard',
      }),
    ).toBeNull();
  });
});
