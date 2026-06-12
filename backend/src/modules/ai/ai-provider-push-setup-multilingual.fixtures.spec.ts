import {
  PROVIDER_PUSH_SETUP_EN_SCENARIO_IDS,
  PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS,
} from './ai-provider-push-setup-multilingual.fixtures.js';
import { listProviderPushSetupLocaleParityGaps } from './ai-provider-push-setup-locale-parity.util.js';

describe('ai-provider-push-setup-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every missing EN provider push setup row', () => {
    expect(listProviderPushSetupLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS).toHaveLength(
      (PROVIDER_PUSH_SETUP_EN_SCENARIO_IDS.length - 2) * 2,
    );
  });
});
