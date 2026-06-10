import {
  FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import {
  buildFlexibleAvailabilityCompoundSharedParams,
  decomposeFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityBudgetBookCompoundPrompt,
  isFlexibleAvailabilityBudgetCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';

describe('ai-flexible-availability-compound.util (avail-1.8)', () => {
  it('detects OR + budget without treating as generic budget compound', () => {
    const prompt =
      'I want a haircut tomorrow evening or Friday afternoon, I have $50';
    expect(isFlexibleAvailabilityBudgetCompoundPrompt(prompt)).toBe(true);
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt)).toBe(false);
    expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(false);
  });

  it.each(FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS)(
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

  it.each(FLEXIBLE_AVAILABILITY_COMPOUND_SCENARIOS)(
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
    expect(params.availabilityWindows).toEqual(
      canonical!.expectedWindows,
    );
    expect(params.serviceCategory).toBe('haircut');
  });
});
