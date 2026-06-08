import { NO_CLARIFY_GATE_TRACE_SCENARIOS } from './ai-n99-no-clarify-gate.fixtures.js';
import {
  assertNoClarifyEvalGateRun,
  runNoClarifyEvalGate,
} from './ai-n99-no-clarify-gate.eval.util.js';
import { loadEvalBaseline } from './ai-command-eval.report.js';

describe('ai-n99-no-clarify-gate eval runner (n99-2.9)', () => {
  it('passes dual gate on acc-2 no_clarify corpus with baseline wrong-exec snapshot', () => {
    const result = assertNoClarifyEvalGateRun();

    expect(result.report.dualGateMet).toBe(true);
    expect(result.report.noClarifyGateMet).toBe(true);
    expect(result.report.wrongExecutionGateMet).toBe(true);
    expect(result.wrongExecutionRate).toBe(loadEvalBaseline().lastWrongExecutionRate);
    expect(result.caseCount).toBeGreaterThanOrEqual(
      loadEvalBaseline().noClarifyMinCases ?? 50,
    );
  });

  it.each(NO_CLARIFY_GATE_TRACE_SCENARIOS)(
    '$id resolves wrong-execution rate from trace rows',
    (scenario) => {
      const result = runNoClarifyEvalGate({ traceRows: [...scenario.rows] });

      expect(result.wrongExecutionRate).toBeCloseTo(scenario.expectWrongExecutionRate, 5);
      expect(result.report.wrongExecutionGateMet).toBe(
        scenario.expectWrongExecutionGateMet,
      );
    },
  );
});
