import {
  ACC_EVAL_MIN_TYPO_CASES,
  buildTypoCorpusEvalCases,
  buildTypoCorpusReport,
  buildTypoFuzzyVariants,
  TYPO_CORPUS_SEEDS,
} from './ai-command-eval.corpus.util.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.corpus.util (acc-2.5)', () => {
  it('buildTypoFuzzyVariants generates lowercase, no-punct, abbrev, and misspell forms', () => {
    const variants = buildTypoFuzzyVariants('Clear Gevorg schedule for tomorrow!');
    const kinds = new Set(variants.map((entry) => entry.kind));
    expect(kinds.has('lowercase')).toBe(true);
    expect(kinds.has('no_punct')).toBe(true);
    expect(kinds.has('abbrev')).toBe(true);
    expect(variants.some((entry) => entry.prompt.includes('tommorow'))).toBe(true);
  });

  it('buildTypoCorpusEvalCases filters to passing deterministic variants', () => {
    const cases = buildTypoCorpusEvalCases(TYPO_CORPUS_SEEDS.slice(0, 5));
    expect(cases.length).toBeGreaterThan(0);
    for (const evalCase of cases) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
      expect(evalCase.corpus).toBe('typo');
    }
  });

  it(`acc-2.5 — typo corpus meets minimum ${ACC_EVAL_MIN_TYPO_CASES} passing cases`, () => {
    const cases = buildTypoCorpusEvalCases();
    const report = buildTypoCorpusReport(cases);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_TYPO_CASES);
    expect(report.byKind.lowercase).toBeGreaterThan(0);
    expect(report.byKind.misspell).toBeGreaterThan(0);
    expect(report.passedGate).toBe(true);
  });
});
