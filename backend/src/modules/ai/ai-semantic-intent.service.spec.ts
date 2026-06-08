import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { buildSemanticPhrasingBank } from './ai-semantic-phrasing-bank.util.js';

describe('AiSemanticIntentService (acc-3.11)', () => {
  const openAi = {
    createEmbeddings: jest.fn(),
  };

  const phrasingBank = {
    normalizePromptForMatch: jest.fn(async (_biz: string, prompt: string) => prompt),
    warmEmbeddingIndex: jest.fn(async () => ({
      phraseCount: 10,
      embeddedCount: 10,
      indexWarmed: true,
      byLocale: { en: 8, hy: 1, ru: 1 },
      bySource: { canonical: 6, eval_paraphrase: 4 },
    })),
    getPhraseBank: jest.fn((surface?: 'dashboard') =>
      buildSemanticPhrasingBank(surface ?? 'dashboard'),
    ),
    getEmbeddingsById: jest.fn(() => new Map<string, number[]>()),
  };

  const service = new AiSemanticIntentService(
    openAi as never,
    phrasingBank as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    phrasingBank.getEmbeddingsById.mockReturnValue(new Map<string, number[]>());
  });

  it('uses embedding cosine match against paraphrase bank', async () => {
    const bank = buildSemanticPhrasingBank('dashboard');
    const createBooking = bank.find(
      (entry) => entry.id === 'sem-en-create_booking-1',
    );
    expect(createBooking).toBeTruthy();

    const embeddings = new Map<string, number[]>([
      [createBooking!.id, [1, 0, 0]],
    ]);
    phrasingBank.getEmbeddingsById.mockReturnValue(embeddings);

    openAi.createEmbeddings.mockImplementation(
      async (_ctx: unknown, texts: string[]) =>
        texts.map((text) => {
          if (text.includes('Put Maria on the books')) return [0.96, 0.04, 0];
          return [0, 1, 0];
        }),
    );

    const match = await service.matchIntent({
      businessId: 'biz-1',
      prompt: 'Put Maria on the books for facemassage tomorrow at 14:00',
      surface: 'dashboard',
    });

    expect(phrasingBank.normalizePromptForMatch).toHaveBeenCalled();
    expect(phrasingBank.warmEmbeddingIndex).toHaveBeenCalledWith(
      'biz-1',
      'dashboard',
      [],
    );
    expect(openAi.createEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        operation: 'semantic_intent_match',
      }),
      expect.any(Array),
    );
    expect(match?.action).toBe('create_booking');
    expect(['embedding', 'eval_paraphrase']).toContain(match?.source);
    expect(match?.confidence).toBeGreaterThan(0.55);
  });

  it('falls back to lexical match when embeddings unavailable', async () => {
    openAi.createEmbeddings.mockResolvedValue(null);

    const match = await service.matchIntent({
      businessId: 'biz-1',
      prompt: SEMANTIC_PARAPHRASE_EVAL_CASES[0]!.prompt,
      surface: 'dashboard',
    });

    expect(match?.action).toBe('create_booking');
    expect(match?.source).not.toBe('embedding');
  });

  it.each(
    SEMANTIC_PARAPHRASE_EVAL_CASES.filter(
      (entry) => (entry.surface ?? 'dashboard') === 'dashboard',
    ).map((entry) => [entry.id, entry.prompt, entry.expect.rescuedAction]),
  )(
    'acc-3.11-lexical-%s resolves dashboard paraphrase offline',
    async (_id, prompt, expectedAction) => {
      openAi.createEmbeddings.mockResolvedValue(null);
      const match = await service.matchIntent({
        businessId: 'biz-1',
        prompt,
        surface: 'dashboard',
      });
      expect(match?.action).toBe(expectedAction);
    },
  );
});
