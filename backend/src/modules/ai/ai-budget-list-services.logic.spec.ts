import { BUDGET_HANDLER_OUTCOME_SCENARIOS } from './ai-budget-service-discovery.fixtures.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composeDashboardListServicesBudgetResponse,
  composePublicListServicesBudgetResponse,
  formatPublicListServiceLine,
  resolveListServicesNavigateHint,
} from './ai-budget-list-services.logic.js';

describe('ai-budget-list-services.logic (budget-1.4 / 1.6)', () => {
  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
    'composePublicListServicesBudgetResponse $id',
    ({
      services,
      maxPrice,
      serviceCategory,
      expectedIds,
      expectNoMatchHint,
      expectedNavigateServiceId,
    }) => {
      const categoryMatched = serviceCategory
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
        header: 'Our services:',
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);

      if (expectNoMatchHint) {
        expect(result.summary).toContain('Nothing under $50');
        expect(result.summary).toContain('Closest options');
        expect(result.summary).toContain('Haircut standard');
        expect(result.summary).toContain('$55');
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
  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
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

      const result = composeDashboardListServicesBudgetResponse({
        matchedServices: categoryMatched.map((service) => ({
          ...service,
          currency: 'USD',
          bufferMinutes: 0,
        })),
        maxPrice,
        header: 'Services within budget:',
      });

      expect(result.success).toBe(true);
      expect(result.services.map((service) => service.id)).toEqual(expectedIds);
      expect(result.detailsServices.map((service) => service.id)).toEqual(
        expectedIds,
      );

      if (expectNoMatchHint) {
        expect(result.summary).toContain('Nothing under $50');
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
