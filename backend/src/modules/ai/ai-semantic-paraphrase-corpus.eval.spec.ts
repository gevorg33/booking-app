import {
  AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
  semanticParaphraseEvalCaseId,
} from './ai-semantic-intent.eval.util.js';
import { SEMANTIC_PARAPHRASE_SCENARIOS } from './ai-semantic-intent.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('semantic paraphrase eval (acc-3.16)', () => {
  it('maps every unknown semantic scenario to a golden eval case', () => {
    const unknown = SEMANTIC_PARAPHRASE_SCENARIOS.filter(
      (scenario) => scenario.classifyAction === 'unknown',
    );
    expect(AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES.length).toBe(unknown.length);
    for (const scenario of unknown) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === semanticParaphraseEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES.map((row) => [row.id, row]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
