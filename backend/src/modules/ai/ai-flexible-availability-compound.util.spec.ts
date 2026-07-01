import {
  FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import {
  extractMaxPriceFromBudgetPrompt,
  shouldExtractBudgetMaxPrice,
} from './ai-budget-service-discovery.util.js';
import {
  buildFlexibleAvailabilityCompoundSharedParams,
  decomposeFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityBudgetBookCompoundPrompt,
  isFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityListBudgetThenOrCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import {
  hasAvailabilityOrPattern,
  splitAvailabilityOrClauses,
} from './ai-flexible-availability.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';

describe('ai-flexible-availability-compound.util (avail-1.8)', () => {
  it('detects list-budget-then-or compound prompt', () => {
    const fixture = FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.find(
      (row) => row.id === 'avail-list-budget-then-or-en',
    )!;
    const literal =
      'Show haircuts under $50, then check tomorrow evening or Friday afternoon';
    expect(fixture.prompt).toBe(literal);
    expect(shouldExtractBudgetMaxPrice(fixture.prompt)).toBe(true);
    expect(extractMaxPriceFromBudgetPrompt(fixture.prompt)).toBe(50);
    expect(hasAvailabilityOrPattern(fixture.prompt)).toBe(true);
    expect(/\bthen\b/i.test(fixture.prompt)).toBe(true);
    expect(/\b(?:show|list)\b/i.test(fixture.prompt)).toBe(true);
    expect(
      /\b(?:check|who'?s?\s+free|availability|slots?)\b/i.test(fixture.prompt),
    ).toBe(true);
    expect(
      isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(fixture.prompt),
    ).toBe(true);
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(fixture.prompt)).toBe(
      false,
    );
  });

  it('detects OR + inline under budget for check-then-book compound', () => {
    const prompt =
      "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest";
    expect(splitAvailabilityOrClauses(prompt)).toEqual([
      'tomorrow evening',
      'Friday afternoon',
    ]);
    expect(hasAvailabilityOrPattern(prompt)).toBe(true);
    expect(isFlexibleAvailabilityBudgetCompoundPrompt(prompt)).toBe(true);
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)).toBe(true);
  });

  it('detects OR + budget without treating as generic budget compound', () => {
    const prompt =
      'I want a haircut tomorrow evening or Friday afternoon, I have $50';
    expect(isFlexibleAvailabilityBudgetCompoundPrompt(prompt)).toBe(true);
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)).toBe(false);
    expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(false);
  });

  it.each(
    FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.filter(
      (row) => row.id !== 'avail-list-budget-then-or-en',
    ),
  )(
    'decomposeFlexibleAvailabilityBudgetCompoundPrompt $id',
    ({
      prompt,
      maxPrice,
      serviceCategory,
      publicCompoundSteps,
      expectedAvailabilityWindows,
    }) => {
      const steps = decomposeFlexibleAvailabilityBudgetCompoundPrompt(
        prompt,
        'public',
      );
      expect(steps.map((step) => step.action)).toEqual(publicCompoundSteps);
      expect(steps[0]?.params.maxPrice).toBe(maxPrice);
      expect(steps[0]?.params.serviceCategory).toBe(serviceCategory);
      expect(steps[0]?.params.availabilityWindows).toEqual(
        expectedAvailabilityWindows,
      );
      expect(steps.at(-1)?.params.bookingFirstAvailable).toBe(true);
      expect(steps.at(-1)?.params.availabilityWindows).toEqual(
        expectedAvailabilityWindows,
      );
    },
  );

  it.each(
    FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.filter(
      (row) => row.id !== 'avail-list-budget-then-or-en',
    ),
  )(
    'decomposeDeterministicForSurface public $id',
    ({ prompt, publicCompoundSteps }) => {
      const result = decomposeDeterministicForSurface('public', prompt);
      expect(result?.recipeId).toBe(
        'public_flexible_availability_budget_compound',
      );
      expect(result?.steps.map((step) => step.action)).toEqual(
        publicCompoundSteps,
      );
      expect(result?.source).toBe('golden');
    },
  );

  it('budget-or-windows-en enriches leading service + OR windows + budget', () => {
    const params = buildFlexibleAvailabilityCompoundSharedParams(
      'Haircut tomorrow evening or Friday afternoon, I have $50',
      'public',
    );
    expect(params.maxPrice).toBe(50);
    expect(params.serviceCategory).toBe('haircut');
    expect(params.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
  });

  it.each(
    FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS.filter(
      (row) => row.id === 'avail-list-budget-then-or-en',
    ),
  )(
    'decomposeFlexibleAvailabilityListBudgetThenOrCompoundPrompt $id',
    ({
      id,
      prompt,
      maxPrice,
      serviceCategory,
      publicCompoundSteps,
      expectedAvailabilityWindows,
    }) => {
      expect(isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(prompt)).toBe(
        true,
      );
      const steps = decomposeFlexibleAvailabilityBudgetCompoundPrompt(
        prompt,
        'public',
      );
      expect(steps.map((step) => step.action)).toEqual(publicCompoundSteps);
      expect(steps[0]?.params.maxPrice).toBe(maxPrice);
      expect(steps[0]?.params.serviceCategory).toBe(serviceCategory);
      expect(steps[0]?.params.availabilityWindows).toBeUndefined();
      expect(steps[1]?.params.availabilityWindows).toEqual(
        expectedAvailabilityWindows,
      );
      expect(steps[1]?.params.bookingFirstAvailable).toBeUndefined();
    },
  );

  it('avail-list-budget-then-or-en routes through deterministic decomposition', () => {
    const prompt =
      'Show haircuts under $50, then check tomorrow evening or Friday afternoon';
    const result = decomposeDeterministicForSurface('public', prompt);
    expect(result?.recipeId).toBe(
      'public_flexible_availability_list_budget_then_or_compound',
    );
    expect(result?.steps.map((step) => step.action)).toEqual([
      'list_services',
      'check_availability',
    ]);
  });

  it('buildFlexibleAvailabilityCompoundSharedParams enriches budget and OR windows', () => {
    const canonical = AVAILABILITY_WINDOW_PARSE_SCENARIOS.find(
      (entry) => entry.id === 'avail-or-tomorrow-friday-en',
    );
    expect(canonical).toBeDefined();

    const params = buildFlexibleAvailabilityCompoundSharedParams(
      'I want a haircut tomorrow evening or Friday afternoon, I have $50',
      'public',
    );
    expect(params.maxPrice).toBe(50);
    expect(params.availabilityWindows).toEqual(canonical!.expectedWindows);
    expect(params.serviceCategory).toBe('haircut');
  });
});
