import { SEMANTIC_PARAPHRASE_SCENARIOS } from './ai-semantic-intent.fixtures.js';
import {
  SEMANTIC_IMPLICATION_PIPE_MARKER,
  SEMANTIC_IMPLICATION_SCENARIOS,
} from './ai-semantic-intent.implication.fixtures.js';
import {
  clearIntentAnchorBankCache,
  getIntentAnchorBank,
  MANUAL_INTENT_ANCHOR_BANK,
} from './intent-anchor.bank.js';
import {
  cosineSimilarityMaps,
  cosineSimilarityVectors,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  scoreConceptCoverage,
  scoreAnchorDeterministic,
  SEMANTIC_CONCEPT_THRESHOLD,
  toTokenFrequencyVector,
  tokenizeForSemantic,
} from './ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from './semantic-allowed-actions.util.js';
import { shouldEscalateToSemantic } from './confidence-gate.util.js';

describe('ai-semantic-intent.util', () => {
  beforeEach(() => {
    clearIntentAnchorBankCache();
  });

  it('computes token cosine similarity', () => {
    const a = toTokenFrequencyVector(['book', 'first', 'available']);
    const b = toTokenFrequencyVector(['book', 'first', 'available', 'slot']);
    expect(cosineSimilarityMaps(a, b)).toBeGreaterThan(0.8);
  });

  it('computes embedding vector cosine similarity', () => {
    expect(cosineSimilarityVectors([1, 0, 0], [1, 0, 0])).toBe(1);
    expect(cosineSimilarityVectors([1, 0, 0], [0, 1, 0])).toBe(0);
  });

  it('scores concept coverage for paraphrased booking phrasing', () => {
    const tokens = new Set(
      tokenizeForSemantic('whoever has a gap soonest for massage tomorrow'),
    );
    const anchor = MANUAL_INTENT_ANCHOR_BANK.find((a) => a.id === 'en-book-gap-soonest');
    expect(scoreConceptCoverage(tokens, anchor?.conceptGroups)).toBeGreaterThan(
      0.65,
    );
  });

  it('matches first-available paraphrase without shared literal tokens', () => {
    const prompt = 'Book massage tomorrow on whoever has a gap soonest';
    const ranked = rankAnchorsDeterministic(prompt, getIntentAnchorBank());
    const match = resolveSemanticMatch(ranked, {
      threshold: SEMANTIC_CONCEPT_THRESHOLD,
    });
    expect(match?.action).toBe('create_booking');
    expect(match?.paramHints.bookingFirstAvailable).toBe(true);
    expect(match?.rescueReason).toBe('semantic_match');
  });

  describe('implication cases (pipe-1.4.8)', () => {
    it('exports pipe marker', () => {
      expect(SEMANTIC_IMPLICATION_PIPE_MARKER).toBe('pipe-1.4.8');
    });

    it.each(SEMANTIC_IMPLICATION_SCENARIOS)(
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
          getIntentAnchorBank(),
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
        }
        if (minScore != null) {
          expect(ranked[0]?.score).toBeGreaterThanOrEqual(minScore);
        }
        if (expectedParamHints) {
          for (const [key, value] of Object.entries(expectedParamHints)) {
            expect(match?.paramHints[key]).toBe(value);
          }
        }
        for (const forbidden of mustNotMatch ?? []) {
          expect(match?.action).not.toBe(forbidden);
          expect(ranked[0]?.anchor.action).not.toBe(forbidden);
        }
      },
    );
  });

  it('rejects ambiguous top-2 intents within margin', () => {
    const ranked = [
      {
        anchor: MANUAL_INTENT_ANCHOR_BANK.find((a) => a.id === 'en-book-first-available')!,
        score: 0.7,
      },
      {
        anchor: MANUAL_INTENT_ANCHOR_BANK.find((a) => a.id === 'en-check-who-free')!,
        score: 0.68,
      },
    ];
    expect(
      resolveSemanticMatch(ranked, { threshold: 0.65, runnerUpMargin: 0.08 }),
    ).toBeNull();
  });

  it.each(SEMANTIC_PARAPHRASE_SCENARIOS.filter((s) => s.classifyAction === 'unknown'))(
    'resolves paraphrase scenario $id',
    (scenario) => {
      const match = resolveSemanticMatch(
        rankAnchorsDeterministic(scenario.prompt, getIntentAnchorBank()),
        { threshold: SEMANTIC_CONCEPT_THRESHOLD },
      );
      expect(match?.action).toBe(scenario.expectedAction);
      if (scenario.expectedParamHints) {
        for (const [key, value] of Object.entries(scenario.expectedParamHints)) {
          expect(match?.paramHints[key]).toBe(value);
        }
      }
    },
  );

  it.each(SEMANTIC_PARAPHRASE_SCENARIOS.filter((s) => s.classifyConfidence))(
    'confidence gate for scenario $id',
    (scenario) => {
      const escalate = shouldEscalateToSemantic(
        scenario.classifyAction ?? 'unknown',
        scenario.classifyConfidence,
      );
      if (scenario.id === 'en-high-confidence-skip') {
        expect(escalate).toBe(false);
        return;
      }
      if ((scenario.classifyConfidence ?? 0) < 0.65) {
        expect(escalate).toBe(true);
      }
    },
  );

  it('includes eval-seeded anchors beyond manual bank', () => {
    expect(getIntentAnchorBank().length).toBeGreaterThan(
      MANUAL_INTENT_ANCHOR_BANK.length,
    );
  });

  it('scores Russian first-available paraphrase above threshold', () => {
    const prompt = 'Запиши на ближайшее свободное время на массаж завтра';
    const ranked = rankAnchorsDeterministic(prompt, getIntentAnchorBank());
    expect(ranked[0]?.anchor.action).toBe('create_booking');
    expect(ranked[0]?.score).toBeGreaterThan(SEMANTIC_CONCEPT_THRESHOLD);
    expect(
      resolveSemanticMatch(ranked, { threshold: SEMANTIC_CONCEPT_THRESHOLD }),
    ).toMatchObject({ action: 'create_booking' });
  });

  it('tokenizes Cyrillic and Armenian prompts', () => {
    expect(tokenizeForSemantic('Запиши на ближайшее свободное время')).toEqual(
      expect.arrayContaining(['запиши', 'ближайшее', 'свободное', 'время']),
    );
    expect(tokenizeForSemantic('Ով է ազատ վաղը մասաժի համար')).toEqual(
      expect.arrayContaining(['ով', 'ազատ', 'վաղը', 'մասաժի']),
    );
  });

  it('scores anchor deterministically above threshold for nearest-slot phrasing', () => {
    const anchor = MANUAL_INTENT_ANCHOR_BANK.find((a) => a.id === 'en-book-nearest-slot')!;
    expect(
      scoreAnchorDeterministic('grab the next open slot for a haircut', anchor),
    ).toBeGreaterThan(SEMANTIC_CONCEPT_THRESHOLD);
  });
});
