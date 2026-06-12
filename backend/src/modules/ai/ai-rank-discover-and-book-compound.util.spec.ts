import {
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from './ai-rank-discover-and-book-compound.fixtures.js';
import { RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-rank-discover-and-book-compound-multilingual.fixtures.js';
import {
  buildRankDiscoverAndBookCompoundParams,
  decomposeRankDiscoverAndBookCompoundPrompt,
  isRankDiscoverAndBookCompoundPrompt,
  RANK_DISCOVER_AND_BOOK_STEP_ACTIONS,
  rescueRankDiscoverAndBookCompoundIntent,
} from './ai-rank-discover-and-book-compound.util.js';

describe('ai-rank-discover-and-book-compound.util (ai-cmd-ext-4.4)', () => {
  it.each(RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'isRankDiscoverAndBookCompoundPrompt $id',
    ({ prompt }) => {
      expect(isRankDiscoverAndBookCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'decomposeRankDiscoverAndBookCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeRankDiscoverAndBookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(RANK_DISCOVER_AND_BOOK_STEP_ACTIONS.length);
      if (expectedParams?.serviceRank) {
        expect(steps[0].params.serviceRank).toBe(expectedParams.serviceRank);
        expect(steps[1].params.serviceRank).toBe(expectedParams.serviceRank);
      }
      if (expectedParams?.serviceCategory) {
        expect(steps[0].params.serviceCategory).toBe(
          expectedParams.serviceCategory,
        );
      }
      if (typeof expectedParams?.bookingFirstAvailable === 'boolean') {
        expect(steps[2].params.bookingFirstAvailable).toBe(
          expectedParams.bookingFirstAvailable,
        );
      }
      if (expectedParams?.timeOfDay) {
        expect(steps[1].params.timeOfDay).toBe(expectedParams.timeOfDay);
      }
    },
  );

  it.each(RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeRankDiscoverAndBookCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeRankDiscoverAndBookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS)(
    'rescueRankDiscoverAndBookCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueRankDiscoverAndBookCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'rank_discover_and_book_compound',
      });
    },
  );

  it('does not treat rank list-only as discover-and-book compound', () => {
    expect(
      isRankDiscoverAndBookCompoundPrompt("What's your luxury massage option?"),
    ).toBe(false);
    expect(
      decomposeRankDiscoverAndBookCompoundPrompt(
        "What's your luxury massage option?",
      ),
    ).toEqual([]);
  });

  it('does not treat budget-only discover as rank discover-and-book compound', () => {
    expect(
      isRankDiscoverAndBookCompoundPrompt(
        "Filter catalog for facials under $60, check who is free tomorrow, and book the soonest appointment",
      ),
    ).toBe(false);
  });

  it('does not treat check+book without rank as discover-and-book compound', () => {
    expect(
      isRankDiscoverAndBookCompoundPrompt(
        "check who is free tomorrow evening for lashes, book the nearest slot",
      ),
    ).toBe(false);
  });

  it('buildRankDiscoverAndBookCompoundParams extracts rank and providers', () => {
    const params = buildRankDiscoverAndBookCompoundParams(
      "Show premium facial options, check who's free tomorrow evening, book nearest",
    );
    expect(params.serviceRank).toBe('highest_price');
    expect(params.allProviders).toBe(true);
    expect(params.serviceCategory).toBeTruthy();
  });

  it('rescueRankDiscoverAndBookCompoundIntent returns null for non-compound', () => {
    expect(
      rescueRankDiscoverAndBookCompoundIntent(
        "What's your luxury massage option?",
        'list_services',
      ),
    ).toBeNull();
  });
});
