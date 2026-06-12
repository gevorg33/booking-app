import { BUDGET_HANDLER_OUTCOME_SCENARIOS } from './ai-budget-service-discovery.fixtures.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  buildBudgetRangeHighestInRangeNote,
  buildRankPremiumNoMatchInBudgetSummary,
  composeDashboardListServicesBudgetResponse,
  composePublicListServicesBudgetResponse,
  formatPublicListServiceLine,
  resolveDiscoverConstrainedService,
  resolveListServicesNavigateHint,
} from './ai-budget-list-services.logic.js';
import { DISCOVER_SECTION_A_MASSAGE_CATALOG } from './ai-service-catalog-rank.fixtures.js';
import { SERVICE_DISCOVERY_INTEGRATION_CATALOG } from './ai-service-discovery.fixtures.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { resolveServicesFromCatalogParams } from './ai-orchestration.helpers.js';

describe('ai-budget-list-services.logic (budget-1.4 / 1.6)', () => {
  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
    'composePublicListServicesBudgetResponse $id',
    ({
      id,
      services,
      maxPrice,
      minPrice,
      maxTotalPrice,
      serviceCount,
      serviceCategory,
      serviceName,
      preferShortDuration,
      minDurationMinutes,
      expectedIds,
      expectedComboIds,
      expectNoMatchHint,
      expectedNavigateServiceId,
    }) => {
      const categoryMatched = serviceName
        ? resolveServicesFromCatalogParams(services, { serviceName })
        : serviceCategory
          ? services.filter(
              (service) =>
                (service.serviceCategory ?? '').includes(serviceCategory) ||
                service.name.toLowerCase().includes(serviceCategory),
            )
          : services;

      const result = composePublicListServicesBudgetResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
        })),
        maxPrice,
        minPrice,
        preferShortDuration,
        minDurationMinutes,
        maxTotalPrice,
        serviceCount,
        header: 'Our services:',
      });

      expect(result.success).toBe(true);

      if (expectedComboIds) {
        for (const comboIds of expectedComboIds) {
          const names = comboIds
            .map((id) => services.find((service) => service.id === id)?.name)
            .join(' + ');
          const total = comboIds.reduce(
            (sum, id) =>
              sum + (services.find((service) => service.id === id)?.price ?? 0),
            0,
          );
          expect(result.summary).toContain(`${names} — $${total}`);
        }
        expect(result.services.map((service) => service.id).sort()).toEqual(
          [...new Set(expectedComboIds.flat())].sort(),
        );
        return;
      }

      expect(result.services.map((service) => service.id)).toEqual(expectedIds);

      if (expectNoMatchHint) {
        expect(result.summary).toContain(`Nothing under $${maxPrice}`);
        expect(result.summary).toContain('Closest options');
        if (id === 'budget-no-match-cheapest-hint') {
          expect(result.summary).toContain('Haircut standard');
          expect(result.summary).toContain('$55');
        }
        expect(result.navigate).toBeUndefined();
        return;
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
        expect(result.summary).toContain(formatPublicListServiceLine({
          ...service!,
          currency: 'USD',
        }));
      }
    },
  );

  it('sorts budget matches by ascending price in the summary', () => {
    const scenario = BUDGET_HANDLER_OUTCOME_SCENARIOS.find(
      (entry) => entry.id === 'budget-multiple-matches',
    );
    expect(scenario).toBeDefined();

    const result = composePublicListServicesBudgetResponse({
      matchedServices: scenario!.services.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: scenario!.maxPrice,
      header: 'Our hair services:',
    });

    const hair35Index = result.summary.indexOf('Haircut basic');
    const hair45Index = result.summary.indexOf('Haircut standard');
    expect(hair35Index).toBeGreaterThan(-1);
    expect(hair45Index).toBeGreaterThan(hair35Index);
    expect(result.summary).not.toContain('Haircut premium');
  });

  it('resolveListServicesNavigateHint pre-selects one service or opens services tab', () => {
    expect(resolveListServicesNavigateHint([{ id: 'massage-40' }])).toEqual({
      path: 'services',
      query: { serviceId: 'massage-40' },
    });
    expect(
      resolveListServicesNavigateHint([{ id: 'hair-35' }, { id: 'hair-45' }]),
    ).toEqual({
      path: 'services',
      query: {},
    });
    expect(resolveListServicesNavigateHint([])).toBeUndefined();
  });

  it('discover-value-or-premium-en appends highest-in-range note for budget browse', () => {
    const services = DISCOVER_SECTION_A_MASSAGE_CATALOG.filter(
      (service) => service.price <= 80,
    );
    const result = composePublicListServicesBudgetResponse({
      matchedServices: services.map((service) => ({
        ...service,
        currency: 'USD',
      })),
      maxPrice: 80,
      valueOrPremiumBrowse: true,
      header: 'Services within your budget:',
    });

    expect(result.services.map((service) => service.id)).toEqual([
      'massage-55',
      'massage-65',
    ]);
    expect(result.summary).toContain('Highest in your $80 range: Massage standard at $65');
    expect(buildBudgetRangeHighestInRangeNote(services, 80)).toBe(
      'Highest in your $80 range: Massage standard at $65.',
    );
  });

  it.each([
    {
      id: 'discover-flagship-book-en',
      prompt:
        'Book cheapest massage tomorrow or Thursday evening under $80, whichever is sooner',
      classifierParams: {
        serviceCategory: 'massage',
        bookingFirstAvailable: true,
      },
      category: 'massage',
      expectedServiceId: 'massage-55',
    },
    {
      id: 'discover-flagship-premium-en',
      prompt:
        'Best premium styling tomorrow or Saturday under $150, whichever is sooner',
      classifierParams: {
        serviceCategory: 'styling',
        bookingFirstAvailable: true,
      },
      category: 'styling',
      expectedServiceId: 'style-140',
    },
    {
      id: 'discover-budget-asap-en',
      prompt: 'Anything under $40 ASAP',
      classifierParams: { bookingFirstAvailable: true },
      category: null,
      expectedServiceId: 'manicure-25',
    },
    {
      id: 'discover-budget-weekend-en',
      prompt: 'Massage under $70 this Saturday afternoon',
      classifierParams: {
        serviceCategory: 'massage',
        weekdays: ['saturday'],
        timeOfDay: 'afternoon',
      },
      category: 'massage',
      expectedServiceId: 'massage-55',
    },
    {
      id: 'discover-premium-tomorrow-en',
      prompt: 'Book your most premium facial tomorrow nearest slot',
      classifierParams: {
        serviceCategory: 'facial',
        date: 'tomorrow',
        bookingFirstAvailable: true,
      },
      category: 'facial',
      expectedServiceId: 'facial-120',
    },
    {
      id: 'discover-cheapest-friday-en',
      prompt: 'Cheapest manicure Friday afternoon if available',
      classifierParams: {
        serviceCategory: 'manicure',
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
      },
      category: 'manicure',
      expectedServiceId: 'manicure-25',
    },
  ])(
    'resolveDiscoverConstrainedService $id',
    ({ prompt, classifierParams, category, expectedServiceId }) => {
      const enriched = enrichDiscoveryParamsFromPrompt(
        classifierParams,
        prompt,
      );
      const catalog = category
        ? SERVICE_DISCOVERY_INTEGRATION_CATALOG.filter(
            (service) => service.serviceCategory === category,
          )
        : SERVICE_DISCOVERY_INTEGRATION_CATALOG;
      const resolved = resolveDiscoverConstrainedService(catalog, enriched);
      expect(resolved.service?.id).toBe(expectedServiceId);
      expect(resolved.noMatchSummary).toBeNull();
    },
  );

  it('discover-no-premium-in-budget-en uses premium-specific no-match copy', () => {
    const catalog = [
      { id: 'hair-35', name: 'Haircut basic', price: 35, serviceCategory: 'haircut' },
      { id: 'hair-45', name: 'Haircut standard', price: 45, serviceCategory: 'haircut' },
      { id: 'hair-75', name: 'Haircut premium', price: 75, serviceCategory: 'haircut' },
    ];
    const summary = buildRankPremiumNoMatchInBudgetSummary(catalog, 30, 'haircut');
    expect(summary).toContain('No premium haircut under $30.');
    expect(summary).toContain('Closest options');
    expect(summary).toContain('Haircut basic');
    expect(summary).toContain('$35');
  });

  it('leaves catalog unchanged when maxPrice is absent', () => {
    const services = [
      { id: 'a', name: 'Premium', price: 80, durationMinutes: 60, currency: 'USD' },
      { id: 'b', name: 'Basic', price: 20, durationMinutes: 30, currency: 'USD' },
    ];

    const result = composePublicListServicesBudgetResponse({
      matchedServices: services,
      header: 'Our service types:',
    });

    expect(result.services.map((service) => service.id)).toEqual(['a', 'b']);
    expect(result.summary).toContain('Premium');
    expect(result.summary).toContain('Basic');
    expect(result.navigate).toEqual({ path: 'services', query: {} });
  });
});

describe('applyBudgetFilterForRecommendSpecialists (budget-1.5)', () => {
  it.each(
    BUDGET_HANDLER_OUTCOME_SCENARIOS.filter(
      (scenario) =>
        scenario.maxPrice != null &&
        scenario.expectedIds != null &&
        scenario.minPrice == null &&
        !scenario.serviceName &&
        !scenario.preferShortDuration &&
        scenario.minDurationMinutes == null &&
        !scenario.expectNoMatchHint,
    ),
  )(
    'filters serviceIds before recommendProviders $id',
    ({
      services,
      maxPrice,
      serviceCategory,
      expectedIds,
      expectNoMatchHint,
    }) => {
      const categoryMatched = serviceCategory
        ? services.filter(
            (service) =>
              (service.serviceCategory ?? '').includes(serviceCategory) ||
              service.name.toLowerCase().includes(serviceCategory),
          )
        : services;

      const result = applyBudgetFilterForRecommendSpecialists(
        categoryMatched,
        maxPrice,
      );

      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      if (expectNoMatchHint) {
        expect(result.noMatchSummary).toContain('Nothing under $50');
        expect(result.noMatchSummary).toContain('Closest options');
        return;
      }
      expect(result.noMatchSummary).toBeNull();
    },
  );

  it('passes through matched services when maxPrice is absent', () => {
    const services = [
      { id: 'a', name: 'Premium massage', price: 120 },
      { id: 'b', name: 'Basic massage', price: 60 },
    ];
    const result = applyBudgetFilterForRecommendSpecialists(services, undefined);
    expect(result.services).toEqual(services);
    expect(result.noMatchSummary).toBeNull();
  });
});

describe('ai-budget-dashboard-list-services.logic (budget-1.9)', () => {
  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
    'composeDashboardListServicesBudgetResponse $id',
    ({
      services,
      maxPrice,
      minPrice,
      maxTotalPrice,
      serviceCount,
      serviceCategory,
      serviceName,
      preferShortDuration,
      minDurationMinutes,
      expectedIds,
      expectedComboIds,
      expectNoMatchHint,
    }) => {
      const categoryMatched = serviceName
        ? resolveServicesFromCatalogParams(services, { serviceName })
        : serviceCategory
          ? services.filter(
              (service) =>
                (service.serviceCategory ?? '').includes(serviceCategory) ||
                service.name.toLowerCase().includes(serviceCategory),
            )
          : services;

      const result = composeDashboardListServicesBudgetResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
          bufferMinutes: 0,
        })),
        maxPrice,
        minPrice,
        preferShortDuration,
        minDurationMinutes,
        maxTotalPrice,
        serviceCount,
        header: 'Services within budget:',
      });

      expect(result.success).toBe(true);

      if (expectedComboIds) {
        for (const comboIds of expectedComboIds) {
          const names = comboIds
            .map((id) => services.find((service) => service.id === id)?.name)
            .join(' + ');
          expect(result.summary).toContain(names);
        }
        expect(result.services.map((service) => service.id).sort()).toEqual(
          [...new Set(expectedComboIds.flat())].sort(),
        );
        return;
      }

      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.detailsServices.map((service) => service.id)).toEqual(
        expectedIds,
      );

      if (expectNoMatchHint) {
        expect(result.summary).toContain(`Nothing under $${maxPrice}`);
        expect(result.summary).toContain('Closest options');
        expect(result.detailsServices).toEqual([]);
        return;
      }

      for (const id of expectedIds) {
        const service = services.find((entry) => entry.id === id);
        expect(result.summary).toContain(service!.name);
      }
    },
  );
});
