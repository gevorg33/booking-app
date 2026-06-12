import {
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from './ai-budget-discover-and-book-compound.fixtures.js';
import { BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-budget-discover-and-book-compound-multilingual.fixtures.js';
import {
  buildBudgetDiscoverAndBookCompoundParams,
  decomposeBudgetDiscoverAndBookCompoundPrompt,
  isBudgetDiscoverAndBookCompoundPrompt,
  BUDGET_DISCOVER_AND_BOOK_STEP_ACTIONS,
  rescueBudgetDiscoverAndBookCompoundIntent,
} from './ai-budget-discover-and-book-compound.util.js';

describe('ai-budget-discover-and-book-compound.util (ai-cmd-ext-4.3)', () => {
  it.each(BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'isBudgetDiscoverAndBookCompoundPrompt $id',
    ({ prompt }) => {
      expect(isBudgetDiscoverAndBookCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'decomposeBudgetDiscoverAndBookCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeBudgetDiscoverAndBookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(BUDGET_DISCOVER_AND_BOOK_STEP_ACTIONS.length);
      if (expectedParams?.maxPrice) {
        expect(steps[0].params.maxPrice).toBe(expectedParams.maxPrice);
        expect(steps[1].params.maxPrice).toBe(expectedParams.maxPrice);
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

  it.each(BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeBudgetDiscoverAndBookCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeBudgetDiscoverAndBookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS)(
    'rescueBudgetDiscoverAndBookCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueBudgetDiscoverAndBookCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'budget_discover_and_book_compound',
      });
    },
  );

  it('does not treat budget list-only as discover-and-book compound', () => {
    expect(
      isBudgetDiscoverAndBookCompoundPrompt('I need a haircut, I have $50'),
    ).toBe(false);
    expect(
      decomposeBudgetDiscoverAndBookCompoundPrompt(
        'I need a haircut, I have $50',
      ),
    ).toEqual([]);
  });

  it('does not treat check+book without budget as discover-and-book compound', () => {
    expect(
      isBudgetDiscoverAndBookCompoundPrompt(
        "check who is free tomorrow evening for lashes, book the nearest slot",
      ),
    ).toBe(false);
  });

  it('buildBudgetDiscoverAndBookCompoundParams extracts budget and providers', () => {
    const params = buildBudgetDiscoverAndBookCompoundParams(
      "Show haircut options under $50, check who's free tomorrow evening, book nearest",
    );
    expect(params.maxPrice).toBe(50);
    expect(params.allProviders).toBe(true);
    expect(params.serviceCategory).toBeTruthy();
  });

  it('rescueBudgetDiscoverAndBookCompoundIntent returns null for non-compound', () => {
    expect(
      rescueBudgetDiscoverAndBookCompoundIntent(
        'I need a haircut, I have $50',
        'list_services',
      ),
    ).toBeNull();
  });
});
