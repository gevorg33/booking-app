import {
  matchHeuristicSemanticBoolean,
  matchHeuristicSemanticMetric,
  rankHeuristicSemanticPhrases,
  scoreHeuristicPhraseCoverage,
} from './ai-heuristic-semantic.util.js';
import { HEURISTIC_SEMANTIC_SCENARIOS } from './ai-heuristic-semantic.fixtures.js';
import {
  isFirstAvailableBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
  resolveBookingMetric,
  resolveCustomerMetric,
  resolveStaffMetric,
} from './ai-intent-heuristics.js';
import { SIMILAR_CHECK_AND_BOOK_PROMPTS } from './ai-check-and-book.fixtures.js';

describe('ai-heuristic-semantic.util (acc-3.14)', () => {
  it.each(HEURISTIC_SEMANTIC_SCENARIOS)(
    'scenario $id',
    ({ prompt, tag, expected }) => {
      if (typeof expected === 'boolean') {
        expect(matchHeuristicSemanticBoolean(prompt, tag as never)).toBe(
          expected,
        );
        return;
      }
      expect(matchHeuristicSemanticMetric(prompt, tag as never)).toBe(expected);
    },
  );

  it('scoreHeuristicPhraseCoverage prefers full phrase anchors in long prompts', () => {
    const score = scoreHeuristicPhraseCoverage(
      "who's free tomorrow evening for permanent lashes, book the nearest slot",
      'book the nearest slot',
    );
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('rankHeuristicSemanticPhrases orders stronger coverage first', () => {
    const ranked = rankHeuristicSemanticPhrases(
      'Calculate total earnings for last week',
      undefined,
      'booking_metric',
    );
    expect(ranked[0]?.entry.value).toBe('revenue');
  });
});

describe('ai-intent-heuristics semantic migration (acc-3.14)', () => {
  it.each([
    'book the soonest slot for massage',
    'schedule the next available appointment',
    'reserve the nearest slot',
    'get the earliest slot',
    'grab the nearest opening',
  ])('isFirstAvailableBookingPrompt: %s', (prompt) => {
    expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
  });

  it.each(SIMILAR_CHECK_AND_BOOK_PROMPTS)(
    'isFirstAvailableBookingPrompt compound: $id',
    ({ prompt }) => {
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    },
  );

  it('isTeamWideProviderAvailabilityQuery detects team-wide phrasing', () => {
    expect(
      isTeamWideProviderAvailabilityQuery(
        'who is free tomorrow evening for massage',
      ),
    ).toBe(true);
    expect(
      isTeamWideProviderAvailabilityQuery(
        'Book facemassage with Gevorg tomorrow at 10:00',
      ),
    ).toBe(false);
    expect(
      isTeamWideProviderAvailabilityQuery(
        'is Karo available tomorrow at 17:00 for lashes',
      ),
    ).toBe(false);
  });

  it('metric resolvers use semantic bank before LLM params', () => {
    expect(
      resolveBookingMetric({}, 'Calculate total earnings for last week'),
    ).toBe('revenue');
    expect(
      resolveStaffMetric({}, 'Top 5 specialists by revenue last month'),
    ).toBe('most_revenue');
    expect(
      resolveCustomerMetric({}, 'Find customers with the most no-shows'),
    ).toBe('most_no_shows');
  });
});
