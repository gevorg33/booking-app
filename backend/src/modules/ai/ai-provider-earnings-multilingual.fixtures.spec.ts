import {
  PROVIDER_EARNINGS_EN_SCENARIO_IDS,
  PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS,
} from './ai-provider-earnings-multilingual.fixtures.js';
import { listProviderEarningsLocaleParityGaps } from './ai-provider-earnings-locale-parity.util.js';

describe('ai-provider-earnings-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every missing EN provider earnings row', () => {
    expect(listProviderEarningsLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS).toHaveLength(
      (PROVIDER_EARNINGS_EN_SCENARIO_IDS.length - 2) * 2,
    );
  });
});
