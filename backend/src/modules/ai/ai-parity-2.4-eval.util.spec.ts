import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_PARITY_24_CASES } from './eval/ai-parity-2.4-eval.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  assertParity24EvalComplete,
  formatParity24EvalReport,
  PARITY_24_REQUIRED_LOCALES,
} from './ai-parity-2.4-eval.util.js';
import {
  PARITY_24_EVAL_SCENARIOS,
  PARITY_24_INTENT_SPECS,
} from './ai-parity-2.4-eval.fixtures.js';

describe('ai-parity-2.4-eval (parity-2.4)', () => {
  it('builds EN/HY/RU cases for every parity gap-closure intent spec', () => {
    expect(PARITY_24_EVAL_SCENARIOS.length).toBe(
      PARITY_24_INTENT_SPECS.length * PARITY_24_REQUIRED_LOCALES.length,
    );
    expect(AI_COMMAND_EVAL_PARITY_24_CASES.length).toBe(
      PARITY_24_EVAL_SCENARIOS.length,
    );
  });

  it('passes parity-2.4 eval coverage gate on deterministic corpus', () => {
    const status = assertParity24EvalComplete(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    if (!status.complete) {
      console.log(formatParity24EvalReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.coveredSpecs).toBe(PARITY_24_INTENT_SPECS.length);
  });

  it('passes deterministic eval runner for every parity-2.4 case', () => {
    const failures = AI_COMMAND_EVAL_PARITY_24_CASES.map((evalCase) =>
      evaluateDeterministicEvalCase(evalCase),
    ).filter((result) => !result.passed);
    if (failures.length > 0) {
      throw new Error(
        failures
          .slice(0, 10)
          .map((entry) => `${entry.id}: ${entry.errors.join('; ')}`)
          .join('\n'),
      );
    }
  });

  it('formats parity-2.4 eval report', () => {
    const status = assertParity24EvalComplete(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    const text = formatParity24EvalReport(status);
    expect(text).toContain('AI Feature Parity Eval Coverage (parity-2.4)');
    if (process.env.PARITY_24_REPORT === '1') {
      console.log(text);
    }
  });
});
