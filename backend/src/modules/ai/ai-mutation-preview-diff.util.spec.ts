import {
  buildMutationPreviewDiffGateResult,
  buildMutationPreviewDiffResult,
  buildMutationPreviewDiffSteps,
  needsMutationPreviewDiff,
} from './ai-mutation-preview-diff.util.js';
import { MUTATION_PREVIEW_SCENARIOS } from './ai-mutation-preview-diff.fixtures.js';
import { buildExecutionVerificationGate } from './ai-execution-verification.util.js';

describe('ai-mutation-preview-diff.util (acc-5.3)', () => {
  it.each(MUTATION_PREVIEW_SCENARIOS)('$id needsMutationPreviewDiff', (scenario) => {
    expect(needsMutationPreviewDiff(scenario.action, scenario.confirmed)).toBe(
      scenario.expectPreview,
    );
  });

  it.each(
    MUTATION_PREVIEW_SCENARIOS.filter((scenario) => scenario.expectPreview),
  )('$id buildMutationPreviewDiffSteps', (scenario) => {
    const steps = buildMutationPreviewDiffSteps(scenario.action, scenario.params);
    expect(steps.length).toBeGreaterThan(0);
    if (scenario.expectStepAction) {
      expect(steps[0]?.action).toBe(scenario.expectStepAction);
    }
    if (scenario.expectDescriptionIncludes) {
      for (const fragment of scenario.expectDescriptionIncludes) {
        expect(steps[0]?.description.toLowerCase()).toContain(fragment.toLowerCase());
      }
    }
    if (scenario.expectImpactIncludes) {
      expect(steps[0]?.impact.toLowerCase()).toContain(
        scenario.expectImpactIncludes.toLowerCase(),
      );
    }
  });

  it('buildMutationPreviewDiffResult includes planDiff for command bar', () => {
    const scenario = MUTATION_PREVIEW_SCENARIOS[0]!;
    const result = buildMutationPreviewDiffResult({
      prompt: scenario.prompt,
      action: scenario.action,
      params: scenario.params,
    });
    expect(result.details.requiresPreviewDiff).toBe(true);
    expect(result.details.requiresExecutionConfirmation).toBe(true);
    expect(result.details.clarifySource).toBe('mutation_preview_diff');
    expect(Array.isArray(result.details.planDiff)).toBe(true);
    expect(result.details.planDiff?.length).toBeGreaterThan(0);
  });

  it('buildMutationPreviewDiffGateResult returns null when confirmed', () => {
    const scenario = MUTATION_PREVIEW_SCENARIOS[0]!;
    expect(
      buildMutationPreviewDiffGateResult({
        prompt: scenario.prompt,
        action: scenario.action,
        params: scenario.params,
        confirmed: true,
      }),
    ).toBeNull();
  });

  it('buildExecutionVerificationGate returns mutation preview diff for create_booking', () => {
    const scenario = MUTATION_PREVIEW_SCENARIOS[0]!;
    const gate = buildExecutionVerificationGate({
      prompt: scenario.prompt,
      action: scenario.action,
      params: scenario.params,
      enrichedParams: scenario.params,
      confirmed: false,
    });
    expect(gate?.details.clarifySource).toBe('mutation_preview_diff');
    expect(gate?.details.planDiff?.length).toBeGreaterThan(0);
  });
});
