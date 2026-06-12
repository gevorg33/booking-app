import {
  PROVIDER_DATE_FORMAT_EN_SCENARIO_IDS,
  PROVIDER_DATE_FORMAT_LEGACY_LOCALE_SIBLING_IDS,
  PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS,
} from './ai-provider-date-format-multilingual.fixtures.js';
import { listProviderDateFormatLocaleParityGaps } from './ai-provider-date-format-locale-parity.util.js';

describe('ai-provider-date-format-multilingual.fixtures (acc-2.4)', () => {
  it('builds HY and RU siblings for every uncovered EN provider date-format row', () => {
    expect(listProviderDateFormatLocaleParityGaps()).toEqual([]);
    expect(PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS).toHaveLength(
      (PROVIDER_DATE_FORMAT_EN_SCENARIO_IDS.length -
        Object.keys(PROVIDER_DATE_FORMAT_LEGACY_LOCALE_SIBLING_IDS).length) *
        2,
    );
  });
});
