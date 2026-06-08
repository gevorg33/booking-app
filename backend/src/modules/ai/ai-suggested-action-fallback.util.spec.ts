import {
  buildSuggestedActionFallbackClarifyResult,
  buildSuggestionFromAction,
  pickSuggestedActionFallback,
  scoreSuggestionForPrompt,
  shouldOfferSuggestedActionFallback,
} from './ai-suggested-action-fallback.util.js';
import {
  IMMEDIATE_FALLBACK_SCENARIOS,
  SUGGESTED_ACTION_FALLBACK_SCENARIOS,
} from './ai-suggested-action-fallback.fixtures.js';

describe('ai-suggested-action-fallback.util (acc-6.6)', () => {
  it.each(SUGGESTED_ACTION_FALLBACK_SCENARIOS)('$id picks fallback chips', (scenario) => {
    const suggestions = pickSuggestedActionFallback({
      surface: scenario.surface,
      prompt: scenario.prompt,
      shortlist: scenario.shortlist,
      semanticCandidates: scenario.semanticCandidates,
    });
    expect(suggestions).toHaveLength(scenario.expectCount);
    if (scenario.expectFirstId) {
      expect(suggestions[0]?.id).toBe(scenario.expectFirstId);
    }
  });

  it('scoreSuggestionForPrompt prefers booking keywords', () => {
    const book = buildSuggestionFromAction('create_booking');
    const list = buildSuggestionFromAction('list_bookings');
    expect(
      scoreSuggestionForPrompt('book massage tomorrow', book),
    ).toBeGreaterThan(scoreSuggestionForPrompt('book massage tomorrow', list));
  });

  it.each(IMMEDIATE_FALLBACK_SCENARIOS)(
    '$id immediate fallback eligibility',
    (scenario) => {
      expect(
        shouldOfferSuggestedActionFallback(
          {
            prompt: 'huh?',
            surface: scenario.surface,
            action: scenario.action,
            params: scenario.params ?? {},
            confidence: scenario.confidence,
          },
          'early',
        ),
      ).toBe(scenario.expectFallback);
    },
  );

  it('buildSuggestedActionFallbackClarifyResult exposes suggestedCommands', () => {
    const result = buildSuggestedActionFallbackClarifyResult(
      {
        prompt: 'book maybe',
        surface: 'public',
        action: 'unknown',
        params: {},
        confidence: 0.2,
      },
      'early',
    );
    expect(result?.details.suggestedCommands?.length).toBeGreaterThanOrEqual(2);
    expect(result?.details.clarifyKind).toBe('suggested_action_fallback');
  });
});
