import {
  buildHonestFailureClarifyResult,
  hasExhaustedClarifyBudget,
  isStillUncertainAfterClarify,
  pickHonestFailureSuggestions,
  shouldOfferHonestFailure,
} from './ai-honest-failure-clarify.util.js';
import { HONEST_FAILURE_SCENARIOS } from './ai-honest-failure-clarify.fixtures.js';
import {
  buildHonestFailureClarify,
  resolveSmartClarify,
} from './ai-smart-clarify.util.js';

describe('ai-honest-failure-clarify.util (acc-4.7)', () => {
  it.each(HONEST_FAILURE_SCENARIOS)('$id honest failure', (scenario) => {
    const input = {
      prompt: 'unclear prompt',
      surface: scenario.surface,
      action: scenario.action,
      params: scenario.params,
      sessionContext: scenario.sessionContext,
      confidence: scenario.confidence,
      actionThreshold: scenario.actionThreshold,
    };

    const result = buildHonestFailureClarifyResult(input);

    if (!scenario.expectHonestFailure) {
      expect(result).toBeNull();
      expect(shouldOfferHonestFailure(input)).toBe(false);
      return;
    }

    expect(result).not.toBeNull();
    expect(result?.details.clarifyKind).toBe('honest_failure');
    expect(result?.details.suggestedCommands?.length).toBe(
      scenario.expectSuggestionCount ?? 3,
    );
    expect(result?.success).toBe(false);
    expect(result?.action).toBe('clarify');

    if (scenario.expectSummaryIncludes) {
      const summary = result!.summary.toLowerCase();
      for (const fragment of scenario.expectSummaryIncludes) {
        expect(summary).toContain(fragment.toLowerCase());
      }
    }
  });

  it('pickHonestFailureSuggestions returns 2–3 surface-specific commands', () => {
    for (const surface of ['dashboard', 'customer', 'provider', 'public'] as const) {
      const suggestions = pickHonestFailureSuggestions(surface);
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      expect(suggestions.every((row) => row.prompt && row.label)).toBe(true);
    }
  });

  it('isStillUncertainAfterClarify respects semantic and classification flags', () => {
    expect(
      isStillUncertainAfterClarify({
        prompt: 'x',
        surface: 'dashboard',
        action: 'list_bookings',
        params: { _semanticClarify: true },
        confidence: 0.9,
      }),
    ).toBe(true);
  });

  it('hasExhaustedClarifyBudget requires one completed clarify round', () => {
    expect(hasExhaustedClarifyBudget(undefined)).toBe(false);
    expect(
      hasExhaustedClarifyBudget({
        _clarifyContext: {
          originalPrompt: 'x',
          originalAction: 'create_booking',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      }),
    ).toBe(true);
  });

  it('buildHonestFailureClarify attaches smart clarify metadata', () => {
    const clarify = buildHonestFailureClarify({
      prompt: 'hmm maybe something',
      surface: 'customer',
      action: 'unknown',
      params: { _semanticClarify: true },
      confidence: 0.48,
      sessionContext: {
        _clarifyContext: {
          originalPrompt: 'hmm maybe something',
          originalAction: 'unknown',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'intent_disambiguation',
        },
      },
    });
    expect(clarify?.details.clarifyKind).toBe('honest_failure');
    expect(clarify?.details.suggestedCommands?.length).toBeGreaterThanOrEqual(2);
  });

  it('resolveSmartClarify late phase prefers honest failure over slot fill', () => {
    const clarify = resolveSmartClarify({
      prompt: 'cancel stuff maybe',
      surface: 'dashboard',
      action: 'cancel_bookings',
      params: { _classificationNeedsClarify: true },
      confidence: 0.42,
      sessionContext: {
        _clarifyContext: {
          originalPrompt: 'cancel stuff maybe',
          originalAction: 'cancel_bookings',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'targeted_slots',
        },
      },
      phase: 'late',
    });
    expect(clarify?.details.clarifyKind).toBe('honest_failure');
  });

  it('resolveSmartClarify early phase does not skip first clarify turn', () => {
    const clarify = resolveSmartClarify({
      prompt: 'hmm maybe something',
      surface: 'customer',
      action: 'unknown',
      params: { _semanticClarify: true },
      confidence: 0.48,
      phase: 'early',
    });
    expect(clarify?.details.clarifyKind).not.toBe('honest_failure');
  });
});
