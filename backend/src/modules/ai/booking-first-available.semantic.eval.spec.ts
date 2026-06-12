import {
  AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES,
  bookingFirstAvailableSemanticEvalCaseId,
} from './booking-first-available.semantic.eval.util.js';
import { BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS } from './booking-first-available.semantic.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('booking-first-available semantic eval (pipe-1.13.1)', () => {
  it('maps every semantic scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES.length).toBe(
      BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS.length,
    );
    for (const scenario of BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === bookingFirstAvailableSemanticEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES.map((row) => [
      row.id,
      row,
    ]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
