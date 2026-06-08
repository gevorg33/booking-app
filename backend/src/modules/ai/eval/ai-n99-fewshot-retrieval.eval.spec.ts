import {
  AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES,
} from './ai-n99-fewshot-retrieval.eval.util.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';

describe('ai-n99-fewshot-retrieval eval (n99-2.4)', () => {
  it('maps every fixture scenario into eval cases', () => {
    expect(AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES.length).toBeGreaterThanOrEqual(10);
    expect(
      AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES.every(
        (entry) => entry.expect.fewShotRetrieval?.expectedAction,
      ),
    ).toBe(true);
  });

  it('passes deterministic few-shot retrieval eval gate', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES.length);
  });

  it.each(AI_COMMAND_EVAL_N99_FEWSHOT_RETRIEVAL_CASES)(
    '$id few-shot retrieval expectation passes',
    (evalCase) => {
      const summary = runDeterministicEvalSuite([evalCase]);
      expect(summary.failed).toBe(0);
    },
  );
});
