import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} from './ai-command-registry.build.js';
import {
  AGENT_NON_UNDOABLE_ACTIONS,
  AGENT_UNDOABLE_ACTIONS,
} from '../../engine/agent/agent-task-undo.service.js';
import { buildBlastRadiusCapGateResult } from './ai-blast-radius-cap.util.js';
import { buildExecutionVerificationGate } from './ai-execution-verification.util.js';
import { needsMutationPreviewDiff } from './ai-mutation-preview-diff.util.js';
import { POST_EXEC_ASSERTABLE_ACTIONS } from './ai-post-exec-assertion.fixtures.js';
import { shouldRunPostExecAssertion } from './ai-post-exec-assertion.util.js';
import {
  assertDestructiveBlastRadiusGate,
  assertReadMutateParity,
  formatReadMutateParityReport,
  hasMutatingPreviewConfirmCoverage,
  hasMutatingUndoCoverage,
  PARITY_26_PROBE_SCENARIOS,
  requiresDestructiveBlastRadius,
} from './ai-parity-2.6-read-mutate.util.js';

describe('ai-parity-2.6-read-mutate (parity-2.6)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const registryById = new Map(registry.map((entry) => [entry.id, entry]));

  it.each(PARITY_26_PROBE_SCENARIOS)(
    '$id — read/mutate safety probes',
    (scenario) => {
      const entry = registryById.get(scenario.action);
      if ('expectMutating' in scenario && scenario.expectMutating === false) {
        expect(entry?.mutating).toBe(false);
        return;
      }
      expect(entry?.mutating).toBe(true);

      if ('expectPreviewConfirm' in scenario && scenario.expectPreviewConfirm) {
        expect(hasMutatingPreviewConfirmCoverage(entry!)).toBe(true);
      }
      if ('expectCustomerExempt' in scenario && scenario.expectCustomerExempt) {
        expect(needsMutationPreviewDiff(scenario.action, false)).toBe(false);
      }
      if ('expectPostExec' in scenario && scenario.expectPostExec) {
        expect(shouldRunPostExecAssertion(scenario.action)).toBe(true);
        expect(POST_EXEC_ASSERTABLE_ACTIONS.has(scenario.action)).toBe(true);
      }
      if ('expectUndoable' in scenario && scenario.expectUndoable) {
        expect(AGENT_UNDOABLE_ACTIONS.has(scenario.action)).toBe(true);
        expect(hasMutatingUndoCoverage(entry!)).toBe(true);
      }
      if ('expectNonUndoable' in scenario && scenario.expectNonUndoable) {
        expect(AGENT_NON_UNDOABLE_ACTIONS.has(scenario.action)).toBe(true);
        expect(hasMutatingUndoCoverage(entry!)).toBe(true);
      }
      if (
        'expectDestructiveBlast' in scenario &&
        scenario.expectDestructiveBlast
      ) {
        expect(requiresDestructiveBlastRadius(scenario.action)).toBe(true);
        expect(assertDestructiveBlastRadiusGate(scenario.action)).toBe(true);
      }
      if ('expectBlastGate' in scenario && scenario.expectBlastGate) {
        const gate = buildBlastRadiusCapGateResult({
          prompt: 'cancel many',
          action: scenario.action,
          params: scenario.params,
          confirmed: false,
        });
        expect(gate?.details?.clarifySource).toBe('blast_radius_cap');
        expect(gate?.details?.requiresExecutionConfirmation).toBe(true);
      }
    },
  );

  it('needsMutationPreviewDiff covers registry mutating ops intents (parity-2.6)', () => {
    const opsMutating = registry.filter(
      (entry) =>
        entry.mutating &&
        entry.id !== 'unknown' &&
        entry.surfaces.some(
          (surface) => surface === 'dashboard' || surface === 'provider',
        ),
    );
    expect(opsMutating.length).toBeGreaterThan(40);
    for (const entry of opsMutating) {
      if (hasMutatingPreviewConfirmCoverage(entry)) continue;
      expect(needsMutationPreviewDiff(entry.id, false)).toBe(true);
    }
  });

  it('buildExecutionVerificationGate previews unconfirmed create_booking', () => {
    const gate = buildExecutionVerificationGate({
      prompt: 'book massage tomorrow',
      action: 'create_booking',
      params: { serviceName: 'Massage', date: '2026-06-09' },
      enrichedParams: { serviceName: 'Massage', date: '2026-06-09' },
      confirmed: false,
    });
    expect(gate?.details?.requiresPreviewDiff ?? gate?.details?.requiresExecutionConfirmation).toBe(
      true,
    );
  });

  it('passes full read/mutate parity gate on live registry', () => {
    const status = assertReadMutateParity(registry);
    if (!status.complete) {
      console.log(formatReadMutateParityReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.missingPreviewConfirm).toBe(0);
    expect(status.missingUndoCoverage).toBe(0);
    expect(status.missingDestructiveBlast).toBe(0);
    expect(status.registryConsistencyErrors).toBe(0);
  });

  it('formats parity-2.6 read/mutate report', () => {
    const status = assertReadMutateParity(registry);
    const text = formatReadMutateParityReport(status);
    expect(text).toContain('AI Read/Mutate Parity (parity-2.6)');
    if (process.env.PARITY_26_REPORT === '1') {
      console.log(text);
    }
  });
});
