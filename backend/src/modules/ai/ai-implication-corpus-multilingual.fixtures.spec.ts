import {
  IMPLICATION_CORPUS_LOCALE_PIPE_MARKER,
  IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS,
  IMPLICATION_EN_SCENARIO_IDS,
  IMPLICATION_LEGACY_LOCALE_SIBLING_IDS,
} from './ai-implication-corpus-multilingual.fixtures.js';
import { listImplicationCorpusLocaleParityGaps } from './ai-implication-corpus-locale-parity.util.js';

describe('ai-implication-corpus-multilingual.fixtures (pipe-1.11.5)', () => {
  it('exports pipe marker', () => {
    expect(IMPLICATION_CORPUS_LOCALE_PIPE_MARKER).toBe('pipe-1.11.5');
  });

  it('builds HY and RU siblings for every EN implication scenario id', () => {
    expect(listImplicationCorpusLocaleParityGaps()).toEqual([]);
    expect(IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS).toHaveLength(
      (IMPLICATION_EN_SCENARIO_IDS.length -
        Object.keys(IMPLICATION_LEGACY_LOCALE_SIBLING_IDS).length) *
        2,
    );
  });

  it('keeps multilingual scenario ids unique', () => {
    const ids = IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(IMPLICATION_CORPUS_MULTILINGUAL_SCENARIOS)(
    'tags locale on $id',
    (scenario) => {
      expect(scenario.locale === 'hy' || scenario.locale === 'ru').toBe(true);
      expect(scenario.id.startsWith(`${scenario.locale}-`)).toBe(true);
    },
  );
});
