import {
  AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES,
} from './ai-n99-deterministic-rescue.eval.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';

describe('ai-n99-deterministic-rescue eval (n99-2.5)', () => {
  it('maps every n99 rescue scenario into eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES.length).toBe(12);
    expect(
      AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES.every(
        (entry) => entry.expect.rescuedAction && entry.expect.rescueFromAction,
      ),
    ).toBe(true);
  });

  it('passes deterministic rescue eval gate for all n99-2.5 scenarios', () => {
    const summary = runDeterministicEvalSuite(
      AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES,
    );
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES.length);
  });

  it.each(AI_COMMAND_EVAL_N99_DETERMINISTIC_RESCUE_CASES)(
    '$id regression passes through eval runner',
    (evalCase) => {
      const summary = runDeterministicEvalSuite([evalCase]);
      expect(summary.failed).toBe(0);
    },
  );
});
