import {
  SEMANTIC_STEAL_GUARD_SCENARIOS,
  SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN,
} from './semantic-steal-guard.fixtures.js';
import {
  assertSemanticDoesNotSteal,
  checkSemanticStealGuard,
  isSemanticStealProtectedPrompt,
  SEMANTIC_STEAL_GUARD_PIPE_MARKER,
} from './semantic-steal-guard.util.js';

describe('semantic-steal-guard.util (pipe-1.5.3 / acc-2.8)', () => {
  it('exports pipe marker', () => {
    expect(SEMANTIC_STEAL_GUARD_PIPE_MARKER).toBe('pipe-1.5.3');
  });

  it.each(SEMANTIC_STEAL_GUARD_SCENARIOS)(
    '$id is domain-protected from semantic steal',
    (scenario) => {
      expect(isSemanticStealProtectedPrompt(scenario.prompt)).toBe(true);
      const check = checkSemanticStealGuard(scenario.prompt, scenario.surface);
      expect(check.stolen).toBe(false);
      expect(check.protected).toBe(true);
      expect(() =>
        assertSemanticDoesNotSteal(scenario.prompt, scenario.surface),
      ).not.toThrow();
    },
  );

  it.each([
    ['tour_calendar', SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.tour_calendar],
    ['provider_stats', SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.provider_stats],
    ['recommendation', SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.recommendation],
  ] as const)(
    '%s corpus has no semantic steal into core booking/schedule intents',
    (_domain, scenarios) => {
      for (const scenario of scenarios) {
        const check = checkSemanticStealGuard(
          scenario.prompt,
          scenario.surface,
        );
        expect(check.stolen).toBe(false);
      }
    },
  );

  it('does not mark generic booking paraphrases as protected', () => {
    expect(
      isSemanticStealProtectedPrompt(
        'My hair is getting pretty long, need a trim soon',
      ),
    ).toBe(false);
  });
});
