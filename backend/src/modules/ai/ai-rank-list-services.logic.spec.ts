import {
  RANK_HANDLER_OUTCOME_SCENARIOS,
  RANK_LIMIT_FROM_PROMPT_SCENARIOS,
  RANK_NAVIGATE_SCENARIOS,
} from './ai-rank-list-services.fixtures.js';
import {
  buildRankListServicesHeader,
  composeDashboardListServicesRankResponse,
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
  resolveRankListServicesNavigateHint,
} from './ai-rank-list-services.logic.js';
import { formatPublicListServiceLine } from './ai-budget-list-services.logic.js';

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
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);

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
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.detailsServices.map((service) => service.id)).toEqual(
        expectedIds,
      );
    },
  );
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
