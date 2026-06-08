import {
  assertPlanPreviewRollbackProbes,
  assessAtomicRollbackSupport,
  buildMultiStepExecutionPreviewGate,
  buildPlanStepPreviewRows,
  enrichMultiStepExecutionRollbackDetails,
  needsMultiStepPlanPreview,
  PLAN_PREVIEW_ROLLBACK_PROBES,
} from './ai-plan-preview-rollback.util.js';

describe('ai-plan-preview-rollback (parity-3.5)', () => {
  it.each(PLAN_PREVIEW_ROLLBACK_PROBES)(
    '$id — preview gate matches expectation',
    (probe) => {
      expect(needsMultiStepPlanPreview(probe.steps, probe.confirmed)).toBe(
        probe.expectsPreview,
      );
    },
  );

  it('buildMultiStepExecutionPreviewGate returns preview before confirm', () => {
    const probe = PLAN_PREVIEW_ROLLBACK_PROBES[0];
    const gate = buildMultiStepExecutionPreviewGate({
      parentAction: 'goal_execution',
      prompt: 'Set up my new stylist Anna end-to-end',
      subIntents: probe.steps,
      mergedAgentSteps: probe.steps.map((step) => ({ action: step.action })),
      confirmed: false,
      goalDetails: { goalRecipeId: 'dashboard_new_stylist_setup' },
    });

    expect(gate).not.toBeNull();
    expect(gate?.details.requiresExecutionConfirmation).toBe(true);
    expect(gate?.details.planStepPreview).toHaveLength(probe.steps.length);
    expect(gate?.details.confirmationPrompt).toBe(
      'Set up my new stylist Anna end-to-end',
    );
  });

  it('buildMultiStepExecutionPreviewGate returns null when confirmed', () => {
    const probe = PLAN_PREVIEW_ROLLBACK_PROBES.find(
      (row) => row.id === 'confirmed-skips-preview',
    )!;
    const gate = buildMultiStepExecutionPreviewGate({
      parentAction: 'compound_intent',
      prompt: 'confirmed run',
      subIntents: probe.steps,
      mergedAgentSteps: probe.steps.map((step) => ({ action: step.action })),
      confirmed: true,
    });
    expect(gate).toBeNull();
  });

  it('buildPlanStepPreviewRows labels steps for display', () => {
    const rows = buildPlanStepPreviewRows([
      {
        action: 'assign_employee_services',
        params: { employeeName: 'Anna', serviceNames: ['haircut'] },
      },
    ]);
    expect(rows[0].label).toBe('assign services');
    expect(rows[0].paramSummary).toMatch(/employeeName: Anna/);
  });

  it('enrichMultiStepExecutionRollbackDetails attaches workflow undo metadata', () => {
    const enriched = enrichMultiStepExecutionRollbackDetails(
      { taskId: 'task-99' },
      {
        taskId: 'task-99',
        mergedAgentSteps: [
          { action: 'assign_employee_services' },
          { action: 'create_direct_schedule' },
        ],
      },
    );
    expect(enriched.atomicRollback).toBe(true);
    expect(enriched.workflowLogUndo).toBe(true);
    expect(enriched.undoable).toBe(true);
    expect(enriched.taskId).toBe('task-99');
  });

  it('assessAtomicRollbackSupport blocks non-undoable agent steps', () => {
    const assessment = assessAtomicRollbackSupport([
      { action: 'assign_employee_services' },
      { action: 'apply_template' },
    ]);
    expect(assessment.supported).toBe(false);
    expect(assessment.blockedActions).toContain('apply_template');
  });

  it('passes plan preview rollback probe gate', () => {
    const status = assertPlanPreviewRollbackProbes();
    expect(status.complete).toBe(true);
  });
});
