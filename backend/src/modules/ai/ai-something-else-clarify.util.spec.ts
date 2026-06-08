import {
  attachSomethingElseEscapeToClarifyResult,
  buildSomethingElseEscapeAlternatives,
  isSomethingElseFollowUp,
  resolveSomethingElseClarifyFollowUpIfNeeded,
  SOMETHING_ELSE_ESCAPE_SCENARIOS,
  SOMETHING_ELSE_FOLLOWUP_PHRASES,
} from './ai-something-else-clarify.util.js';

describe('ai-something-else-clarify.util (n99-1.8)', () => {
  it.each(SOMETHING_ELSE_FOLLOWUP_PHRASES.slice(0, 4))(
    'detects something-else follow-up phrase "%s"',
    (phrase) => {
      expect(isSomethingElseFollowUp(phrase)).toBe(true);
    },
  );

  it('does not treat slot answers as something-else', () => {
    expect(isSomethingElseFollowUp('tomorrow at 10:00')).toBe(false);
  });

  it.each(SOMETHING_ELSE_ESCAPE_SCENARIOS.filter((scenario) => !scenario.expectFollowUp))(
    '$id builds $expectCount closest-command alternatives',
    ({ prompt, surface, shortlist, clarifyCandidates, excludedActions, expectCount }) => {
      const alternatives = buildSomethingElseEscapeAlternatives({
        prompt,
        surface,
        shortlist,
        clarifyCandidates,
        excludedActions,
      });
      expect(alternatives).toHaveLength(expectCount);
      expect(
        alternatives.every(
          (option) =>
            !clarifyCandidates?.some((candidate) => candidate.action === option.id),
        ),
      ).toBe(true);
    },
  );

  it('attachSomethingElseEscapeToClarifyResult adds escape metadata', () => {
    const scenario = SOMETHING_ELSE_ESCAPE_SCENARIOS[0]!;
    const enriched = attachSomethingElseEscapeToClarifyResult(
      {
        success: false,
        action: 'clarify',
        summary: 'Did you mean reschedule or cancel?',
        details: {
          needsClarification: true,
          clarify: true,
          clarifyKind: 'intent_disambiguation',
          clarifyCandidates: scenario.clarifyCandidates,
        },
      },
      {
        prompt: scenario.prompt,
        surface: scenario.surface,
        shortlist: scenario.shortlist,
      },
    );

    expect(enriched.details.showSomethingElseEscape).toBe(true);
    expect(enriched.details.somethingElseAlternatives).toHaveLength(scenario.expectCount);
  });

  it('resolveSomethingElseClarifyFollowUpIfNeeded routes none-of-these to chips', () => {
    const scenario = SOMETHING_ELSE_ESCAPE_SCENARIOS.find(
      (entry) => entry.expectFollowUp,
    )!;
    const result = resolveSomethingElseClarifyFollowUpIfNeeded({
      prompt: scenario.prompt,
      surface: scenario.surface,
      shortlist: scenario.shortlist,
      sessionContext: {
        _clarifyContext: {
          originalPrompt: 'move my thing tomorrow',
          originalAction: 'create_booking',
          partialParams: {},
          clarifyRound: 1,
          clarifyKind: 'intent_disambiguation',
        },
      },
    });

    expect(result?.details.clarifySource).toBe('something_else_escape');
    expect(result?.details.suggestedCommands?.length).toBeGreaterThanOrEqual(2);
  });
});
