import type { AiTraceAnalyticsRow } from '../ai-command-trace.util.js';
import { loadEvalBaseline } from './ai-command-eval.report.js';
import { runDeterministicEvalSuite } from './ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES } from './ai-n99-no-clarify.eval.util.js';
import {
  assertNoClarifyEvalGate,
  buildNoClarifyEvalGateReport,
  resolveWrongExecutionRateForNoClarifyGate,
  type NoClarifyEvalGateReport,
} from './ai-n99-no-clarify-gate.util.js';

export interface NoClarifyEvalGateRunResult {
  report: NoClarifyEvalGateReport;
  wrongExecutionRate: number;
  caseCount: number;
}

/** n99-2.9 — run acc-2 no_clarify corpus + wrong-execution dual gate. */
export function runNoClarifyEvalGate(input?: {
  baselinePath?: string;
  traceRows?: AiTraceAnalyticsRow[];
  tracePeriodDays?: number;
}): NoClarifyEvalGateRunResult {
  const baseline = loadEvalBaseline(input?.baselinePath);
  const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES);
  const wrongExecutionRate = resolveWrongExecutionRateForNoClarifyGate({
    baseline,
    results: summary.results,
    traceRows: input?.traceRows,
    tracePeriodDays: input?.tracePeriodDays,
  });
  const report = buildNoClarifyEvalGateReport({
    cases: AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES,
    results: summary.results,
    baseline,
    wrongExecutionRate,
  });

  return {
    report,
    wrongExecutionRate,
    caseCount: summary.results.length,
  };
}

export function assertNoClarifyEvalGateRun(
  input?: Parameters<typeof runNoClarifyEvalGate>[0],
): NoClarifyEvalGateRunResult {
  const result = runNoClarifyEvalGate(input);
  assertNoClarifyEvalGate(result.report);
  return result;
}
