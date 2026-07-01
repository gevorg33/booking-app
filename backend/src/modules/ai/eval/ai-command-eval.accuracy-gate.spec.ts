import { runAiAccuracyGate } from './ai-command-eval.report.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './ai-command-eval.cases.js';

describe('AI accuracy gate (acc-2.8)', () => {
  it('runs full deterministic eval suite with zero failures', () => {
    const updateBaseline =
      process.env.UPDATE_AI_EVAL_BASELINE === '1' ||
      process.env.UPDATE_AI_EVAL_BASELINE === 'true';
    const { report, exitCode, baselineWritten } = runAiAccuracyGate({
      cases: AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      updateBaseline,
    });
    expect(exitCode).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.totalCases).toBeGreaterThanOrEqual(50);
    expect(report.byIntent.length).toBeGreaterThan(0);
    if (updateBaseline) {
      expect(baselineWritten).toBe(true);
    }
  });
});
