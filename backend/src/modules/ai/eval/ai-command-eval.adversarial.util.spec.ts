import {
  ACC_EVAL_ADVERSARIAL_CATEGORIES,
  ACC_EVAL_MIN_ADVERSARIAL_CASES,
  ADVERSARIAL_CORPUS_SEEDS,
  buildAdversarialCorpusEvalCases,
  buildAdversarialCorpusReport,
  evaluateAdversarialSecurityExpectation,
} from './ai-command-eval.adversarial.util.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.adversarial.util (acc-2.7)', () => {
  it.each(ADVERSARIAL_CORPUS_SEEDS.map((seed) => [seed.id, seed]))(
    'seed %s blocks with expected security reason',
    (_id, seed) => {
      const actual = evaluateAdversarialSecurityExpectation(seed);
      expect(actual.blocked).toBe(true);
      expect(actual.reason).toBe(seed.blockReason);
    },
  );

  it(`acc-2.7 — adversarial corpus meets minimum ${ACC_EVAL_MIN_ADVERSARIAL_CASES} passing cases`, () => {
    const cases = buildAdversarialCorpusEvalCases();
    const report = buildAdversarialCorpusReport(cases);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_ADVERSARIAL_CASES);
    expect(report.passedGate).toBe(true);
    for (const category of ACC_EVAL_ADVERSARIAL_CATEGORIES) {
      expect(report.byCategory[category]).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(buildAdversarialCorpusEvalCases().map((entry) => [entry.id, entry]))(
    'eval case %s passes deterministic security gate',
    (_id, evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );
});
