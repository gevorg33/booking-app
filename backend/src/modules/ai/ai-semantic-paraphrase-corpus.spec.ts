import {
  collectSemanticParaphraseCorpus,
  listSemanticParaphraseCoverageGaps,
  MIN_PARAPHRASES_PER_SEMANTIC_INTENT,
  normalizeParaphraseLexicalKey,
  REQUIRED_PARAPHRASE_LOCALES,
  SEMANTIC_PARAPHRASE_CORPUS_PIPE_MARKER,
  summarizeSemanticParaphraseCoverage,
} from './ai-semantic-paraphrase-corpus.util.js';
import { CORE_SEMANTIC_INTENT_ACTIONS } from './intent-anchor.bank.util.js';
import { SEMANTIC_PARAPHRASE_SCENARIOS } from './ai-semantic-intent.fixtures.js';

describe('ai-semantic-paraphrase corpus (acc-3.16)', () => {
  it('exports pipe marker', () => {
    expect(SEMANTIC_PARAPHRASE_CORPUS_PIPE_MARKER).toBe('acc-3.16');
  });

  it('semantic paraphrase fixtures stay lexically distinct', () => {
    const unknown = SEMANTIC_PARAPHRASE_SCENARIOS.filter(
      (scenario) => scenario.classifyAction === 'unknown',
    );
    const keys = unknown.map((scenario) =>
      normalizeParaphraseLexicalKey(scenario.prompt),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it(`ships ≥${MIN_PARAPHRASES_PER_SEMANTIC_INTENT} distinct paraphrases per core intent`, () => {
    const summary = summarizeSemanticParaphraseCoverage();
    for (const action of CORE_SEMANTIC_INTENT_ACTIONS) {
      expect(summary.get(action)?.distinctCount).toBeGreaterThanOrEqual(
        MIN_PARAPHRASES_PER_SEMANTIC_INTENT,
      );
    }
  });

  it(`ships ${REQUIRED_PARAPHRASE_LOCALES.join('/')} coverage per core intent`, () => {
    const summary = summarizeSemanticParaphraseCoverage();
    for (const action of CORE_SEMANTIC_INTENT_ACTIONS) {
      for (const locale of REQUIRED_PARAPHRASE_LOCALES) {
        expect(summary.get(action)?.locales.has(locale)).toBe(true);
      }
    }
  });

  it('has no semantic paraphrase coverage gaps', () => {
    expect(listSemanticParaphraseCoverageGaps()).toEqual([]);
  });

  it('merges semantic-paraphrase and implication-corpus rows', () => {
    const rows = collectSemanticParaphraseCorpus();
    expect(rows.some((row) => row.source === 'semantic-paraphrase')).toBe(true);
    expect(rows.some((row) => row.source === 'implication-corpus')).toBe(true);
    expect(rows.length).toBeGreaterThan(80);
  });
});
