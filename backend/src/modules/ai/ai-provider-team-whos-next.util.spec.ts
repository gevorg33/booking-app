import { SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS } from '../provider-mobile/provider-team-whos-next.fixtures.js';
import { PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-team-whos-next-multilingual.fixtures.js';
import {
  PROVIDER_TEAM_WHOS_NEXT_INTENTS,
  matchProviderTeamWhosNextScenario,
  rescueProviderTeamWhosNextIntent,
} from './ai-provider-team-whos-next.util.js';

describe('ai-provider-team-whos-next.util (prov-exp-4.3)', () => {
  it('exports team whos next intents', () => {
    expect(PROVIDER_TEAM_WHOS_NEXT_INTENTS).toContain('team_whos_next');
  });

  it.each(SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS)(
    'maps fixture prompt $id to team_whos_next',
    (scenario) => {
      expect(rescueProviderTeamWhosNextIntent(scenario.prompt, 'unknown')).toEqual({
        action: 'team_whos_next',
        rescueReason: 'team_whos_next',
      });
    },
  );

  it.each(PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS)(
    'exact-matches i18n prompt $id',
    (scenario) => {
      expect(matchProviderTeamWhosNextScenario(scenario.prompt)).toEqual({
        action: 'team_whos_next',
        rescueReason: 'team_whos_next',
      });
    },
  );

  it('does not override classified action', () => {
    expect(
      rescueProviderTeamWhosNextIntent(
        "Who's next across the team in the next 2 hours?",
        'team_whos_next',
      ),
    ).toBeNull();
  });

  it('returns null for own-schedule phrasing', () => {
    expect(
      rescueProviderTeamWhosNextIntent(
        "Who's next on my schedule today?",
        'unknown',
      ),
    ).toBeNull();
  });
});
