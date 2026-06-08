import { AI_COMMAND_EVAL_LLM_CASES } from './ai-command-eval.cases.js';
import {
  assertLlmEvalDriftGate,
  buildLlmEvalReportFromSummary,
  formatLlmEvalReport,
  loadLlmEvalBaseline,
  validateLlmEvalBaseline,
} from './ai-command-eval.llm-report.js';

describe('ai-command-eval.llm-report (acc-2.10)', () => {
  it('loads and validates LLM baseline', () => {
    const baseline = loadLlmEvalBaseline();
    expect(validateLlmEvalBaseline(baseline)).toEqual([]);
    expect(baseline.minTotalCases).toBeGreaterThanOrEqual(
      AI_COMMAND_EVAL_LLM_CASES.length,
    );
  });

  it('builds LLM-path report separately from deterministic metrics', () => {
    const baseline = loadLlmEvalBaseline();
    const report = buildLlmEvalReportFromSummary(
      AI_COMMAND_EVAL_LLM_CASES,
      {
        passed: AI_COMMAND_EVAL_LLM_CASES.length,
        failed: 0,
        skipped: 0,
        results: AI_COMMAND_EVAL_LLM_CASES.map((entry) => ({
          id: entry.id,
          passed: true,
          errors: [],
          surface: 'dashboard',
          expectedAction: entry.expect.action,
          actualAction: entry.expect.action,
          tokensUsed: 100,
        })),
        totalTokensUsed: AI_COMMAND_EVAL_LLM_CASES.length * 100,
      },
      baseline,
    );

    expect(report.path).toBe('llm');
    expect(report.evaluatedCases).toBe(AI_COMMAND_EVAL_LLM_CASES.length);
    expect(report.gatePassed).toBe(true);
    expect(formatLlmEvalReport(report)).toContain('LLM-path eval report');
  });

  it('assertLlmEvalDriftGate fails on regression', () => {
    const baseline = loadLlmEvalBaseline();
    const report = buildLlmEvalReportFromSummary(
      AI_COMMAND_EVAL_LLM_CASES,
      {
        passed: 0,
        failed: 1,
        skipped: AI_COMMAND_EVAL_LLM_CASES.length - 1,
        results: [
          {
            id: 'forced-fail',
            passed: false,
            errors: ['action mismatch'],
            surface: 'dashboard',
            expectedAction: 'create_booking',
            actualAction: 'unknown',
          },
        ],
        totalTokensUsed: 500,
      },
      baseline,
    );

    expect(report.driftDetected).toBe(true);
    expect(() => assertLlmEvalDriftGate(report)).toThrow(/acc-2.10/);
  });
});
