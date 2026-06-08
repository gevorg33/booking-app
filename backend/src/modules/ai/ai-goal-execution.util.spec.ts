import {
  assertGoalExecutionProbes,
  buildGoalExecutionPreviewDetails,
  decomposeGoalPrompt,
  GOAL_EXECUTION_SCENARIOS,
  isGoalExecutionPrompt,
  validateGoalStepsAgainstCapabilities,
  GOAL_EXECUTION_PROBE_BOUNDS,
} from './ai-goal-execution.util.js';

describe('ai-goal-execution (parity-3.2)', () => {
  it.each(GOAL_EXECUTION_SCENARIOS)(
    '$id — decomposes goal prompt for $surface',
    (scenario) => {
      const result = decomposeGoalPrompt(scenario.prompt, scenario.surface);
      expect(result).not.toBeNull();
      expect(result?.recipeId).toBe(scenario.recipeId);
      expect(result?.steps.length).toBeGreaterThanOrEqual(
        'minSteps' in scenario && scenario.minSteps != null
          ? scenario.minSteps
          : 2,
      );
      if ('orderedActions' in scenario && scenario.orderedActions) {
        expect(result?.steps.map((step) => step.action)).toEqual(
          scenario.orderedActions,
        );
      }
      if ('paramChecks' in scenario && scenario.paramChecks) {
        for (const check of scenario.paramChecks) {
          expect(result?.steps[check.stepIndex]?.params[check.key]).toBe(
            check.value,
          );
        }
      }
    },
  );

  it('does not treat simple compound markers as goals', () => {
    expect(
      isGoalExecutionPrompt(
        'List bookings today and cancel no-shows',
        'dashboard',
      ),
    ).toBe(false);
  });

  it('filters goal steps to capability-allowed intents for staff', () => {
    const decomposed = decomposeGoalPrompt(
      GOAL_EXECUTION_SCENARIOS[0].prompt,
      'dashboard',
    );
    expect(decomposed).not.toBeNull();
    const validation = validateGoalStepsAgainstCapabilities(
      decomposed!.steps,
      GOAL_EXECUTION_PROBE_BOUNDS.staffBusiness,
    );
    expect(validation.ok).toBe(false);
    expect(validation.outOfScope.length).toBeGreaterThan(0);
  });

  it('owner/business retains multi-step goal under capability bounds', () => {
    const raw = decomposeGoalPrompt(
      GOAL_EXECUTION_SCENARIOS[0].prompt,
      'dashboard',
    )!;
    const validation = validateGoalStepsAgainstCapabilities(
      raw.steps,
      GOAL_EXECUTION_PROBE_BOUNDS.ownerBusiness,
    );
    expect(validation.ok).toBe(true);
    expect(validation.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('buildGoalExecutionPreviewDetails marks unified preview metadata', () => {
    const result = decomposeGoalPrompt(
      GOAL_EXECUTION_SCENARIOS[0].prompt,
      'dashboard',
    )!;
    const details = buildGoalExecutionPreviewDetails(result);
    expect(details.goalExecution).toBe(true);
    expect(details.unifiedPreview).toBe(true);
    expect(details.requiresExecutionConfirmation).toBe(true);
    expect(details.permissionCheckedSteps).toEqual(
      result.steps.map((step) => step.action),
    );
  });

  it('passes goal execution probe gate', () => {
    const status = assertGoalExecutionProbes();
    expect(status.complete).toBe(true);
  });
});
