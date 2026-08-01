import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  E2E93_PROVIDER_NAME_ENRICHMENT_SCENARIOS,
  E2E93_PROVIDER_NAME_EXTRACTION_SCENARIOS,
} from './ai-e2e93-provider-name-extraction.fixtures.js';
import { extractMaxPriceFromBudgetPrompt } from './ai-budget-service-discovery.util.js';
import {
  enrichExplainProviderAvailabilityParamsFromPrompt,
  extractProviderNameForAvailabilityPrompt,
  isExplainProviderAvailabilityPrompt,
  rescueExplainProviderAvailabilityIntent,
} from './ai-explain-provider-availability.util.js';
import {
  enrichExplainProviderSpecialtyParamsFromPrompt,
  isExplainProviderSpecialtyPrompt,
} from './ai-explain-provider-specialty.util.js';
import {
  extractProviderNameForProfilePrompt,
  isExplainProfessionalProfilePrompt,
} from './ai-explain-professional-profile.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';

describe('e2e-bug.93 provider-name extraction', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E93_PROVIDER_NAME_EXTRACTION_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues / enriches %s with named provider params', (_id, row) => {
    if ('keepAction' in row && row.keepAction) {
      expect(extractProviderNameForAvailabilityPrompt(row.prompt)).toBe(
        row.expectEmployeeName,
      );
      const enriched = enrichExplainProviderAvailabilityParamsFromPrompt(
        {},
        row.prompt,
      );
      expect(enriched.employeeName).toBe(row.expectEmployeeName);
      expect(
        rescueExplainProviderAvailabilityIntent(row.prompt, row.keepAction),
      ).toBeNull();
      const result = rescue.rescue({
        prompt: row.prompt,
        action: row.keepAction,
        params: {},
        surface: row.surface,
      });
      // e2e-bug.190 — stay on check_availability when browse phrasing wins.
      if (result?.action) {
        expect(result.action).not.toBe('check_providers_for_service');
        expect(result.action).not.toBe('explain_provider_availability');
      }
      return;
    }

    if (row.expectedAction === 'explain_provider_availability') {
      expect(isExplainProviderAvailabilityPrompt(row.prompt)).toBe(true);
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);
      expect(extractProviderNameForAvailabilityPrompt(row.prompt)).toBe(
        row.expectEmployeeName,
      );
    }
    if (row.expectedAction === 'explain_provider_specialty') {
      expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'explain_professional_profile') {
      expect(isExplainProfessionalProfilePrompt(row.prompt)).toBe(true);
      expect(isExplainGuestCheckoutFieldsPrompt(row.prompt)).toBe(false);
      expect(extractProviderNameForProfilePrompt(row.prompt)).toBe(
        row.expectProviderName,
      );
    }

    const result = rescue.rescue({
      prompt: row.prompt,
      action: row.misclassifiedAction,
      params: {},
      surface: row.surface,
    });
    expect(result?.action).toBe(row.expectedAction);

    if ('expectEmployeeName' in row && row.expectEmployeeName) {
      expect(result?.params?.employeeName).toBe(row.expectEmployeeName);
    }
    if ('expectProviderName' in row && row.expectProviderName) {
      expect(result?.params?.providerName).toBe(row.expectProviderName);
    }
    if ('expectAspect' in row && row.expectAspect) {
      expect(result?.params?.aspect).toBe(row.expectAspect);
    }
  });

  it.each(
    E2E93_PROVIDER_NAME_ENRICHMENT_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('enrichment edge %s', (_id, row) => {
    const enriched = enrichExplainProviderAvailabilityParamsFromPrompt(
      {},
      row.prompt,
    );
    expect(enriched.employeeName).toBe(row.expectEmployeeName);

    if ('forbidMaxPrice' in row) {
      expect(extractMaxPriceFromBudgetPrompt(row.prompt)).not.toBe(
        row.forbidMaxPrice,
      );
      const disc = enrichDiscoveryParamsFromPrompt({}, row.prompt);
      expect(disc.maxPrice).not.toBe(row.forbidMaxPrice);
    }
    if ('expectServiceName' in row && row.expectServiceName) {
      const disc = enrichDiscoveryParamsFromPrompt({}, row.prompt);
      const sharedService =
        enrichExplainProviderAvailabilityParamsFromPrompt({}, row.prompt)
          .serviceName ?? disc.serviceName;
      expect(String(sharedService)).toMatch(
        new RegExp(row.expectServiceName, 'i'),
      );
    }
    if ('forbidServiceNameIncludes' in row && row.forbidServiceNameIncludes) {
      const disc = enrichDiscoveryParamsFromPrompt({}, row.prompt);
      expect(String(disc.serviceName ?? '')).not.toMatch(
        new RegExp(row.forbidServiceNameIncludes, 'i'),
      );
    }
  });

  it('enriches specialty named_provider for specialize-in phrasing', () => {
    const enriched = enrichExplainProviderSpecialtyParamsFromPrompt(
      {},
      'what does Karo specialize in?',
    );
    expect(enriched.aspect).toBe('named_provider');
    expect(enriched.providerName).toBe('Karo');
    expect(enriched.specialtyTopic).toBeUndefined();
  });

  it('does not treat possessive named availability as check_providers_for_service', () => {
    expect(
      isCheckProvidersForServicePrompt(
        "What's Karo Mazmanyan's availability this week?",
      ),
    ).toBe(false);
  });
});
