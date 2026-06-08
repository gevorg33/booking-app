import {
  AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES,
} from './ai-n99-wrong-execution-watchdog.eval.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';

describe('ai-n99-wrong-execution-watchdog eval (n99-2.7)', () => {
  it('maps every watchdog scenario into eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES.length).toBeGreaterThanOrEqual(10);
  });

  it('passes deterministic watchdog eval gate', () => {
    const summary = runDeterministicEvalSuite(
      AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES,
    );
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES.length);
  });

  it.each(AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES)(
    '$id watchdog expectation passes',
    (evalCase) => {
      const summary = runDeterministicEvalSuite([evalCase]);
      expect(summary.failed).toBe(0);
    },
  );
});
