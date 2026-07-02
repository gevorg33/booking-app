import {
  APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS,
  FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS,
  PICK_RANKED_SERVICES_SCENARIOS,
  RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS,
  SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS,
  SORT_SERVICES_BY_PRICE_ASC_SCENARIOS,
  SORT_SERVICES_BY_PRICE_DESC_SCENARIOS,
} from './ai-service-catalog-rank.fixtures.js';
import { enrichAvailabilityWindowsFromPrompt } from './ai-flexible-availability.util.js';
import {
  enrichDiscoveryParamsFromPrompt,
  enrichServiceDiscoveryFromPrompt,
} from './ai-service-discovery-enrichment.util.js';
import {
  applyServiceDiscoveryToCatalog,
  filterServicesByMaxPrice,
  isValidMaxPrice,
  isValidServiceRank,
  pickRankedServices,
  resolveServiceCatalogPrice,
  resolveServiceDiscoveryLimit,
  resolveServiceDiscoveryParams,
  sortServicesByPopularityDesc,
  sortServicesByPriceAsc,
  sortServicesByPriceDesc,
} from './ai-service-catalog-rank.util.js';

describe('ai-service-catalog-rank.util (budget-1.1)', () => {
  describe('resolveServiceCatalogPrice', () => {
    it('returns null for missing or non-finite prices', () => {
      expect(resolveServiceCatalogPrice(null)).toBeNull();
      expect(resolveServiceCatalogPrice(undefined)).toBeNull();
      expect(resolveServiceCatalogPrice(Number.NaN)).toBeNull();
    });

    it('coerces decimal strings from ORM reads', () => {
      expect(resolveServiceCatalogPrice('49.99' as unknown as number)).toBe(
        49.99,
      );
    });
  });

  describe('isValidMaxPrice', () => {
    it('accepts zero and positive finite numbers only', () => {
      expect(isValidMaxPrice(0)).toBe(true);
      expect(isValidMaxPrice(50)).toBe(true);
      expect(isValidMaxPrice(-1)).toBe(false);
      expect(isValidMaxPrice(Number.NaN)).toBe(false);
      expect(isValidMaxPrice(undefined)).toBe(false);
    });
  });

  it.each(FILTER_SERVICES_BY_MAX_PRICE_SCENARIOS)(
    'filterServicesByMaxPrice $id',
    ({ services, maxPrice, expectedIds }) => {
      const filtered = filterServicesByMaxPrice(services, maxPrice);
      expect(filtered.map((service) => service.id)).toEqual(expectedIds);
    },
  );

  it('returns a copy when maxPrice is invalid (no budget constraint)', () => {
    const services = [{ id: 'a', name: 'A', price: 100 }];
    const filtered = filterServicesByMaxPrice(services, Number.NaN);
    expect(filtered).toEqual(services);
    expect(filtered).not.toBe(services);
  });

  it.each(SORT_SERVICES_BY_PRICE_ASC_SCENARIOS)(
    'sortServicesByPriceAsc $id',
    ({ services, expectedIds }) => {
      const sorted = sortServicesByPriceAsc(services);
      expect(sorted.map((service) => service.id)).toEqual(expectedIds);
    },
  );

  it('does not mutate the input array when sorting', () => {
    const services = [
      { id: 'b', name: 'B', price: 50 },
      { id: 'a', name: 'A', price: 25 },
    ];
    const snapshot = [...services];
    sortServicesByPriceAsc(services);
    expect(services).toEqual(snapshot);
  });

  it('chains filter then sort for budget listing order', () => {
    const services = [
      { id: 'hair-45', name: 'Haircut standard', price: 45 },
      { id: 'hair-55', name: 'Haircut premium', price: 55 },
      { id: 'hair-35', name: 'Haircut basic', price: 35 },
    ];

    const result = sortServicesByPriceAsc(
      filterServicesByMaxPrice(services, 50),
    );

    expect(result.map((service) => service.id)).toEqual(['hair-35', 'hair-45']);
  });
});

describe('ai-service-catalog-rank.util (rank-1.1)', () => {
  describe('isValidServiceRank', () => {
    it('accepts known rank tokens only', () => {
      expect(isValidServiceRank('highest_price')).toBe(true);
      expect(isValidServiceRank('lowest_price')).toBe(true);
      expect(isValidServiceRank('most_popular')).toBe(true);
      expect(isValidServiceRank('premium')).toBe(false);
      expect(isValidServiceRank(null)).toBe(false);
    });
  });

  it.each(SORT_SERVICES_BY_PRICE_DESC_SCENARIOS)(
    'sortServicesByPriceDesc $id',
    ({ services, expectedIds }) => {
      expect(
        sortServicesByPriceDesc(services).map((service) => service.id),
      ).toEqual(expectedIds);
    },
  );

  it('sortServicesByPopularityDesc breaks ties by duration then name', () => {
    const sorted = sortServicesByPopularityDesc([
      { id: 'b', name: 'B', price: 50, bookingCount: 10, durationMinutes: 30 },
      { id: 'a', name: 'A', price: 50, bookingCount: 10, durationMinutes: 60 },
    ]);
    expect(sorted.map((service) => service.id)).toEqual(['a', 'b']);
  });

  it.each(PICK_RANKED_SERVICES_SCENARIOS)(
    'pickRankedServices $id',
    ({ catalog, options, expectedIds }) => {
      expect(
        pickRankedServices(catalog, options).map((service) => service.id),
      ).toEqual(expectedIds);
    },
  );

  it('does not mutate catalog input when picking ranked services', () => {
    const catalog = [
      { id: 'b', name: 'B', price: 50 },
      { id: 'a', name: 'A', price: 25 },
    ];
    const snapshot = [...catalog];
    pickRankedServices(catalog, { serviceRank: 'highest_price', limit: 1 });
    expect(catalog).toEqual(snapshot);
  });
});

describe('ai-service-catalog-rank.util (discover-1.1)', () => {
  describe('resolveServiceDiscoveryLimit', () => {
    it('accepts positive integers from number or numeric string', () => {
      expect(resolveServiceDiscoveryLimit(3)).toBe(3);
      expect(resolveServiceDiscoveryLimit('2')).toBe(2);
      expect(resolveServiceDiscoveryLimit(0)).toBeNull();
      expect(resolveServiceDiscoveryLimit('abc')).toBeNull();
    });
  });

  it.each(RESOLVE_SERVICE_DISCOVERY_PARAMS_SCENARIOS)(
    'resolveServiceDiscoveryParams $id',
    ({ params, expected }) => {
      expect(resolveServiceDiscoveryParams(params)).toEqual(expected);
    },
  );

  it.each(APPLY_SERVICE_DISCOVERY_TO_CATALOG_SCENARIOS)(
    'applyServiceDiscoveryToCatalog $id',
    ({ catalog, params, expectedIds }) => {
      expect(
        applyServiceDiscoveryToCatalog(catalog, params).map(
          (service) => service.id,
        ),
      ).toEqual(expectedIds);
    },
  );

  it('applyServiceDiscoveryToCatalog matches filter-then-rank chain for budget ceiling', () => {
    const catalog = [
      { id: 'hair-55', name: 'Haircut premium', price: 55 },
      { id: 'hair-35', name: 'Haircut basic', price: 35 },
      { id: 'hair-45', name: 'Haircut standard', price: 45 },
    ];

    expect(
      applyServiceDiscoveryToCatalog(catalog, {
        maxPrice: 50,
        serviceRank: 'lowest_price',
        serviceCategory: 'haircut',
        limit: 1,
      }).map((service) => service.id),
    ).toEqual(['hair-35']);
  });
});

/**
 * Discover post-LLM rescue pipeline order (discover-1.3):
 * 1. enrichBudgetFromPrompt — maxPrice extract/strip (gift card, packages)
 * 2. enrichServiceRankFromPrompt — serviceRank extract/strip (specialist misroutes)
 * 3. enrichAvailabilityWindowsFromPrompt — OR availabilityWindows[] (after catalog params)
 *
 * Call enrichServiceDiscoveryFromPrompt() for steps 1–2 only (dashboard list_services).
 * Call enrichDiscoveryParamsFromPrompt() for the full public/customer rescue chain.
 */
describe('ai-service-catalog-rank.util (discover-1.3)', () => {
  it.each(SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS)(
    'enrichServiceDiscoveryFromPrompt $id',
    ({ params = {}, prompt, expectedAfterServiceDiscovery }) => {
      expect(enrichServiceDiscoveryFromPrompt(params, prompt)).toEqual(
        expectedAfterServiceDiscovery,
      );
    },
  );

  it.each(SERVICE_DISCOVERY_ENRICHMENT_PIPELINE_SCENARIOS)(
    'enrichDiscoveryParamsFromPrompt $id',
    ({ params = {}, prompt, expectedAfterPipeline }) => {
      expect(enrichDiscoveryParamsFromPrompt(params, prompt)).toEqual(
        expectedAfterPipeline,
      );
    },
  );

  it('enrichDiscoveryParamsFromPrompt runs service discovery before OR windows', () => {
    const prompt =
      'I want a haircut tomorrow evening or Friday afternoon, I have $50';
    const params = {
      serviceCategory: 'haircut',
      date: 'tomorrow',
      timeOfDay: 'evening',
    };

    const fromPipeline = enrichDiscoveryParamsFromPrompt(params, prompt);
    const manualOrder = enrichAvailabilityWindowsFromPrompt(
      enrichServiceDiscoveryFromPrompt(params, prompt),
      prompt,
    );

    expect(fromPipeline).toEqual(manualOrder);
    expect(fromPipeline).toMatchObject({
      maxPrice: 50,
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
    expect(fromPipeline).not.toHaveProperty('date');
    expect(fromPipeline).not.toHaveProperty('timeOfDay');
  });
});
