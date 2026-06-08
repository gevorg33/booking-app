import { PROMPT_NORMALIZATION_SCENARIOS } from './ai-prompt-normalization.fixtures.js';
import {
  applySpellCorrections,
  buildNormalizationClassifierContext,
  normalizePromptForClassifier,
  normalizeSpokenTimes,
  splitMixedScriptBoundaries,
} from './ai-prompt-normalization.util.js';

describe('ai-prompt-normalization.util (acc-3.7)', () => {
  it.each(PROMPT_NORMALIZATION_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'normalization scenario %s',
    (_id, scenario) => {
      const { normalized, expansions } = normalizePromptForClassifier(scenario.input);
      for (const token of scenario.expectContains) {
        expect(normalized.toLowerCase()).toContain(token.toLowerCase());
      }
      for (const token of scenario.expectNotContains ?? []) {
        expect(normalized.toLowerCase()).not.toContain(token.toLowerCase());
      }
      if (scenario.expectExpansionIncludes) {
        expect(
          expansions.some((entry) =>
            entry.includes(scenario.expectExpansionIncludes!),
          ),
        ).toBe(true);
      }
    },
  );

  it('splitMixedScriptBoundaries splits Latin and Armenian tokens', () => {
    const result = splitMixedScriptBoundaries('book facemassageՄարիա tomorrow');
    expect(result.adjusted).toBe(true);
    expect(result.text).toBe('book facemassage Մարիա tomorrow');
  });

  it('applySpellCorrections fixes common booking typos', () => {
    const expansions: string[] = [];
    const corrected = applySpellCorrections('Book masage tomorow', expansions);
    expect(corrected).toBe('Book massage tomorrow');
    expect(expansions.some((entry) => entry.startsWith('spell:'))).toBe(true);
  });

  it('normalizeSpokenTimes converts two pm to 14:00', () => {
    const expansions: string[] = [];
    const normalized = normalizeSpokenTimes('Book massage two pm tomorrow', expansions);
    expect(normalized).toContain('14:00');
    expect(expansions.length).toBeGreaterThan(0);
  });

  it('buildNormalizationClassifierContext returns null when no expansions', () => {
    expect(buildNormalizationClassifierContext([])).toBeNull();
    expect(buildNormalizationClassifierContext(['abbrev: asap'])).toContain('acc-3.7');
  });
});
