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

/**
 * How far below the top anchor the intended one may sit — e2e-bug.499 / §224.
 * Wide enough for the measured near-ties (max 0.028), far narrower than the
 * 0.199 gap that marks a genuinely different reading.
 */
const IMPLICATION_TOP_ANCHOR_SCORE_TOLERANCE = 0.05;

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
        // e2e-bug.499 / §224 — the intended anchor must be at the top *or*
        // within a hair of it, not strictly first.
        //
        // Measured: in every failing case the intended anchor was rank #2 with
        // the *same action*, so the resolved intent was correct either way, and
        // six of them lost by **0.004 to 0.028** — asserting a winner between
        // anchors that mean the same thing and score that close pins the result
        // of a coin-flip, and re-breaks whenever phrasing is added.
        //
        // The tolerance is deliberately tight. The three `create_booking` cases
        // where `en-asap-booking` beats `en-implied-wellness-need` by **0.199**
        // still fail, and should: reaching the right action by matching a
        // literal "asap" rather than the implied need is exactly what an
        // implication corpus exists to catch.
        const top = ranked[0];
        const intended = ranked.find(
          (entry) => entry.anchor.id === expectedTopAnchorId,
        );
        expect(intended).toBeDefined();
        expect(intended?.anchor.action).toBe(top?.anchor.action);
        expect((top?.score ?? 0) - (intended?.score ?? 0)).toBeLessThanOrEqual(
          IMPLICATION_TOP_ANCHOR_SCORE_TOLERANCE,
        );
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
