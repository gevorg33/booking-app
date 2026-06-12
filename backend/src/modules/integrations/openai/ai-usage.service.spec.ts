import { AiUsageService, isEmbeddingModel } from './ai-usage.service.js';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_OPENAI_MODEL,
  type AiCallContext,
} from './openai.types.js';

describe('AiUsageService (pipe-1.4.2)', () => {
  const usageRepo = {
    create: jest.fn((row) => row),
    save: jest.fn().mockResolvedValue(undefined),
  };

  let service: AiUsageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiUsageService(usageRepo as never);
  });

  it('detects embedding models', () => {
    expect(isEmbeddingModel(DEFAULT_EMBEDDING_MODEL)).toBe(true);
    expect(isEmbeddingModel(DEFAULT_OPENAI_MODEL)).toBe(false);
  });

  it('estimates embedding cost from prompt tokens only on platform keys', () => {
    const cost = service.estimateCostUsd(DEFAULT_EMBEDDING_MODEL, 10_000, 0, 'platform');
    expect(cost).toBeGreaterThan(0);
    expect(
      service.estimateCostUsd(DEFAULT_EMBEDDING_MODEL, 10_000, 0, 'business'),
    ).toBe(0);
  });

  it('records embedText usage with zero completion tokens', async () => {
    const context: AiCallContext = {
      businessId: 'biz-usage-1',
      surface: 'dashboard',
      operation: 'semantic_intent_match',
      actorType: 'system',
      userId: 'user-1',
    };

    await service.recordUsage({
      context,
      model: DEFAULT_EMBEDDING_MODEL,
      promptTokens: 1_000_000,
      completionTokens: 0,
      keySource: 'platform',
    });

    expect(usageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-usage-1',
        operation: 'semantic_intent_match',
        model: DEFAULT_EMBEDDING_MODEL,
        promptTokens: 1_000_000,
        completionTokens: 0,
        totalTokens: 1_000_000,
        keySource: 'platform',
        estimatedCostUsd: '0.020000',
      }),
    );
  });
});
