import { AVAILABILITY_DISAMBIGUATION_SCENARIOS } from './ai-intent-disambiguation.fixtures.js';
import { MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS } from './ai-check-and-book-multilingual.fixtures.js';
import {
  TEAM_WIDE_AVAILABILITY_NEGATIVE_PROMPTS,
  TEAM_WIDE_AVAILABILITY_POSITIVE_PROMPTS,
  TEAM_WIDE_AVAILABILITY_SEMANTIC_PIPE_MARKER,
} from './team-wide-availability.semantic.fixtures.js';
import {
  impliesTeamWideAvailabilityFromSemantic,
  promptImpliesNamedProviderAvailability,
  resolveTeamWideAvailabilitySemanticHints,
} from './team-wide-availability.semantic.util.js';
import { isTeamWideProviderAvailabilityQuery } from './team-wide-availability.semantic.util.js';

describe('team-wide-availability semantic util (pipe-1.13.2 / acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(TEAM_WIDE_AVAILABILITY_SEMANTIC_PIPE_MARKER).toBe('pipe-1.13.2');
  });

  it.each(TEAM_WIDE_AVAILABILITY_POSITIVE_PROMPTS)(
    '$id detects team-wide availability on semantic anchors',
    ({ prompt, surface }) => {
      const hints = resolveTeamWideAvailabilitySemanticHints(
        prompt,
        surface ?? 'dashboard',
      );
      expect(hints?.allProviders).toBe(true);
      expect(impliesTeamWideAvailabilityFromSemantic(prompt)).toBe(true);
      expect(isTeamWideProviderAvailabilityQuery(prompt)).toBe(true);
    },
  );

  it.each(TEAM_WIDE_AVAILABILITY_NEGATIVE_PROMPTS)(
    '$id does not detect team-wide availability',
    ({ prompt, surface }) => {
      expect(
        resolveTeamWideAvailabilitySemanticHints(
          prompt,
          surface ?? 'dashboard',
        ),
      ).toBeNull();
      expect(impliesTeamWideAvailabilityFromSemantic(prompt)).toBe(false);
      expect(isTeamWideProviderAvailabilityQuery(prompt)).toBe(false);
    },
  );

  it.each(
    AVAILABILITY_DISAMBIGUATION_SCENARIOS.filter((scenario) =>
      [
        'dashboard-team-check-providers',
        'dashboard-create-to-check-providers',
        'dashboard-lookup-to-check-providers',
        'customer-team-check-providers',
        'public-team-check-availability',
      ].includes(scenario.id),
    ),
  )('disambiguation team-wide prompt $id', ({ prompt }) => {
    expect(isTeamWideProviderAvailabilityQuery(prompt)).toBe(true);
  });

  it.each(MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS)(
    'multilingual check+book prompt $id implies team-wide availability',
    ({ prompt }) => {
      expect(impliesTeamWideAvailabilityFromSemantic(prompt)).toBe(true);
      expect(isTeamWideProviderAvailabilityQuery(prompt)).toBe(true);
    },
  );
});
