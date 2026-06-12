import { AMBIGUITY_CORPUS_SCENARIOS } from './ai-ambiguity-corpus.fixtures.js';
import {
  AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES,
  ambiguityCorpusEvalCaseId,
} from './ai-ambiguity-corpus.eval.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai ambiguity corpus eval (acc-2.6)', () => {
  it('maps every ambiguity corpus scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES.length).toBe(
      AMBIGUITY_CORPUS_SCENARIOS.length,
    );
  });

  it.each(AMBIGUITY_CORPUS_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'passes ambiguity corpus eval case %s',
    (_id, scenario) => {
      const evalCase = AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES.find(
        (row) => row.id === ambiguityCorpusEvalCaseId(scenario),
      );
      expect(evalCase).toBeDefined();
      const result = evaluateDeterministicEvalCase(evalCase!);
      expect(result.passed).toBe(true);
    },
  );
});
