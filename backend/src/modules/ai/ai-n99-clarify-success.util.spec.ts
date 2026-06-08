import {
  assertClarifyFollowupEvalFloor,
  buildClarifyNear99ExitGate,
  buildClarifySomethingElseAlternatives,
  computeClarifyQualityByIntentAndLocale,
  evaluateClarifyFollowUpPipeline,
  normalizeClarifyFollowUpAnswer,
  N99_CLARIFY_FOLLOWUP_SCENARIOS,
  N99_CLARIFY_NEAR_99_GATE_SCENARIOS,
  validateInlineClarifyFollowUp,
} from './ai-n99-clarify-success.util.js';
import { CLARIFY_QUALITY_TRACE_FIXTURES } from './ai-clarify-quality.fixtures.js';

describe('ai-n99-clarify-success.util (n99-1)', () => {
  it.each(N99_CLARIFY_NEAR_99_GATE_SCENARIOS)(
    '$id near-99 gate met=$expectMet',
    ({ input, expectMet }) => {
      expect(buildClarifyNear99ExitGate(input).met).toBe(expectMet);
    },
  );

  it('computes per-intent and per-locale clarify success segments', () => {
    const segments = computeClarifyQualityByIntentAndLocale(
      CLARIFY_QUALITY_TRACE_FIXTURES.successOnNextTurn,
      Date.parse('2026-06-07T10:05:00Z'),
    );
    expect(segments.byIntent.create_booking?.successRate).toBe(1);
    expect(segments.byLocale.en?.successRate).toBe(1);
  });

  it.each(
    N99_CLARIFY_FOLLOWUP_SCENARIOS.filter((scenario) => scenario.followUpPrompt),
  )('$id follow-up pipeline', (scenario) => {
    const result = evaluateClarifyFollowUpPipeline({
      originalPrompt: scenario.originalPrompt,
      followUpPrompt: scenario.followUpPrompt!,
      originalAction: scenario.originalAction ?? 'create_booking',
      partialParams: scenario.partialParams,
      field: 'field' in scenario ? scenario.field : undefined,
    });

    if ('expectMergedPrompt' in scenario && scenario.expectMergedPrompt) {
      expect(result.mergedPrompt).toBe(scenario.expectMergedPrompt);
    }
    if ('expectNormalizedFollowUp' in scenario && scenario.expectNormalizedFollowUp) {
      expect(result.normalizedFollowUp).toBe(scenario.expectNormalizedFollowUp);
    }
    if ('expectRestoredAction' in scenario && scenario.expectRestoredAction) {
      expect(result.restoredAction).toBe(scenario.expectRestoredAction);
    }
    if ('expectInlineValid' in scenario) {
      expect(result.inlineValidation.valid).toBe(scenario.expectInlineValid);
    }
    if ('expectInlineHint' in scenario && scenario.expectInlineHint) {
      expect(result.inlineValidation.hint).toBe(scenario.expectInlineHint);
    }
    if ('expectExecuteImmediately' in scenario) {
      expect(result.executeImmediately).toBe(scenario.expectExecuteImmediately);
    }
  });

  it('normalizes voice/typo clarify answers', () => {
    expect(normalizeClarifyFollowUpAnswer('tomrw at 2pm')).toBe('tomorrow at 14:00');
  });

  it('builds something-else alternatives from shortlist', () => {
    const scenario = N99_CLARIFY_FOLLOWUP_SCENARIOS.find(
      (entry) => entry.id === 'en-something-else',
    )!;
    const options = buildClarifySomethingElseAlternatives({
      prompt: scenario.originalPrompt,
      surface: scenario.surface,
      shortlist: scenario.shortlist,
      excludedActions: scenario.excludedActions,
      limit: scenario.expectSomethingElseCount,
    });
    expect(options).toHaveLength(scenario.expectSomethingElseCount!);
    expect(options.every((option) => !scenario.excludedActions?.includes(option.action))).toBe(
      true,
    );
  });

  it('validates inline clarify answers before re-run', () => {
    expect(validateInlineClarifyFollowUp({ field: 'date', answer: 'tomorrow' }).valid).toBe(
      true,
    );
    expect(validateInlineClarifyFollowUp({ field: 'date', answer: 'maybe sometime' }).valid).toBe(
      false,
    );
  });

  it('assertClarifyFollowupEvalFloor enforces n99-1.9 CI floor', () => {
    expect(() => assertClarifyFollowupEvalFloor(19, 20, 0.95)).not.toThrow();
    expect(() => assertClarifyFollowupEvalFloor(18, 20, 0.95)).toThrow(/below floor/i);
  });
});
