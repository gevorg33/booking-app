import {
  AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES,
  recommendSpecialistsSemanticEvalCaseId,
} from './recommend-specialists.semantic.eval.util.js';
import { RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS } from './recommend-specialists.semantic.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('recommend-specialists semantic eval (acc-3.14)', () => {
  it('maps every semantic scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES.length).toBe(
      RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS.length,
    );
    for (const scenario of RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === recommendSpecialistsSemanticEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES.map((row) => [
      row.id,
      row,
    ]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
