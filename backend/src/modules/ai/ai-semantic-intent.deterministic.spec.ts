import { Test } from '@nestjs/testing';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  DETERMINISTIC_SEMANTIC_FALLBACK_SCENARIOS,
  IMPLICATION_TOKEN_COSINE_SCENARIOS,
} from './ai-semantic-intent.deterministic.fixtures.js';
import { DETERMINISTIC_SEMANTIC_BOUNDARY_MARKER } from './ai-semantic-intent.deterministic.boundary.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';
import {
  DETERMINISTIC_SEMANTIC_PIPE_MARKER,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  scoreTokenCosineBetweenPhrases,
  SEMANTIC_CONCEPT_THRESHOLD,
  shouldUseDeterministicSemanticFallback,
} from './ai-semantic-intent.util.js';

describe('ai-semantic-intent deterministic fallback (pipe-1.4.4)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    clearIntentAnchorBankCache();
  });

  describe('shouldUseDeterministicSemanticFallback gate', () => {
    it.each(DETERMINISTIC_SEMANTIC_FALLBACK_SCENARIOS)(
      '$id',
      ({ hasEmbeddingApi, nodeEnv, expectedFallback }) => {
        process.env.NODE_ENV = nodeEnv;
        expect(shouldUseDeterministicSemanticFallback(hasEmbeddingApi)).toBe(
          expectedFallback,
        );
      },
    );
  });

  describe('token cosine scoring', () => {
    it('exports pipe-1.4.4 marker', () => {
      expect(DETERMINISTIC_SEMANTIC_PIPE_MARKER).toBe('pipe-1.4.4');
      expect(DETERMINISTIC_SEMANTIC_BOUNDARY_MARKER).toBe('pipe-1.4.4');
    });

    it('scores high token cosine for near-identical phrases', () => {
      const score = scoreTokenCosineBetweenPhrases(
        'book the first available slot',
        'book the first available appointment slot',
      );
      expect(score).toBeGreaterThan(0.7);
    });

    it.each(IMPLICATION_TOKEN_COSINE_SCENARIOS)(
      '$id — rankAnchorsDeterministic resolves $expectedAction',
      ({ prompt, expectedAction }) => {
        const match = resolveSemanticMatch(
          rankAnchorsDeterministic(prompt, getIntentAnchorBank()),
          { threshold: SEMANTIC_CONCEPT_THRESHOLD },
        );
        expect(match?.action).toBe(expectedAction);
        expect(match?.rescueReason).toBe('semantic_match');
      },
    );
  });

  describe('AiSemanticIntentService wiring', () => {
    let service: AiSemanticIntentService;
    let embedText: jest.Mock;

    beforeEach(async () => {
      clearIntentAnchorBankCache();
      process.env.NODE_ENV = 'test';
      embedText = jest.fn();

      const moduleRef = await Test.createTestingModule({
        providers: [
          AiSemanticIntentService,
          AiRagService,
          AiPromptNormalizationService,
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
              isAvailableForBusiness: jest.fn().mockResolvedValue(true),
              embedText,
            },
          },
        ],
      }).compile();

      service = moduleRef.get(AiSemanticIntentService);
      await service.onModuleInit();
    });

    it('NODE_ENV=test uses token cosine even when embedding API is available', async () => {
      const match = await service.match({
        businessId: 'biz-det',
        prompt: 'My hair is getting pretty long, need a trim soon',
        surface: 'dashboard',
      });

      expect(match?.action).toBe('create_booking');
      expect(embedText).not.toHaveBeenCalled();
    });

    it('no API key uses token cosine without embedText', async () => {
      process.env.NODE_ENV = 'production';

      const moduleRef = await Test.createTestingModule({
        providers: [
          AiSemanticIntentService,
          AiRagService,
          AiPromptNormalizationService,
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
              embedText,
            },
          },
        ],
      }).compile();

      const noApiService = moduleRef.get(AiSemanticIntentService);
      await noApiService.onModuleInit();

      const match = await noApiService.match({
        businessId: 'biz-no-key',
        prompt: 'My hair is getting pretty long, need a trim soon',
        surface: 'dashboard',
      });

      expect(match?.action).toBe('create_booking');
      expect(embedText).not.toHaveBeenCalled();
    });
  });
});
