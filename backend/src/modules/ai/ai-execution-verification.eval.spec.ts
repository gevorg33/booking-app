import { AI_COMMAND_EVAL_CORPUS_CASES } from './eval/ai-command-eval.corpus.js';
import {
  BLAST_RADIUS_PARAM_SCENARIOS,
  INTENT_GRADUATION_SCENARIOS,
  PLAN_VERIFY_SCENARIOS,
  RESOLUTION_VERIFY_SCENARIOS,
} from './ai-execution-verification.fixtures.js';
import { POST_EXEC_ASSERTION_SCENARIOS } from './ai-post-exec-assertion.fixtures.js';
import { INTRA_PLAN_DUPLICATE_SCENARIOS } from './ai-execute-idempotency.fixtures.js';
import { MEDIUM_RISK_PREVIEW_ACTIONS } from './ai-mutation-preview-diff.fixtures.js';
import { HIGH_RISK_CONFIRM_ACTIONS } from './ai-high-risk-confirm-clarify.fixtures.js';
import { buildExecutionVerificationGate } from './ai-execution-verification.util.js';
import {
  assertReadMutateParity,
  PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS,
} from './ai-parity-2.6-read-mutate.util.js';
import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} from './ai-command-registry.build.js';

/** acc-5 — fixture corpora + gate regression coverage for execution verification. */
describe('ai-execution-verification eval gate (acc-5)', () => {
  it('acc-5.1 — resolution accuracy fixture corpus covers ambiguous and weak bindings', () => {
    expect(RESOLUTION_VERIFY_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    const failing = RESOLUTION_VERIFY_SCENARIOS.filter((row) => !row.expectOk);
    expect(failing.length).toBeGreaterThanOrEqual(5);
    expect(
      failing.some((row) => row.expectFields?.includes('employeeName')),
    ).toBe(true);
  });

  it('acc-5.2 — plan-vs-prompt fixture corpus includes scope mismatch cases', () => {
    expect(PLAN_VERIFY_SCENARIOS.length).toBeGreaterThanOrEqual(6);
    expect(
      PLAN_VERIFY_SCENARIOS.some(
        (row) => !row.expectOk && (row.expectMismatches?.length ?? 0) > 0,
      ),
    ).toBe(true);
  });

  it('acc-5.3 — medium-risk preview actions include create_booking', () => {
    expect(MEDIUM_RISK_PREVIEW_ACTIONS.has('create_booking')).toBe(true);
    expect(MEDIUM_RISK_PREVIEW_ACTIONS.size).toBeGreaterThanOrEqual(3);
  });

  it('acc-5.4 — post-exec assertion scenarios cover success and mismatch paths', () => {
    expect(POST_EXEC_ASSERTION_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(
      POST_EXEC_ASSERTION_SCENARIOS.some((row) => row.expectOk),
    ).toBe(true);
    expect(
      POST_EXEC_ASSERTION_SCENARIOS.some((row) => !row.expectOk),
    ).toBe(true);
  });

  it('acc-5.6 — execute revalidation fixtures include intra-plan duplicates', () => {
    expect(INTRA_PLAN_DUPLICATE_SCENARIOS.length).toBeGreaterThanOrEqual(2);
  });

  it('acc-5.7 — blast-radius fixtures include over-cap cancellations', () => {
    expect(
      BLAST_RADIUS_PARAM_SCENARIOS.some((row) => row.expectExceeds),
    ).toBe(true);
  });

  it('acc-5.8 — intent graduation fixtures gate propose-only intents', () => {
    expect(
      INTENT_GRADUATION_SCENARIOS.some((row) => row.expectProposeOnly),
    ).toBe(true);
    expect(
      INTENT_GRADUATION_SCENARIOS.some(
        (row) => row.expectGraduated && !row.expectProposeOnly,
      ),
    ).toBe(true);
  });

  it('acc-5.1 — ambiguity eval corpus still routes ambiguous providers to clarify (acc-2.6)', () => {
    const ambiguousProviderCases = AI_COMMAND_EVAL_CORPUS_CASES.filter(
      (entry) => entry.expect.ambiguityCategory === 'ambiguous_provider',
    );
    expect(ambiguousProviderCases.length).toBeGreaterThanOrEqual(3);
    for (const evalCase of ambiguousProviderCases) {
      expect(evalCase.expect.clarifyFields).toContain('employeeName');
    }
  });

  it('buildExecutionVerificationGate blocks over-cap blast radius without confirm', () => {
    const overCap = BLAST_RADIUS_PARAM_SCENARIOS.find(
      (row) => row.id === 'cancel-thirty-bookings',
    )!;
    const gate = buildExecutionVerificationGate({
      prompt: 'cancel all bookings this week',
      action: overCap.action,
      params: overCap.params,
      enrichedParams: overCap.params,
    });
    expect(gate?.details.clarifySource).toBe('blast_radius_cap');
    expect(gate?.details.requiresExecutionConfirmation).toBe(true);
  });

  it('parity-2.6 — registry mutating intents honor preview/confirm + blast-radius + post-exec', () => {
    const registry = buildCommandRegistry(
      collectCompoundStepIds(buildCompoundCommandRecipes()),
    );
    const status = assertReadMutateParity(registry);
    expect(status.complete).toBe(true);
    expect(
      [...PARITY_26_DESTRUCTIVE_BLAST_RADIUS_ACTIONS].some((action) =>
        HIGH_RISK_CONFIRM_ACTIONS.has(action),
      ),
    ).toBe(true);
  });
});
