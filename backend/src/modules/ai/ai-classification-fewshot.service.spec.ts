import { AiClassificationFewShotService } from './ai-classification-fewshot.service.js';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';

describe('AiClassificationFewShotService (acc-3.1)', () => {
  const openAi = {
    createEmbeddings: jest.fn(),
  };
  const labelQueueRepo = {
    find: jest.fn(),
  };

  const service = new AiClassificationFewShotService(
    openAi as never,
    labelQueueRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    labelQueueRepo.find.mockResolvedValue([]);
  });

  it('uses embedding cosine retrieval against acc-2 global corpus', async () => {
    openAi.createEmbeddings.mockImplementation(
      async (_ctx: unknown, texts: string[]) =>
        texts.map((text) => {
          if (text.includes('Book massage with Gevorg tomorrow at 10:00')) {
            return [1, 0, 0];
          }
          if (text.includes('Book massage with Anna tomorrow at 11:00')) {
            return [0.92, 0.08, 0];
          }
          if (text.includes('Who is free tomorrow evening')) {
            return [0, 1, 0];
          }
          return [0, 0, 0.001];
        }),
    );

    const hits = await service.retrieveFewShotExamples({
      businessId: 'biz-1',
      prompt: 'Book massage with Gevorg tomorrow at 10:00',
      surface: 'dashboard',
      limit: 2,
    });

    expect(openAi.createEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        operation: 'classify_fewshot_retrieval',
      }),
      expect.arrayContaining([
        'Book massage with Gevorg tomorrow at 10:00',
      ]),
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.action).toBe('create_booking');
  });

  it('merges labeled business queue rows ahead of global corpus', async () => {
    const businessId = '12345678-abcd-ef01-2345-6789abcdef01';
    labelQueueRepo.find.mockResolvedValue([
      {
        id: 'queue-1',
        businessId,
        promptHash: 'hash-1',
        promptSnippet: 'Book our usual facial with Anna tomorrow at 15:00',
        locale: 'en',
        surface: 'dashboard',
        classifiedAction: 'unknown',
        correctedAction: 'create_booking',
        expectedRescuedAction: 'create_booking',
        labelOutcome: 'execution',
        status: 'labeled',
        failureCount: 3,
        createdAt: new Date(),
        labeledAt: new Date(),
      } satisfies Partial<AiEvalLabelQueue>,
    ]);

    openAi.createEmbeddings.mockImplementation(
      async (_ctx: unknown, texts: string[]) =>
        texts.map((text) => {
          if (text.includes('Book our usual facial with Anna tomorrow at 15:00')) {
            return [0.99, 0.01, 0];
          }
          if (text.includes('Book massage with Gevorg tomorrow at 10:00')) {
            return [0.95, 0.05, 0];
          }
          if (text.includes('usual facial')) {
            return [0.98, 0.02, 0];
          }
          return [0, 0, 0.001];
        }),
    );

    const hits = await service.retrieveFewShotExamples({
      businessId,
      prompt: 'Book our usual facial with Anna tomorrow at 15:00',
      surface: 'dashboard',
      limit: 2,
    });

    expect(labelQueueRepo.find).toHaveBeenCalled();
    expect(hits[0]?.prompt).toContain('usual facial');
    expect(hits[0]?.action).toBe('create_booking');
  });

  it('falls back to lexical overlap when embeddings are unavailable', async () => {
    openAi.createEmbeddings.mockResolvedValue(null);

    const hits = await service.retrieveFewShotExamples({
      businessId: 'biz-1',
      prompt: 'Book massage with Gevorg tomorrow at 10:00',
      surface: 'dashboard',
      limit: 2,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.action).toBe('create_booking');
  });
});
