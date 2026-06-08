import {
  NO_CLARIFY_DUAL_GATE_SCENARIOS,
  NO_CLARIFY_GATE_TRACE_SCENARIOS,
  NO_CLARIFY_RATCHET_SCENARIOS,
  NO_CLARIFY_WRONG_EXEC_SCENARIOS,
} from './ai-n99-no-clarify-gate.fixtures.js';
import {
  buildNoClarifyEvalGateReport,
  proposeNoClarifyFloorBump,
  resolveWrongExecutionRateForNoClarifyGate,
} from './ai-n99-no-clarify-gate.util.js';
import type { AiCommandEvalCase, AiEvalCaseResult } from './ai-command-eval.types.js';

function mockCases(count: number): AiCommandEvalCase[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `mock-${index}`,
    prompt: 'book massage tomorrow',
    locale: (index % 3 === 0 ? 'hy' : index % 3 === 1 ? 'ru' : 'en') as const,
    expect: {},
  }));
}

function mockResults(cases: AiCommandEvalCase[], passed = true): AiEvalCaseResult[] {
  return cases.map((entry) => ({
    id: entry.id,
    passed,
    errors: passed ? [] : ['failed'],
  }));
}

describe('ai-n99-no-clarify-gate.util (n99-2.9)', () => {
  it.each(NO_CLARIFY_RATCHET_SCENARIOS)(
    '$id no_clarify ratchet proposal',
    (scenario) => {
      const proposal = proposeNoClarifyFloorBump({
        currentFloor: scenario.currentFloor,
        measuredAccuracy: scenario.measuredAccuracy,
      });
      expect(proposal.shouldBump).toBe(scenario.expectBump);
      expect(proposal.proposedFloor).toBeCloseTo(scenario.expectNextFloor, 5);
    },
  );

  it.each(NO_CLARIFY_WRONG_EXEC_SCENARIOS)(
    '$id wrong-execution ceiling in gate report',
    (scenario) => {
      const cases = mockCases(15);
      const results = mockResults(cases);
      const report = buildNoClarifyEvalGateReport({
        cases,
        results,
        wrongExecutionRate: scenario.wrongExecutionRate,
      });
      expect(report.wrongExecutionGateMet).toBe(scenario.expectPass);
      expect(report.dualGateMet).toBe(scenario.expectPass);
    },
  );

  it.each(NO_CLARIFY_DUAL_GATE_SCENARIOS)(
    '$id dual gate (no_clarify floor + wrong-exec ceiling)',
    (scenario) => {
      const cases = mockCases(15);
      const passedCount = Math.round(scenario.accuracy * cases.length);
      const results = cases.map((entry, index) => ({
        id: entry.id,
        passed: index < passedCount,
        errors: index < passedCount ? [] : ['failed'],
      }));
      const report = buildNoClarifyEvalGateReport({
        cases,
        results,
        baseline: { noClarifyFloor: scenario.floor, noClarifyMinCases: 15 },
        wrongExecutionRate: scenario.wrongExecutionRate,
      });

      expect(report.dualGateMet).toBe(scenario.expectDualGateMet);
      if ('expectFailureIncludes' in scenario && scenario.expectFailureIncludes) {
        expect(
          report.gateFailures.some((line) =>
            line.includes(scenario.expectFailureIncludes),
          ),
        ).toBe(true);
      }
    },
  );

  it.each(NO_CLARIFY_GATE_TRACE_SCENARIOS)(
    '$id resolveWrongExecutionRateForNoClarifyGate from trace rows',
    (scenario) => {
      const rate = resolveWrongExecutionRateForNoClarifyGate({
        traceRows: [...scenario.rows],
      });
      expect(rate).toBeCloseTo(scenario.expectWrongExecutionRate, 5);
    },
  );
});
