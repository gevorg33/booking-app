import {
  AI_COMMAND_EVAL_N99_OVER_ASK_CASES,
} from './ai-n99-over-ask.eval.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';

describe('ai-n99-over-ask eval (n99-2.6)', () => {
  it('maps every over-ask scenario into eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_OVER_ASK_CASES.length).toBeGreaterThanOrEqual(10);
  });

  it('passes deterministic over-ask trim eval gate', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_N99_OVER_ASK_CASES);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_N99_OVER_ASK_CASES.length);
  });

  it.each(AI_COMMAND_EVAL_N99_OVER_ASK_CASES)(
    '$id over-ask trim expectation passes',
    (evalCase) => {
      const summary = runDeterministicEvalSuite([evalCase]);
      expect(summary.failed).toBe(0);
    },
  );
});
