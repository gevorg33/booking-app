import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  AVAILABILITY_IMPLICATION_SCENARIOS,
  BOOKING_IMPLICATION_SCENARIOS,
  IMPLICATION_CORPUS_PIPE_MARKER,
  SCHEDULE_IMPLICATION_SCENARIOS,
} from './ai-implication-corpus.fixtures.js';
import {
  assertImplicationCorpusCoverage,
  countImplicationScenariosByIntent,
  findCorpusPromptsWithEntityNames,
  listImplicationCorpusIds,
  MIN_IMPLICATION_PROMPTS_PER_INTENT,
} from './ai-implication-corpus.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';

describe('ai-implication-corpus.fixtures (pipe-1.11.1)', () => {
  it('exports pipe marker', () => {
    expect(IMPLICATION_CORPUS_PIPE_MARKER).toBe('pipe-1.11.1');
  });

  it('has unique scenario ids', () => {
    const ids = listImplicationCorpusIds(AI_IMPLICATION_CORPUS_SCENARIOS);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`has ≥${MIN_IMPLICATION_PROMPTS_PER_INTENT} prompts per top intent`, () => {
    expect(() =>
      assertImplicationCorpusCoverage(AI_IMPLICATION_CORPUS_SCENARIOS),
    ).not.toThrow();
    const counts = countImplicationScenariosByIntent(
      AI_IMPLICATION_CORPUS_SCENARIOS,
    );
    expect(counts.booking).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
    expect(counts.schedule).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
    expect(counts.availability).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
  });

  it('exports per-intent EN slices included in full corpus counts', () => {
    const counts = countImplicationScenariosByIntent(
      AI_IMPLICATION_CORPUS_SCENARIOS,
    );
    expect(counts.booking).toBeGreaterThanOrEqual(
      BOOKING_IMPLICATION_SCENARIOS.length,
    );
    expect(counts.schedule).toBeGreaterThanOrEqual(
      SCHEDULE_IMPLICATION_SCENARIOS.length,
    );
    expect(counts.availability).toBeGreaterThanOrEqual(
      AVAILABILITY_IMPLICATION_SCENARIOS.length,
    );
  });

  it('keeps prompts generic — no entity names', () => {
    expect(
      findCorpusPromptsWithEntityNames(AI_IMPLICATION_CORPUS_SCENARIOS),
    ).toEqual([]);
  });

  it.each(
    AI_IMPLICATION_CORPUS_SCENARIOS.filter(
      (scenario) =>
        scenario.expectedTopAnchorId != null && scenario.minScore != null,
    ),
  )(
    '$id resolves implication prompt to $expectedAction',
    ({
      prompt,
      surface,
      expectedAction,
      expectedTopAnchorId,
      expectedParamHints,
      mustNotMatch,
      minScore,
    }) => {
      const allowedActions = resolveSemanticAllowedActions(surface);
      const anchors = filterAnchorsForSurface(
        buildCanonicalPhrasingBank([]),
        surface,
        allowedActions,
      );
      const ranked = rankAnchorsDeterministic(prompt, anchors);
      const match = resolveSemanticMatch(ranked, {
        threshold: SEMANTIC_CONCEPT_THRESHOLD,
      });

      expect(match?.action).toBe(expectedAction);
      expect(match?.rescueReason).toBe('semantic_match');

      if (expectedTopAnchorId) {
        expect(ranked[0]?.anchor.id).toBe(expectedTopAnchorId);
      } else {
        expect(ranked[0]?.anchor.action).toBe(expectedAction);
      }
      if (minScore != null) {
        expect(ranked[0]?.score).toBeGreaterThanOrEqual(minScore);
      }
      if (expectedParamHints) {
        for (const [key, value] of Object.entries(expectedParamHints)) {
          expect(match?.paramHints[key]).toBe(value);
        }
      }
      if (mustNotMatch?.length) {
        for (const blocked of mustNotMatch) {
          const blockedRank = ranked.find(
            (entry) => entry.anchor.action === blocked,
          );
          if (blockedRank && ranked[0]) {
            expect(blockedRank.score).toBeLessThan(ranked[0].score);
          }
        }
      }
    },
  );

  it.each(
    AI_IMPLICATION_CORPUS_SCENARIOS.filter(
      (scenario) => scenario.mustNotMatch?.length,
    ),
  )(
    '$id must-not-match polarity holds for $expectedAction',
    ({ prompt, surface, expectedAction, mustNotMatch }) => {
      const allowedActions = resolveSemanticAllowedActions(surface);
      const anchors = filterAnchorsForSurface(
        buildCanonicalPhrasingBank([]),
        surface,
        allowedActions,
      );
      const match = resolveSemanticMatch(
        rankAnchorsDeterministic(prompt, anchors),
        { threshold: SEMANTIC_CONCEPT_THRESHOLD },
      );
      expect(match?.action).toBe(expectedAction);
      for (const blocked of mustNotMatch ?? []) {
        expect(match?.action).not.toBe(blocked);
      }
    },
  );
});
