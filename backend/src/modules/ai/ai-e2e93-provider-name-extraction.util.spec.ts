import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { E2E93_PROVIDER_NAME_EXTRACTION_SCENARIOS } from './ai-e2e93-provider-name-extraction.fixtures.js';
import { isExplainProviderAvailabilityPrompt } from './ai-explain-provider-availability.util.js';
import {
  enrichExplainProviderSpecialtyParamsFromPrompt,
  isExplainProviderSpecialtyPrompt,
} from './ai-explain-provider-specialty.util.js';
import { isExplainProfessionalProfilePrompt } from './ai-explain-professional-profile.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';

describe('e2e-bug.93 provider-name extraction', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E93_PROVIDER_NAME_EXTRACTION_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues %s with named provider params', (_id, row) => {
    if (row.expectedAction === 'explain_provider_availability') {
      expect(isExplainProviderAvailabilityPrompt(row.prompt)).toBe(true);
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);
    }
    if (row.expectedAction === 'explain_provider_specialty') {
      expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'explain_professional_profile') {
      expect(isExplainProfessionalProfilePrompt(row.prompt)).toBe(true);
      expect(isExplainGuestCheckoutFieldsPrompt(row.prompt)).toBe(false);
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

  it('enriches specialty named_provider for specialize-in phrasing', () => {
    const enriched = enrichExplainProviderSpecialtyParamsFromPrompt(
      {},
      'what does Karo specialize in?',
    );
    expect(enriched.aspect).toBe('named_provider');
    expect(enriched.providerName).toBe('Karo');
    expect(enriched.specialtyTopic).toBeUndefined();
  });
});
