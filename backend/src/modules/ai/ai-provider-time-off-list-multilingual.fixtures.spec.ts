import {
  PROVIDER_TIME_OFF_LIST_EN_SCENARIO_IDS,
  PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS,
} from './ai-provider-time-off-list-multilingual.fixtures.js';
import { listProviderTimeOffListLocaleParityGaps } from './ai-provider-time-off-list-locale-parity.util.js';

describe('ai-provider-time-off-list-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN provider time-off list row', () => {
    expect(listProviderTimeOffListLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_TIME_OFF_LIST_EN_SCENARIO_IDS.length * 2,
    );
  });
});
