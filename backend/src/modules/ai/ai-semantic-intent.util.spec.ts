import {
  buildSemanticPhrasingBank,
  matchSemanticIntentLexical,
  rankSemanticPhrasesByEmbedding,
  rankSemanticPhrasesLexical,
} from './ai-semantic-intent.util.js';
import { buildBusinessParaphraseEntry } from './ai-business-paraphrase.util.js';
import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';

describe('ai-semantic-intent.util (acc-3.11)', () => {
  it('buildSemanticPhrasingBank includes canonical and eval paraphrases', () => {
    const bank = buildSemanticPhrasingBank('dashboard');
    const dashboardParaphraseCases = SEMANTIC_PARAPHRASE_EVAL_CASES.filter(
      (entry) => entry.surface === 'dashboard',
    );
    expect(bank.length).toBeGreaterThanOrEqual(dashboardParaphraseCases.length);
    expect(bank.some((entry) => entry.action === 'create_booking')).toBe(true);
    expect(bank.some((entry) => entry.source === 'canonical')).toBe(true);
    expect(bank.some((entry) => entry.source === 'eval_paraphrase')).toBe(true);
  });

  it('matchSemanticIntentLexical resolves paraphrase eval prompts', () => {
    for (const evalCase of SEMANTIC_PARAPHRASE_EVAL_CASES.slice(0, 5)) {
      const match = matchSemanticIntentLexical(
        evalCase.prompt,
        evalCase.surface ?? 'dashboard',
        { threshold: 0.35 },
      );
      expect(match?.action).toBe(
        evalCase.expect.rescuedAction ?? evalCase.expect.action,
      );
    }
  });

  it('rankSemanticPhrasesByEmbedding picks highest cosine match', () => {
    const bank = buildSemanticPhrasingBank('dashboard');
    const target = bank.find((entry) => entry.action === 'create_booking');
    expect(target).toBeTruthy();

    const embeddingsById = new Map<string, number[]>([
      [target!.id, [1, 0, 0]],
      ...bank
        .filter((entry) => entry.id !== target!.id)
        .slice(0, 3)
        .map((entry) => [entry.id, [0, 1, 0]] as const),
    ]);

    const ranked = rankSemanticPhrasesByEmbedding({
      queryEmbedding: [0.98, 0.02, 0],
      pool: bank.filter((entry) => embeddingsById.has(entry.id)),
      embeddingsById,
      limit: 1,
      minScore: 0.5,
    });

    expect(ranked[0]?.entry.id).toBe(target!.id);
    expect(ranked[0]?.score).toBeGreaterThan(0.9);
  });

  it('matchSemanticIntentLexical prefers learned business paraphrase on first try', () => {
    const entry = buildBusinessParaphraseEntry({
      prompt: 'pull the morning sheet',
      action: 'list_bookings',
      surface: 'dashboard',
      source: 'correction',
    })!;
    const match = matchSemanticIntentLexical('pull the morning sheet', 'dashboard', {
      entityMemory: { aliases: {}, paraphrases: [entry] },
      threshold: 0.9,
    });
    expect(match?.action).toBe('list_bookings');
    expect(match?.source).toBe('business_learned');
  });

  it('rankSemanticPhrasesLexical returns candidates for availability prompts', () => {
    const ranked = rankSemanticPhrasesLexical(
      'Which stylists have openings tomorrow evening for lashes',
      buildSemanticPhrasingBank('dashboard'),
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]?.entry.action).toBe('check_providers_for_service');
  });
});
