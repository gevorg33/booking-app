import {
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_LIMIT_FROM_PROMPT_SCENARIOS,
  RANK_NAVIGATE_SCENARIOS,
  RANK_MID_RANGE_HANDLER_SCENARIOS,
  RANK_TIER_FILTER_HANDLER_SCENARIOS,
} from './ai-rank-list-services.fixtures.js';
import {
  buildRankEmptyCategorySummary,
  buildRankListServicesHeader,
  collectDistinctServiceCategories,
  composeDashboardListServicesRankResponse,
  composePublicListServicesMidRangeResponse,
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
  resolveRankListServicesNavigateHint,
} from './ai-rank-list-services.logic.js';
import {
  formatCatalogServicePriceLabel,
  formatPublicListServiceLine,
} from './ai-budget-list-services.logic.js';

describe('resolveListServicesRankLimitFromPrompt (rank-1.4)', () => {
  it.each(RANK_LIMIT_FROM_PROMPT_SCENARIOS)(
    'resolves limit for $id',
    ({ prompt, params, expectedLimit }) => {
      expect(resolveListServicesRankLimitFromPrompt(prompt, params ?? {})).toBe(
        expectedLimit,
      );
    },
  );
});

describe('composePublicListServicesMidRangeResponse (rank-mid-range-en)', () => {
  it.each(RANK_MID_RANGE_HANDLER_SCENARIOS)(
    'returns price-sorted mid-range services for $id',
    ({ services, serviceCategory, limit, expectedIds }) => {
      const categoryMatched = services.filter(
        (service) =>
          (service.serviceCategory ?? '').includes(serviceCategory) ||
          service.name.toLowerCase().includes(serviceCategory),
      );
      const result = composePublicListServicesMidRangeResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
        })),
        serviceCategory,
        limit,
      });
      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.summary).toContain('Mid-range color services');
      expect(result.summary).toContain('sorted by price');
    },
  );
});

describe('composePublicListServicesRankResponse tier filter (rank-tier-metadata-en)', () => {
  it.each(RANK_TIER_FILTER_HANDLER_SCENARIOS)(
    'filters premium tier services for $id',
    ({ services, serviceCategory, serviceTier, limit, expectedIds }) => {
      const categoryMatched = serviceCategory
        ? services.filter(
            (service) =>
              (service.serviceCategory ?? '').includes(serviceCategory) ||
              service.name.toLowerCase().includes(serviceCategory),
          )
        : services;

      const result = composePublicListServicesRankResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
        })),
        serviceTier,
        limit,
        serviceCategory,
        allCatalogServices: services,
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.summary).toContain('Premium tier color services:');
    },
  );
});

describe('composePublicListServicesRankResponse (rank-1.4)', () => {
  it.each(RANK_HANDLER_OUTCOME_SCENARIOS)(
    'returns ranked services for $id',
    ({
      services,
      serviceCategory,
      serviceRank,
      limit,
      maxPrice,
      expectedIds,
      expectedNavigateServiceId,
      expectSingleMatchHeader,
      expectEmptyCategoryHint,
      expectedCategorySuggestions,
    }) => {
      const categoryMatched = serviceCategory
        ? services.filter(
            (service) =>
              (service.serviceCategory ?? '').includes(serviceCategory) ||
              service.name.toLowerCase().includes(serviceCategory),
          )
        : services;

      const result = composePublicListServicesRankResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
        })),
        serviceRank,
        limit,
        maxPrice,
        serviceCategory,
        allCatalogServices: services,
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);

      if (expectEmptyCategoryHint) {
        expect(result.summary).toContain(`couldn't find "${serviceCategory}"`);
        expect(result.summary).toContain('Available categories:');
        for (const category of expectedCategorySuggestions ?? []) {
          expect(result.summary).toContain(category);
        }
        expect(result.navigate).toBeUndefined();
        return;
      }

      if (expectSingleMatchHeader) {
        expect(result.summary).toMatch(/option:/i);
      }

      if (expectedNavigateServiceId) {
        expect(result.navigate).toEqual({
          path: 'services',
          query: { serviceId: expectedNavigateServiceId },
        });
      } else if (expectedIds.length > 1) {
        expect(result.navigate).toEqual({ path: 'services', query: {} });
      }

      for (const id of expectedIds) {
        const service = services.find((entry) => entry.id === id);
        expect(result.summary).toContain(
          formatPublicListServiceLine({ ...service!, currency: 'USD' }),
        );
      }
    },
  );
});

describe('composeDashboardListServicesRankResponse (rank-1.4)', () => {
  it.each(RANK_HANDLER_OUTCOME_SCENARIOS)(
    'returns ranked dashboard services for $id',
    ({
      services,
      serviceCategory,
      serviceRank,
      limit,
      maxPrice,
      expectedIds,
    }) => {
      const categoryMatched = serviceCategory
        ? services.filter(
            (service) =>
              (service.serviceCategory ?? '').includes(serviceCategory) ||
              service.name.toLowerCase().includes(serviceCategory),
          )
        : services;

      const result = composeDashboardListServicesRankResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
          bufferMinutes: 0,
        })),
        serviceRank,
        limit,
        maxPrice,
        serviceCategory,
        allCatalogServices: services,
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.detailsServices.map((service) => service.id)).toEqual(
        expectedIds,
      );
    },
  );
});

describe('buildRankEmptyCategorySummary (rank-empty-category)', () => {
  it('collectDistinctServiceCategories returns sorted unique categories', () => {
    expect(
      collectDistinctServiceCategories([
        { serviceCategory: 'massage' },
        { serviceCategory: 'haircut' },
        { serviceCategory: 'massage' },
      ]),
    ).toEqual(['haircut', 'massage']);
  });

  it('buildRankEmptyCategorySummary suggests available categories', () => {
    const scenario = RANK_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'rank-empty-category',
    )!;
    const summary = buildRankEmptyCategorySummary(
      scenario.serviceCategory!,
      scenario.services,
    );
    expect(summary).toContain('facial');
    expect(summary).toContain('haircut');
    expect(summary).toContain('massage');
  });
});

describe('rank-missing-price copy and pick', () => {
  it('excludes null-price services from highest_price rank pick', () => {
    const scenario = RANK_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'rank-missing-price',
    )!;
    const categoryMatched = scenario.services.filter(
      (service) =>
        (service.serviceCategory ?? '').includes(scenario.serviceCategory!) ||
        service.name.toLowerCase().includes(scenario.serviceCategory!),
    );
    const response = composePublicListServicesRankResponse({
      matchedServices: categoryMatched.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      serviceCategory: scenario.serviceCategory,
      serviceRank: scenario.serviceRank,
      limit: scenario.limit,
      allCatalogServices: scenario.services,
    });
    expect(response.services.map((service) => service.id)).toEqual(
      scenario.expectedIds,
    );
    expect(formatCatalogServicePriceLabel(null)).toBe('price on request');
    expect(
      formatPublicListServiceLine({
        id: 'quote-only',
        name: 'Custom quote',
        price: null,
        durationMinutes: 60,
      }),
    ).toContain('price on request');
  });
});

describe('buildRankListServicesHeader (rank-1.4)', () => {
  it('uses singular copy for limit 1 premium picks', () => {
    expect(
      buildRankListServicesHeader({
        serviceRank: 'highest_price',
        serviceCategory: 'haircut',
        limit: 1,
      }),
    ).toBe('Our top haircut option:');
  });

  it('uses plural copy for multi-match premium lists', () => {
    expect(
      buildRankListServicesHeader({
        serviceRank: 'highest_price',
        serviceCategory: 'massage',
        limit: 5,
      }),
    ).toBe('Top premium massage options:');
  });
});

describe('resolveRankListServicesNavigateHint (rank-1.6)', () => {
  it('pre-selects a single ranked service', () => {
    expect(resolveRankListServicesNavigateHint([{ id: 'hair-85' }])).toEqual({
      path: 'services',
      query: { serviceId: 'hair-85' },
    });
  });

  it('opens services tab without pre-select for multiple ranked matches', () => {
    expect(
      resolveRankListServicesNavigateHint([
        { id: 'color-120' },
        { id: 'color-100' },
        { id: 'color-80' },
      ]),
    ).toEqual({
      path: 'services',
      query: {},
    });
  });

  it('returns undefined when rank returns no services', () => {
    expect(resolveRankListServicesNavigateHint([])).toBeUndefined();
  });
});

describe('composePublicListServicesRankResponse navigate (rank-1.6)', () => {
  it.each(RANK_NAVIGATE_SCENARIOS)(
    'sets navigate hint for $id',
    ({ services, serviceCategory, serviceRank, limit, expectedNavigate }) => {
      const categoryMatched = serviceCategory
        ? services.filter(
            (service) =>
              (service.serviceCategory ?? '').includes(serviceCategory) ||
              service.name.toLowerCase().includes(serviceCategory),
          )
        : services;

      const result = composePublicListServicesRankResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
        })),
        serviceRank,
        limit,
        serviceCategory,
      });

      expect(result.navigate).toEqual(expectedNavigate);
    },
  );
});
