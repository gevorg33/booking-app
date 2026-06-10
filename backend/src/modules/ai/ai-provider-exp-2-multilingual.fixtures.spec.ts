import {
  PROVIDER_EXP_2_EN_SCENARIO_IDS,
  PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS,
} from './ai-provider-exp-2-multilingual.fixtures.js';
import { listProviderExp2LocaleParityGaps } from './ai-provider-exp-2-locale-parity.util.js';

describe('ai-provider-exp-2-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every missing EN provider exp-2 row', () => {
    expect(listProviderExp2LocaleParityGaps()).toEqual([]);
    expect(PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS).toHaveLength(
      (PROVIDER_EXP_2_EN_SCENARIO_IDS.length - 4) * 2,
    );
  });
});
