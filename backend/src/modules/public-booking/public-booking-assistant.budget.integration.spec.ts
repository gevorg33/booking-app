import {
  BUDGET_HANDLER_OUTCOME_SCENARIOS,
  BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS,
} from '../ai/ai-budget-service-discovery.fixtures.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composePublicListServicesBudgetResponse,
  formatPublicListServiceLine,
} from '../ai/ai-budget-list-services.logic.js';
import { resolveServicesFromCatalogParams } from '../ai/ai-orchestration.helpers.js';
import {
  assertPublicListServicesBudgetWiring,
  assertPublicRecommendSpecialistsBudgetWiring,
} from '../ai/ai-discover-exit.wiring.js';
import { rescueBudgetServiceDiscoveryIntent } from '../ai/ai-budget-service-discovery.util.js';

describe('public booking assistant budget handler wiring (ai-cmd-customer-3.3)', () => {
  it('ships budget list_services handler helpers in PublicBookingAssistantService', () => {
    assertPublicListServicesBudgetWiring();
  });

  it('ships budget recommend_specialists filter in PublicBookingAssistantService', () => {
    assertPublicRecommendSpecialistsBudgetWiring();
  });
});

describe('public booking assistant budget handler pipeline (ai-cmd-customer-3.3 / budget-1.4)', () => {
  it.each(BUDGET_HANDLER_OUTCOME_SCENARIOS)(
    'composePublicListServicesBudgetResponse $id',
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
          expect(result.summary).toContain(names);
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
        expect(result.summary).toContain(
          formatPublicListServiceLine({
            ...service!,
            currency: 'USD',
          }),
        );
      }
    },
  );

  it('filters recommend_specialists service ids under maxPrice before provider lookup', () => {
    const services = [
      { id: 'hair-35', name: 'Cut basic', price: 35, durationMinutes: 30 },
      { id: 'hair-55', name: 'Cut premium', price: 55, durationMinutes: 45 },
    ];

    const withinBudget = applyBudgetFilterForRecommendSpecialists(services, 50);
    expect(withinBudget.services.map((service) => service.id)).toEqual([
      'hair-35',
    ]);
    expect(withinBudget.noMatchSummary).toBeNull();

    const noMatch = applyBudgetFilterForRecommendSpecialists(services, 30);
    expect(noMatch.services).toEqual([]);
    expect(noMatch.noMatchSummary).toContain('Nothing under $30');
  });
});

describe('public booking assistant budget rescue integration (ai-cmd-customer-3.3)', () => {
  it.each(
    BUDGET_SERVICE_DISCOVERY_PUBLIC_PROMPTS.filter(
      (scenario) =>
        scenario.expectedAction === 'list_services' &&
        !scenario.skipMaxPrice &&
        scenario.expectedParams?.maxPrice != null &&
        !scenario.publicCompoundSteps?.length &&
        !/\b(?:best|rated|top|specialist|stylist|therapist)\b/i.test(
          scenario.prompt,
        ),
    ),
  )('rescues public budget list_services for scenario $id', ({ prompt }) => {
    expect(
      rescueBudgetServiceDiscoveryIntent(prompt, 'unknown', 'public'),
    ).toEqual({
      action: 'list_services',
      rescueReason: 'budget_list_services',
    });
  });
});
