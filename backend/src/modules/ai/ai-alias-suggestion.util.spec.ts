import {
  aggregateAliasSuggestionsFromCorrections,
  approveAliasSuggestion,
  extractAliasCorrectionsFromRetryPair,
  filterSuggestionsAgainstExistingAliases,
  harvestAliasCorrectionsFromTraces,
} from './ai-alias-suggestion.util.js';
import { ALIAS_SUGGESTION_SCENARIOS } from './ai-alias-suggestion.fixtures.js';

describe('ai-alias-suggestion.util (acc-6.3)', () => {
  it.each(ALIAS_SUGGESTION_SCENARIOS.filter((row) => 'corrections' in row))(
    '$id alias aggregation',
    (scenario) => {
      const suggestions = aggregateAliasSuggestionsFromCorrections(
        scenario.corrections as any,
      );
      expect(suggestions.length > 0).toBe(scenario.expectSuggested);
    },
  );

  it('retry-pair harvest extracts nickname alias correction', () => {
    const retryScenario = ALIAS_SUGGESTION_SCENARIOS.find(
      (row) => row.id === 'retry-pair',
    ) as Extract<
      (typeof ALIAS_SUGGESTION_SCENARIOS)[number],
      { prior: unknown; followUp: unknown }
    >;
    const events = extractAliasCorrectionsFromRetryPair(
      retryScenario.prior,
      retryScenario.followUp,
    );
    expect(events.some((row) => row.alias === retryScenario.expectAlias)).toBe(true);
  });

  it('harvestAliasCorrectionsFromTraces pairs suspected_miss retries', () => {
    const retryScenario = ALIAS_SUGGESTION_SCENARIOS.find(
      (row) => row.id === 'retry-pair',
    ) as Extract<
      (typeof ALIAS_SUGGESTION_SCENARIOS)[number],
      { prior: unknown; followUp: unknown }
    >;
    const events = harvestAliasCorrectionsFromTraces([
      retryScenario.prior,
      retryScenario.followUp,
    ]);
    expect(events.length).toBeGreaterThan(0);
  });

  it('approveAliasSuggestion merges into aliases', () => {
    const suggestions = aggregateAliasSuggestionsFromCorrections([
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
    ]);
    const updated = approveAliasSuggestion(
      { aliases: {}, pendingAliasSuggestions: suggestions },
      suggestions[0]!.id,
    );
    expect(updated.aliases.gev?.employeeName).toBe('Gevorg');
    expect(updated.pendingAliasSuggestions).toHaveLength(0);
  });

  it('filterSuggestionsAgainstExistingAliases skips already-learned mappings', () => {
    const suggestions = aggregateAliasSuggestionsFromCorrections([
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
      { alias: 'gev', field: 'employeeName', value: 'Gevorg' },
    ]);
    const filtered = filterSuggestionsAgainstExistingAliases(suggestions, {
      gev: { employeeName: 'Gevorg' },
    });
    expect(filtered).toHaveLength(0);
  });
});
