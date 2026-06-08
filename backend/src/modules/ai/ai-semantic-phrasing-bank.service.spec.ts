import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';
import { AiSemanticPhrasingBankService } from './ai-semantic-phrasing-bank.service.js';
import { buildSemanticPhrasingBank } from './ai-semantic-phrasing-bank.util.js';

describe('AiSemanticPhrasingBankService (acc-3.12)', () => {
  const openAi = {
    createEmbeddings: jest.fn(),
  };
  const promptNormalization = {
    normalizeForClassifier: jest.fn(async (_biz: string, _user: string | undefined, prompt: string) => ({
      original: prompt,
      normalized: prompt,
      method: 'passthrough' as const,
      classifierContext: null,
      expansions: [],
    })),
  };

  const service = new AiSemanticPhrasingBankService(
    openAi as never,
    promptNormalization as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('warmEmbeddingIndex embeds full bank once via normalization + OpenAI', async () => {
    openAi.createEmbeddings.mockImplementation(
      async (_ctx: unknown, texts: string[]) =>
        texts.map((_text, index) => [index + 1, 0, 0]),
    );

    const first = await service.warmEmbeddingIndex('biz-1', 'dashboard');
    const second = await service.warmEmbeddingIndex('biz-1', 'dashboard');

    expect(first.phraseCount).toBeGreaterThan(0);
    expect(first.embeddedCount).toBe(first.phraseCount);
    expect(first.indexWarmed).toBe(true);
    expect(first.byLocale.en).toBeGreaterThan(0);
    expect(openAi.createEmbeddings).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'semantic_phrasing_bank_index' }),
      expect.any(Array),
    );
    expect(promptNormalization.normalizeForClassifier).toHaveBeenCalled();
    expect(openAi.createEmbeddings.mock.calls.length).toBeGreaterThan(0);
    expect(second.embeddedCount).toBe(first.embeddedCount);
  });

  it('normalizePromptForMatch delegates to AiPromptNormalizationService', async () => {
    promptNormalization.normalizeForClassifier.mockResolvedValue({
      original: 'Book apt tomrw',
      normalized: 'Book appointment tomorrow',
      method: 'passthrough',
      classifierContext: null,
      expansions: ['apt→appointment'],
    });

    const normalized = await service.normalizePromptForMatch(
      'biz-1',
      'Book apt tomrw',
    );
    expect(normalized).toBe('Book appointment tomorrow');
  });

  it('getPhraseBank includes eval paraphrase rows without code changes', () => {
    const bank = service.getPhraseBank('dashboard');
    const evalIds = new Set(SEMANTIC_PARAPHRASE_EVAL_CASES.map((entry) => entry.id));
    expect(bank.some((entry) => evalIds.has(entry.id))).toBe(true);
    expect(buildSemanticPhrasingBank('dashboard').length).toBe(bank.length);
  });
});
