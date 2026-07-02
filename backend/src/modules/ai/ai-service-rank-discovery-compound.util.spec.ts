import {
  SERVICE_RANK_COMPOUND_NEGATIVE_SCENARIOS,
  SERVICE_RANK_COMPOUND_SCENARIOS,
} from './ai-service-rank-discovery.fixtures.js';
import {
  buildRankCompoundSharedParams,
  decomposeServiceRankDiscoveryCompoundPrompt,
  isServiceRankDiscoveryCompoundPrompt,
} from './ai-service-rank-discovery-compound.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';

describe('ai-service-rank-discovery-compound.util (rank-1.7)', () => {
  it.each(SERVICE_RANK_COMPOUND_SCENARIOS)(
    'detects rank compound prompt $id',
    ({ prompt }) => {
      expect(isServiceRankDiscoveryCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(SERVICE_RANK_COMPOUND_NEGATIVE_SCENARIOS)(
    'does not treat non-rank compound $id as rank compound',
    ({ prompt }) => {
      expect(isServiceRankDiscoveryCompoundPrompt(prompt)).toBe(false);
    },
  );

  it('budget-only compound stays on budget path when no rank cues', () => {
    const prompt = 'Book a haircut under $50 tomorrow, nearest slot';
    expect(isServiceRankDiscoveryCompoundPrompt(prompt)).toBe(false);
    expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(true);
  });

  it('defers dashboard rank check-then-book to rank_discover_and_book recipe', () => {
    const prompt =
      "Show premium facial options, check who's free tomorrow, book nearest slot";
    expect(isServiceRankDiscoveryCompoundPrompt(prompt)).toBe(false);
    expect(
      decomposeDeterministicForSurface('dashboard', prompt)?.recipeId,
    ).toBe('rank_discover_and_book');
  });

  it.each(SERVICE_RANK_COMPOUND_SCENARIOS)(
    'decomposes public rank compound $id',
    ({
      prompt,
      serviceRank,
      serviceCategory,
      maxPrice,
      publicCompoundSteps,
    }) => {
      const steps = decomposeServiceRankDiscoveryCompoundPrompt(
        prompt,
        'public',
      );
      expect(steps.map((step) => step.action)).toEqual(publicCompoundSteps);
      expect(steps[0]?.params.serviceRank).toBe(serviceRank);
      expect(steps.at(-1)?.params.bookingFirstAvailable).toBe(true);
      if (serviceCategory) {
        expect(steps[0]?.params.serviceCategory).toBe(serviceCategory);
      }
      if (maxPrice != null) {
        expect(steps[0]?.params.maxPrice).toBe(maxPrice);
      }
    },
  );

  it.each(SERVICE_RANK_COMPOUND_SCENARIOS)(
    'decomposes customer rank compound $id',
    ({ prompt, serviceRank, customerCompoundSteps }) => {
      const steps = decomposeServiceRankDiscoveryCompoundPrompt(
        prompt,
        'customer',
      );
      expect(steps.map((step) => step.action)).toEqual(customerCompoundSteps);
      expect(steps[0]?.params.serviceRank).toBe(serviceRank);
      expect(steps.at(-1)?.params.bookingFirstAvailable).toBe(true);
    },
  );

  it('buildRankCompoundSharedParams sets rank, category, and booking hints', () => {
    const params = buildRankCompoundSharedParams(
      'Book your most premium facial tomorrow, nearest slot',
      'public',
    );
    expect(params.serviceRank).toBe('highest_price');
    expect(params.serviceCategory).toBe('facial');
    expect(params.bookingFirstAvailable).toBe(true);
    expect(params.date).toBeTruthy();
  });

  it.each(SERVICE_RANK_COMPOUND_SCENARIOS)(
    'golden deterministic decomposition public $id',
    ({ prompt, publicCompoundSteps }) => {
      const result = decomposeDeterministicForSurface('public', prompt);
      expect(result?.steps.map((step) => step.action)).toEqual(
        publicCompoundSteps,
      );
      expect(result?.recipeId).toBe('public_service_rank_discovery_compound');
      expect(result?.source).toBe('golden');
    },
  );

  it.each(SERVICE_RANK_COMPOUND_SCENARIOS)(
    'golden deterministic decomposition customer $id',
    ({ prompt, customerCompoundSteps }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.steps.map((step) => step.action)).toEqual(
        customerCompoundSteps,
      );
      expect(result?.recipeId).toBe('customer_service_rank_discovery_compound');
      expect(result?.source).toBe('golden');
    },
  );

  it('rank-list-then-book-en sets Saturday date and massage category', () => {
    const params = buildRankCompoundSharedParams(
      "What's your best massage and book it Saturday",
      'public',
    );
    expect(params.serviceRank).toBe('highest_price');
    expect(params.serviceCategory).toBe('massage');
    expect(params.date).toBeTruthy();
  });

  it('propagates shared booking params from list_services to book step', () => {
    const steps = decomposeServiceRankDiscoveryCompoundPrompt(
      'Book your most premium facial tomorrow, nearest slot',
      'public',
    );
    expect(steps).toHaveLength(2);
    expect(steps[1]?.params.serviceRank).toBe('highest_price');
    expect(steps[1]?.params.serviceCategory).toBe('facial');
    expect(steps[1]?.params.date).toBe(steps[0]?.params.date);
  });
});
