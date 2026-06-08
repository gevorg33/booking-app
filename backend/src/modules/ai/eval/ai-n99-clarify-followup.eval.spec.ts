import {
  AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES,
} from './ai-n99-clarify-followup.eval.util.js';
import {
  assertClarifyFollowupEvalGate,
  buildClarifyFollowupEvalGateReport,
} from './ai-n99-clarify-followup-gate.util.js';
import { loadEvalBaseline } from './ai-command-eval.report.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';

describe('ai-n99-clarify-followup eval gate (n99-1.9)', () => {
  it('passes clarify_followup gate with EN/HY/RU locale floors', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES);
    const baseline = loadEvalBaseline();
    const report = buildClarifyFollowupEvalGateReport({
      cases: AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES,
      results: summary.results,
      baseline,
    });

    expect(report.gatePassed).toBe(true);
    expect(report.localeScores.every((score) => score.total >= report.minPerLocale)).toBe(
      true,
    );
    assertClarifyFollowupEvalGate(report);
  });

  it.each(AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES)(
    '$id clarify follow-up second-turn success',
    (evalCase) => {
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.errors).toEqual([]);
    },
  );

  it('tags clarify_followup cases with clarify_followup corpus', () => {
    expect(
      AI_COMMAND_EVAL_N99_CLARIFY_FOLLOWUP_CASES.every(
        (entry) => entry.corpus === 'clarify_followup',
      ),
    ).toBe(true);
  });
});
