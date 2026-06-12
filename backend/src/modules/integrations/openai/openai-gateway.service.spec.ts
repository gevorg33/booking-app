import { ConfigService } from '@nestjs/config';
import { OPENAI_EMBED_SCENARIOS } from './openai-embed.fixtures.js';
import { OpenAiGatewayService } from './openai-gateway.service.js';
import { AiUsageService } from './ai-usage.service.js';
import { OpenAiIntegrationService } from './openai-integration.service.js';
import {
  DEFAULT_EMBEDDING_MODEL,
  type AiCallContext,
} from './openai.types.js';

const embeddingsCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: { create: embeddingsCreate },
    chat: { completions: { create: jest.fn() } },
  }));
});

describe('OpenAiGatewayService embedText (pipe-1.4.2)', () => {
  let service: OpenAiGatewayService;
  let recordUsage: jest.Mock;
  let resolveRuntimeConfig: jest.Mock;

  const businessRepo = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    embeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.12, 0.34, 0.56] }],
      usage: { prompt_tokens: 14, total_tokens: 14 },
    });

    recordUsage = jest.fn().mockResolvedValue(undefined);
    resolveRuntimeConfig = jest.fn().mockReturnValue({
      source: 'platform',
      apiKey: 'sk-test-platform',
    });
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-embed-1',
      settings: {},
    });

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_EMBEDDING_MODEL') return DEFAULT_EMBEDDING_MODEL;
        return undefined;
      }),
    };

    service = new OpenAiGatewayService(
      businessRepo as never,
      config as unknown as ConfigService,
      { resolveRuntimeConfig } as unknown as OpenAiIntegrationService,
      { recordUsage } as unknown as AiUsageService,
    );
  });

  it.each(OPENAI_EMBED_SCENARIOS)(
    '$id — returns embedding vector and logs usage',
    async ({ context, text, expectedOperation, promptTokens }) => {
      embeddingsCreate.mockResolvedValueOnce({
        data: [{ embedding: [1, 0, 0] }],
        usage: { prompt_tokens: promptTokens, total_tokens: promptTokens },
      });

      const vector = await service.embedText(context, text);

      expect(vector).toEqual([1, 0, 0]);
      expect(embeddingsCreate).toHaveBeenCalledWith({
        model: DEFAULT_EMBEDDING_MODEL,
        input: text,
      });
      expect(recordUsage).toHaveBeenCalledWith({
        context: expect.objectContaining({
          businessId: context.businessId,
          operation: expectedOperation,
        }),
        model: DEFAULT_EMBEDDING_MODEL,
        promptTokens,
        completionTokens: 0,
        keySource: 'platform',
      });
    },
  );

  it('returns null without calling OpenAI when text is blank', async () => {
    const context: AiCallContext = {
      businessId: 'biz-embed-1',
      surface: 'dashboard',
      operation: 'semantic_intent_match',
      actorType: 'system',
    };

    expect(await service.embedText(context, '   ')).toBeNull();
    expect(embeddingsCreate).not.toHaveBeenCalled();
    expect(recordUsage).not.toHaveBeenCalled();
  });

  it('returns null when business has no OpenAI runtime config', async () => {
    resolveRuntimeConfig.mockReturnValue(null);

    const context: AiCallContext = {
      businessId: 'biz-missing',
      surface: 'dashboard',
      operation: 'semantic_intent_match',
      actorType: 'system',
    };

    expect(await service.embedText(context, 'book first available')).toBeNull();
    expect(embeddingsCreate).not.toHaveBeenCalled();
    expect(recordUsage).not.toHaveBeenCalled();
  });

  it('returns null and skips usage log when OpenAI embedding call fails', async () => {
    embeddingsCreate.mockRejectedValueOnce(new Error('rate limited'));

    const context: AiCallContext = {
      businessId: 'biz-embed-1',
      surface: 'dashboard',
      operation: 'semantic_intent_match',
      actorType: 'system',
    };

    expect(await service.embedText(context, 'need a trim soon')).toBeNull();
    expect(recordUsage).not.toHaveBeenCalled();
  });

  it('uses OPENAI_EMBEDDING_MODEL override from config', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_EMBEDDING_MODEL') return 'text-embedding-3-large';
        return undefined;
      }),
    };
    const gateway = new OpenAiGatewayService(
      businessRepo as never,
      config as unknown as ConfigService,
      { resolveRuntimeConfig } as unknown as OpenAiIntegrationService,
      { recordUsage } as unknown as AiUsageService,
    );

    await gateway.embedText(
      {
        businessId: 'biz-embed-1',
        surface: 'dashboard',
        operation: 'semantic_intent_anchor',
        actorType: 'system',
      },
      'book earliest slot',
    );

    expect(embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'text-embedding-3-large' }),
    );
  });
});
