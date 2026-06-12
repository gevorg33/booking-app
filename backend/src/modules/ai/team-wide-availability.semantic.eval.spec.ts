import {
  AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES,
  teamWideAvailabilitySemanticEvalCaseId,
} from './team-wide-availability.semantic.eval.util.js';
import { TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS } from './team-wide-availability.semantic.fixtures.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('team-wide-availability semantic eval (pipe-1.13.2)', () => {
  it('maps every semantic scenario to a golden eval case', () => {
    expect(AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES.length).toBe(
      TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS.length,
    );
    for (const scenario of TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS) {
      expect(
        AI_COMMAND_EVAL_DETERMINISTIC_CASES.some(
          (row) => row.id === teamWideAvailabilitySemanticEvalCaseId(scenario),
        ),
      ).toBe(true);
    }
  });

  it.each(
    AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES.map((row) => [
      row.id,
      row,
    ]),
  )('passes eval case %s', (_id, evalCase) => {
    const result = evaluateDeterministicEvalCase(evalCase);
    expect(result.passed).toBe(true);
  });
});
