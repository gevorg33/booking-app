import {
  assertSemanticParaphraseCoverageGate,
  buildSemanticParaphraseCoverageReport,
  buildSemanticParaphraseEvalCases,
  formatSemanticParaphraseCoverageReport,
  SEMANTIC_PARAPHRASE_MIN_PER_LOCALE,
} from './ai-command-eval.semantic-paraphrase.util.js';
import { SEMANTIC_PARAPHRASE_INTENT_BANK } from './ai-command-eval.semantic-paraphrase.fixtures.js';
import { runSemanticParaphraseEvalSuite } from './ai-command-eval.semantic.util.js';

describe('ai-command-eval.semantic-paraphrase (acc-3.16)', () => {
  const cases = buildSemanticParaphraseEvalCases();

  it('builds 5+ EN/HY/RU paraphrases for each semantic intent', () => {
    const report = buildSemanticParaphraseCoverageReport(cases);
    expect(report.intentCount).toBe(Object.keys(SEMANTIC_PARAPHRASE_INTENT_BANK).length);
    expect(report.totalCases).toBeGreaterThanOrEqual(
      report.intentCount * 3 * SEMANTIC_PARAPHRASE_MIN_PER_LOCALE,
    );
    assertSemanticParaphraseCoverageGate(cases);
    expect(formatSemanticParaphraseCoverageReport(report)).toContain('create_booking');
  });

  it('semantic matcher resolves full paraphrase corpus', () => {
    const summary = runSemanticParaphraseEvalSuite(cases);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(cases.length);
  });
});
