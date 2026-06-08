import { SEMANTIC_PARAPHRASE_EVAL_CASES } from './ai-classification-paraphrase.fixtures.js';
import {
  buildSemanticPhrasingBank,
  evalCaseToSemanticPhraseEntry,
  isSemanticParaphraseEvalCase,
  loadStoredCanonicalPhrasingBank,
  summarizeSemanticPhrasingBank,
} from './ai-semantic-phrasing-bank.util.js';

describe('ai-semantic-phrasing-bank.util (acc-3.12)', () => {
  it('loadStoredCanonicalPhrasingBank includes EN/HY/RU canonical utterances', () => {
    const bank = loadStoredCanonicalPhrasingBank();
    expect(bank.length).toBeGreaterThanOrEqual(24);
    expect(bank.some((entry) => entry.locale === 'hy')).toBe(true);
    expect(bank.some((entry) => entry.locale === 'ru')).toBe(true);
    expect(bank.every((entry) => entry.source === 'canonical')).toBe(true);
  });

  it('isSemanticParaphraseEvalCase accepts corpus tag, semanticParaphrase flag, and sem- ids', () => {
    expect(
      isSemanticParaphraseEvalCase({
        id: 'sem-en-test',
        prompt: 'p',
        corpus: 'semantic_paraphrase',
        expect: { rescuedAction: 'create_booking' },
      }),
    ).toBe(true);
    expect(
      isSemanticParaphraseEvalCase({
        id: 'harvest-x',
        prompt: 'p',
        semanticParaphrase: true,
        expect: { action: 'list_bookings' },
      }),
    ).toBe(true);
    expect(
      isSemanticParaphraseEvalCase({
        id: 'golden-book',
        prompt: 'p',
        corpus: 'golden',
        expect: { rescuedAction: 'create_booking' },
      }),
    ).toBe(false);
  });

  it('buildSemanticPhrasingBank merges JSON canonical rows with eval paraphrases', () => {
    const bank = buildSemanticPhrasingBank('dashboard');
    const summary = summarizeSemanticPhrasingBank(bank);
    expect(summary.total).toBeGreaterThan(
      loadStoredCanonicalPhrasingBank().filter((entry) => entry.surface === 'dashboard')
        .length,
    );
    expect(summary.bySource.canonical).toBeGreaterThan(0);
    expect(summary.bySource.eval_paraphrase).toBeGreaterThan(0);
  });

  it('evalCaseToSemanticPhraseEntry maps SEMANTIC_PARAPHRASE_EVAL_CASES', () => {
    for (const evalCase of SEMANTIC_PARAPHRASE_EVAL_CASES) {
      const entry = evalCaseToSemanticPhraseEntry(evalCase);
      expect(entry?.phrase).toBe(evalCase.prompt);
      expect(entry?.action).toBe(
        evalCase.expect.rescuedAction ?? evalCase.expect.action,
      );
    }
  });
});
