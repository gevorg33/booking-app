import {
  PROVIDER_CLIENT_CONTEXT_EN_SCENARIO_IDS,
  PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-client-context-multilingual.fixtures.js';
import { listProviderClientContextLocaleParityGaps } from './ai-provider-client-context-locale-parity.util.js';

describe('ai-provider-client-context-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every missing EN provider client context row', () => {
    expect(listProviderClientContextLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS).toHaveLength(
      (PROVIDER_CLIENT_CONTEXT_EN_SCENARIO_IDS.length - 3) * 2,
    );
  });
});
