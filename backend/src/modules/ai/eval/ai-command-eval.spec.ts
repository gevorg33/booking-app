import {
  AI_COMMAND_EVAL_CASES,
  AI_COMMAND_EVAL_COMPOUND_CASES,
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_LLM_CASES,
  AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
  compoundScenarioToEvalCase,
} from './ai-command-eval.cases.js';
import { COMPOUND_DECOMPOSITION_SCENARIOS } from '../intent-decomposition.fixtures.js';
import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';

describe('AI command eval harness (Sprint 14 / gap-3.1 + ai-cmd-0.4)', () => {
  /**
   * The corpus run lives in `ai-command-eval.accuracy-gate.spec.ts`, not here.
   *
   * This used to be `expect(summary.failed).toBe(0)` over all 8,464 CI cases.
   * `e2e-bug.358` established that the corpus carries **404 known failures**, and
   * fixed the *gate* to record that debt and ratchet it down rather than fail on
   * it. This assertion was never updated, so it has been permanently red ever
   * since — and it re-ran the entire corpus, in its own jest process, to get
   * there.
   *
   * The cost was measured in §101: **355s, 11.5% of the whole AI test sweep**,
   * spent duplicating a run the accuracy gate already does and then failing on a
   * number the gate deliberately tolerates. It is also two of the 112 failures
   * that make `e2e-bug.351`'s "red means red" unachievable.
   *
   * Deleting it loses no coverage. The gate asserts strictly more: same 8,464
   * cases, plus a baseline comparison, plus per-intent regression detection —
   * `evaluateAccuracyRatchet` fails if accuracy drops or any intent regresses.
   * A pass/fail assertion that cannot pass was never protecting anything.
   */
  it('leaves the corpus run to the accuracy gate, which ratchets it', () => {
    // Cheap structural checks only — no evaluation.
    expect(AI_COMMAND_EVAL_DETERMINISTIC_CASES.length).toBeGreaterThanOrEqual(50);
    expect(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.every((c) => typeof c.prompt === 'string'),
    ).toBe(true);
  });

  it('has unique ids across the full deterministic catalog', () => {
    const ids = AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('passes hand-crafted compound cases for payments, marketing, and cart flows', () => {
    const ids = [
      'compound-dashboard-payments-export',
      'compound-dashboard-marketing-reengagement',
      'compound-customer-cart-duration',
    ];
    for (const id of ids) {
      const evalCase = AI_COMMAND_EVAL_CASES.find((entry) => entry.id === id);
      expect(evalCase).toBeDefined();
      expect(evaluateDeterministicEvalCase(evalCase!).passed).toBe(true);
    }
  });

  it('compound eval cases include dashboard, customer, and provider surfaces', () => {
    const surfaces = new Set(
      AI_COMMAND_EVAL_COMPOUND_CASES.map((c) => c.expect.compoundSurface),
    );
    expect([...surfaces]).toEqual(
      expect.arrayContaining(['dashboard', 'customer', 'provider', 'public']),
    );
  });

  it('maps every compound decomposition scenario to an eval case', () => {
    expect(AI_COMMAND_EVAL_COMPOUND_CASES.length).toBeGreaterThanOrEqual(
      COMPOUND_DECOMPOSITION_SCENARIOS.length,
    );
    for (const scenario of COMPOUND_DECOMPOSITION_SCENARIOS) {
      const evalCase = compoundScenarioToEvalCase(scenario);
      expect(
        AI_COMMAND_EVAL_COMPOUND_CASES.some(
          (entry) => entry.id === evalCase.id,
        ),
      ).toBe(true);
      const result = evaluateDeterministicEvalCase(evalCase);
      expect(result.passed).toBe(true);
    }
  });

  it('covers registry compound example prompts per surface', () => {
    expect(
      AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES.length,
    ).toBeGreaterThanOrEqual(10);
    const surfaces = new Set(
      AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES.map(
        (c) => c.expect.compoundSurface,
      ),
    );
    expect([...surfaces]).toEqual(
      expect.arrayContaining(['dashboard', 'customer', 'provider']),
    );
    const summary = runDeterministicEvalSuite(
      AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
    );
    expect(summary.failed).toBe(0);
  });

  it('runs legacy routing cases independently', () => {
    const summary = runDeterministicEvalSuite(AI_COMMAND_EVAL_CASES);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBeGreaterThanOrEqual(15);
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
