import {
  PROVIDER_TEAM_WHOS_NEXT_EN_SCENARIO_IDS,
  PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-team-whos-next-multilingual.fixtures.js';
import { listProviderTeamWhosNextLocaleParityGaps } from './ai-provider-team-whos-next-locale-parity.util.js';

describe('ai-provider-team-whos-next-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN team whos next row', () => {
    expect(listProviderTeamWhosNextLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_TEAM_WHOS_NEXT_EN_SCENARIO_IDS.length * 2,
    );
  });
});
