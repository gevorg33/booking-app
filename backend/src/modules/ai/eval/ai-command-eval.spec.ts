import {
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
} from './ai-command-eval.cases.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';

describe('AI command eval harness (Sprint 14 / gap-3.1)', () => {
  it('runs all deterministic golden cases without failures', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_CASES);
    const failures = summary.results.filter((r) => !r.passed);
    if (failures.length > 0) {
      const detail = failures
        .map((f) => `${f.id}: ${f.errors.join('; ')}`)
        .join('\n');
      throw new Error(`Eval failures:\n${detail}`);
    }
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBeGreaterThanOrEqual(10);
  });

  it('documents LLM-only cases separately from CI', () => {
    expect(AI_COMMAND_EVAL_LLM_CASES.every((c) => c.requiresLlm)).toBe(true);
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_LLM_CASES);
    expect(summary.passed).toBe(0);
    expect(summary.results).toHaveLength(0);
  });

  it.each([
    ['en-reschedule-am', '09:00'],
    ['en-reschedule-pm', '14:30'],
    ['en-reschedule-to-at-pm', '15:00'],
  ] as const)('parses AM/PM reschedule for %s', (caseId, expectedTime) => {
    const evalCase = AI_COMMAND_EVAL_CASES.find((c) => c.id === caseId);
    expect(evalCase).toBeDefined();
    const result = evaluateDeterministicEvalCase(evalCase!);
    expect(result.passed).toBe(true);
    expect(evalCase!.expect.rescheduleTimeSlot).toBe(expectedTime);
  });
});
