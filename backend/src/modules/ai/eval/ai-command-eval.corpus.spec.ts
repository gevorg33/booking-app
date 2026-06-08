import {
  AI_COMMAND_EVAL_ADVERSARIAL_CASES,
  AI_COMMAND_EVAL_AMBIGUITY_CASES,
  AI_COMMAND_EVAL_TYPO_FUZZY_CASES,
} from './ai-command-eval.corpus.js';
import {
  ACC_EVAL_MIN_ADVERSARIAL_CASES,
  buildAdversarialCorpusReport,
} from './ai-command-eval.adversarial.util.js';
import {
  ACC_EVAL_MIN_AMBIGUITY_CASES,
  buildAmbiguityCorpusReport,
} from './ai-command-eval.ambiguity.util.js';
import {
  ACC_EVAL_MIN_TYPO_CASES,
  buildTypoCorpusReport,
  buildTypoFuzzyVariants,
} from './ai-command-eval.corpus.util.js';
import { evaluateDeterministicEvalCase } from './ai-command-eval.runner.js';

describe('ai-command-eval.corpus (acc-2.4–2.7)', () => {
  it('acc-2.5 — typo/fuzzy variants cover lowercase, abbrev, and misspellings', () => {
    const variants = buildTypoFuzzyVariants('Clear Gevorg schedule for tomorrow!');
    expect(variants.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['lowercase', 'no_punct', 'abbrev', 'misspell']),
    );
    const report = buildTypoCorpusReport(AI_COMMAND_EVAL_TYPO_FUZZY_CASES);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_TYPO_CASES);
    expect(report.passedGate).toBe(true);
  });

  it('acc-2.6 — ambiguity corpus covers clarify fields, not execution', () => {
    const report = buildAmbiguityCorpusReport(AI_COMMAND_EVAL_AMBIGUITY_CASES);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_AMBIGUITY_CASES);
    expect(report.passedGate).toBe(true);
    for (const evalCase of AI_COMMAND_EVAL_AMBIGUITY_CASES) {
      expect(evalCase.expect.clarifyFields?.length).toBeGreaterThan(0);
      expect(evalCase.id).toMatch(/^amb-/);
    }
  });

  it('acc-2.7 — adversarial corpus blocks injection, export, bypass, and scope escalation', () => {
    const report = buildAdversarialCorpusReport(AI_COMMAND_EVAL_ADVERSARIAL_CASES);
    expect(report.total).toBeGreaterThanOrEqual(ACC_EVAL_MIN_ADVERSARIAL_CASES);
    expect(report.passedGate).toBe(true);
    for (const evalCase of AI_COMMAND_EVAL_ADVERSARIAL_CASES) {
      expect(evalCase.expect.securityBlocked).toBe(true);
      expect(evalCase.expect.securityBlockReason).toBeTruthy();
      expect(evalCase.id).toMatch(/^adv-/);
    }
  });

  it.each(AI_COMMAND_EVAL_ADVERSARIAL_CASES.map((entry) => [entry.id, entry]))(
    'acc-2.7 — adversarial case %s blocks security preflight',
    (_id, evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );

  it.each(AI_COMMAND_EVAL_AMBIGUITY_CASES.map((entry) => [entry.id, entry]))(
    'acc-2.6 — ambiguity case %s expects clarify fields',
    (_id, evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );

  it.each(AI_COMMAND_EVAL_TYPO_FUZZY_CASES.map((entry) => [entry.id, entry]))(
    'acc-2.5 — typo case %s preserves rescue path',
    (_id, evalCase) => {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    },
  );
});
