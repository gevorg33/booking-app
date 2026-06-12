import {
  PROVIDER_EXP_3_EN_SCENARIO_IDS,
  PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS,
} from './ai-provider-exp-3-multilingual.fixtures.js';
import { listProviderExp3LocaleParityGaps } from './ai-provider-exp-3-locale-parity.util.js';

describe('ai-provider-exp-3-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN provider exp-3 row', () => {
    expect(listProviderExp3LocaleParityGaps()).toEqual([]);
    expect(PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_EXP_3_EN_SCENARIO_IDS.length * 2,
    );
  });
});
