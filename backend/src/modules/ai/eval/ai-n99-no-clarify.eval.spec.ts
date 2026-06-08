import {
  AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES,
} from './ai-n99-no-clarify.eval.util.js';
import {
  assertNoClarifyEvalGateRun,
  runNoClarifyEvalGate,
} from './ai-n99-no-clarify-gate.eval.util.js';
import { isAcc2NoClarifyEvalCase } from './ai-n99-no-clarify-gate.util.js';
import { loadEvalBaseline } from './ai-command-eval.report.js';
import {
  evaluateDeterministicEvalCase,
} from './ai-command-eval.runner.js';

describe('ai-n99-no-clarify eval gate (n99-2.9)', () => {
  it('passes dual gate with EN/HY/RU locale floors and wrong-exec ceiling', () => {
    const result = assertNoClarifyEvalGateRun();

    expect(result.report.dualGateMet).toBe(true);
    expect(result.report.noClarifyGateMet).toBe(true);
    expect(result.report.wrongExecutionGateMet).toBe(true);
    expect(
      result.report.localeScores.every((score) => score.total >= result.report.minPerLocale),
    ).toBe(true);
  });

  it.each(AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES)(
    '$id no-clarify completion eval case',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
    },
  );

  it('tags no_clarify cases with no_clarify corpus', () => {
    expect(
      AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES.every((entry) => entry.corpus === 'no_clarify'),
    ).toBe(true);
  });

  it('no_clarify corpus is acc-2 eligible except explicit guardrail scenarios', () => {
    const guardrailOrBlocked = AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES.filter(
      (entry) =>
        !isAcc2NoClarifyEvalCase(entry),
    );
    expect(guardrailOrBlocked.length).toBeGreaterThan(0);
    expect(
      guardrailOrBlocked.every(
        (entry) =>
          entry.expect.noClarifyCompletion?.expectBlocked === true ||
          entry.difficulty === 'ambiguity',
      ),
    ).toBe(true);

    const successCases = AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES.filter(
      (entry) =>
        entry.expect.noClarifyCompletion &&
        !entry.expect.noClarifyCompletion.expectBlocked &&
        entry.difficulty !== 'ambiguity',
    );
    expect(successCases.length).toBeGreaterThan(0);
    expect(successCases.every(isAcc2NoClarifyEvalCase)).toBe(true);
  });

  it('uses baseline wrong-execution snapshot when trace rows are absent', () => {
    const baseline = loadEvalBaseline();
    const result = runNoClarifyEvalGate();

    expect(result.wrongExecutionRate).toBe(baseline.lastWrongExecutionRate);
    expect(result.report.wrongExecutionGateMet).toBe(true);
  });
});
