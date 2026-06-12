import {
  PROVIDER_SESSION_TIMEOUT_EN_SCENARIO_IDS,
  PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-session-timeout-multilingual.fixtures.js';
import { listProviderSessionTimeoutLocaleParityGaps } from './ai-provider-session-timeout-locale-parity.util.js';

describe('ai-provider-session-timeout-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN provider session timeout row', () => {
    expect(listProviderSessionTimeoutLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_SESSION_TIMEOUT_EN_SCENARIO_IDS.length * 2,
    );
  });
});
