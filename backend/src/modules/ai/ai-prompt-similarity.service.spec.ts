import { AiPromptSimilarityService } from './ai-prompt-similarity.service.js';
import { computePromptSimilarity, cosineSimilarity } from './ai-command-trace.util.js';

describe('AiPromptSimilarityService (acc-1.4)', () => {
  const openAi = {
    createEmbeddings: jest.fn(),
  };
  const service = new AiPromptSimilarityService(openAi as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses embedding cosine similarity when OpenAI returns vectors', async () => {
    openAi.createEmbeddings.mockResolvedValue([
      [1, 0, 0],
      [0.9, 0.436, 0],
    ]);

    const scores = await service.scoreAgainstPriorPrompts(
      'biz-1',
      'user-1',
      'dashboard',
      'first available slot today',
      ['who has the earliest opening today'],
    );

    expect(openAi.createEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        operation: 'retry_rephrase_similarity',
        userId: 'user-1',
      }),
      expect.any(Array),
    );
    expect(scores[0]).toBeGreaterThan(0.8);
    expect(computePromptSimilarity(
      'who has the earliest opening today',
      'first available slot today',
    )).toBeLessThan(0.8);
  });

  it('falls back to lexical similarity when embeddings are unavailable', async () => {
    openAi.createEmbeddings.mockResolvedValue(null);

    const scores = await service.scoreAgainstPriorPrompts(
      'biz-1',
      'user-1',
      'dashboard',
      'book anna for haircut tomorrow please',
      ['book anna for haircut tomorrow'],
    );

    expect(scores[0]).toBeGreaterThan(0.8);
  });

  it('reuses cached embeddings for repeated prompts', async () => {
    openAi.createEmbeddings.mockResolvedValue([[1, 0], [1, 0]]);

    await service.scoreAgainstPriorPrompts(
      'biz-1',
      'user-1',
      'dashboard',
      'show schedule',
      ['show schedule today'],
    );
    await service.scoreAgainstPriorPrompts(
      'biz-1',
      'user-1',
      'dashboard',
      'show schedule',
      ['show schedule today'],
    );

    expect(openAi.createEmbeddings).toHaveBeenCalledTimes(1);
  });
});

describe('cosineSimilarity (acc-1.4)', () => {
  it('returns 1 for identical vectors and 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
});
