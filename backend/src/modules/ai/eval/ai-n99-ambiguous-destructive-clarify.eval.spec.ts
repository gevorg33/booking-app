import {
  AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES,
} from './ai-n99-ambiguous-destructive-clarify.eval.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';

describe('ai-n99-ambiguous-destructive-clarify eval (n99-2.8)', () => {
  it('maps every guardrail scenario into eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES.length).toBeGreaterThanOrEqual(10);
  });

  it('passes deterministic ambiguous/destructive guardrail eval gate', () => {
    const summary = runDeterministicEvalSuite(
      AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES,
    );
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES.length);
  });

  it.each(AI_COMMAND_EVAL_N99_AMBIGUOUS_DESTRUCTIVE_CASES)(
    '$id guardrail expectation passes',
    (evalCase) => {
      const summary = runDeterministicEvalSuite([evalCase]);
      expect(summary.failed).toBe(0);
    },
  );
});
