import {
  PROVIDER_OPEN_SHIFTS_EN_SCENARIO_IDS,
  PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS,
} from './ai-provider-open-shifts-multilingual.fixtures.js';
import { listProviderOpenShiftsLocaleParityGaps } from './ai-provider-open-shifts-locale-parity.util.js';

describe('ai-provider-open-shifts-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every EN provider open shifts row', () => {
    expect(listProviderOpenShiftsLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_OPEN_SHIFTS_EN_SCENARIO_IDS.length * 2,
    );
  });
});
