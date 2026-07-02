import { Test } from '@nestjs/testing';
import * as semanticUtil from './ai-semantic-intent.util.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { SEMANTIC_EMBEDDING_MATCH_SCENARIOS } from './ai-semantic-intent.embedding.fixtures.js';
import { buildDeterministicSemanticEmbedMock } from './ai-semantic-intent.embedding-mock.util.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
} from './intent-anchor.bank.js';

describe('AiSemanticIntentService embedding path (pipe-1.4.3)', () => {
  let service: AiSemanticIntentService;
  let rag: AiRagService;
  let embedText: jest.Mock;

  beforeEach(async () => {
    clearIntentAnchorBankCache();
    embedText = buildDeterministicSemanticEmbedMock();

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
    rag = moduleRef.get(AiRagService);

    jest
      .spyOn(semanticUtil, 'shouldUseDeterministicSemanticFallback')
      .mockReturnValue(false);
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pre-embeds all intent anchors on module init', () => {
    const bank = getIntentAnchorBank();
    expect(rag.semanticAnchorEmbeddedCount()).toBe(bank.length);
    expect(
      embedText.mock.calls.filter(
        (call) => call[0]?.operation === 'semantic_intent_anchor',
      ).length,
    ).toBe(bank.length);
  });

  it('skips re-embedding anchors that are already cached', async () => {
    const anchorCallsBefore = embedText.mock.calls.filter(
      (call) => call[0]?.operation === 'semantic_intent_anchor',
    ).length;

    await service.match({
      businessId: 'biz-embed',
      prompt: 'My hair is getting pretty long, need a trim soon',
      surface: 'dashboard',
    });

    const anchorCallsAfter = embedText.mock.calls.filter(
      (call) => call[0]?.operation === 'semantic_intent_anchor',
    ).length;
    expect(anchorCallsAfter).toBe(anchorCallsBefore);
    expect(
      embedText.mock.calls.some(
        (call) => call[0]?.operation === 'semantic_intent_match',
      ),
    ).toBe(true);
  });

  it.each(SEMANTIC_EMBEDDING_MATCH_SCENARIOS)(
    '$id — cosine match resolves $expectedAction',
    async ({ prompt, surface, expectedAction, expectedAnchorId }) => {
      const match = await service.match({
        businessId: 'biz-embed',
        prompt,
        normalizedPrompt: prompt,
        surface,
      });

      expect(match?.action).toBe(expectedAction);
      expect(match?.anchorId).toBe(expectedAnchorId);
      expect(match?.rescueReason).toBe('semantic_match');
      expect(match?.confidence).toBeGreaterThanOrEqual(
        semanticUtil.SEMANTIC_MATCH_THRESHOLD,
      );
    },
  );

  it('falls back to deterministic matcher when prompt embedding fails', async () => {
    embedText.mockImplementation(async (_ctx, text: string) => {
      const bank = getIntentAnchorBank();
      if (bank.some((anchor) => anchor.phrase === text.trim())) {
        return buildDeterministicSemanticEmbedMock()(_ctx, text);
      }
      return null;
    });

    const match = await service.match({
      businessId: 'biz-embed',
      prompt: 'My hair is getting pretty long, need a trim soon',
      surface: 'dashboard',
    });

    expect(match?.action).toBe('create_booking');
    expect(match?.rescueReason).toBe('semantic_match');
  });
});
