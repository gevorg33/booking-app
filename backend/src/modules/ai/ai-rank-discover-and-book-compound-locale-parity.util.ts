import {
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS,
} from './ai-rank-discover-and-book-compound.fixtures.js';
import { RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-rank-discover-and-book-compound-multilingual.fixtures.js';

export function listRankDiscoverAndBookLocaleParityGaps(): string[] {
  const gaps: string[] = [];
  const localesByEnId = new Map<string, Set<string>>();

  for (const row of RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS) {
    const set = localesByEnId.get(row.enScenarioId) ?? new Set<string>();
    set.add(row.locale);
    localesByEnId.set(row.enScenarioId, set);
  }

  for (const enScenarioId of RANK_DISCOVER_AND_BOOK_EN_SCENARIO_IDS) {
    const locales = localesByEnId.get(enScenarioId);
    if (!locales?.has('hy')) gaps.push(`${enScenarioId}:missing-hy`);
    if (!locales?.has('ru')) gaps.push(`${enScenarioId}:missing-ru`);
  }

  const enIds = new Set<string>(
    RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((row) => row.id),
  );
  for (const row of RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS) {
    if (!enIds.has(row.enScenarioId)) {
      gaps.push(`${row.id}:orphan-enScenarioId`);
    }
  }

  return gaps;
}
