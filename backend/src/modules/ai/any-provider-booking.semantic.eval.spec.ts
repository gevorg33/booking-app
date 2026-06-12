import {
  AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES,
  anyProviderBookingSemanticEvalCaseId,
} from './any-provider-booking.semantic.eval.util.js';
import { ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS } from './any-provider-booking.semantic.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('any-provider-booking semantic eval (acc-3.14)', () => {
  it('maps every semantic scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES.length).toBe(
      ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS.length,
    );
    for (const scenario of ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === anyProviderBookingSemanticEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES.map((row) => [
      row.id,
      row,
    ]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
