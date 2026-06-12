import { TYPO_CORPUS_ENTRIES } from './ai-typo-corpus.fixtures.js';
import {
  AI_COMMAND_EVAL_TYPO_CORPUS_CASES,
  typoCorpusEvalCaseId,
} from './ai-typo-corpus.eval.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai typo corpus eval (acc-2.5)', () => {
  it('maps every typo corpus entry to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_TYPO_CORPUS_CASES.length).toBe(
      TYPO_CORPUS_ENTRIES.length,
    );
    for (const entry of TYPO_CORPUS_ENTRIES) {
      expect(
        AI_COMMAND_EVAL_TYPO_CORPUS_CASES.some(
          (row) => row.id === typoCorpusEvalCaseId(entry),
        ),
      ).toBe(true);
    }
  });

  it.each(TYPO_CORPUS_ENTRIES.map((entry) => [entry.id, entry]))(
    'passes typo corpus eval case %s',
    (_id, entry) => {
      const evalCase = AI_COMMAND_EVAL_TYPO_CORPUS_CASES.find(
        (row) => row.id === typoCorpusEvalCaseId(entry),
      );
      expect(evalCase).toBeDefined();
      const result = evaluateDeterministicEvalCase(evalCase!);
      expect(result.passed).toBe(true);
    },
  );
});
