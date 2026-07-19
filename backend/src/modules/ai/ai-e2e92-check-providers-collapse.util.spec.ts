import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { E2E92_CHECK_PROVIDERS_COLLAPSE_SCENARIOS } from './ai-e2e92-check-providers-collapse.fixtures.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';
import { isRecommendSpecialistsPrompt } from './recommend-specialists.semantic.util.js';
import { isListProviderReviewsPrompt } from './ai-list-provider-reviews.util.js';
import { isConcreteTimedBookAppointmentPrompt } from './ai-intent-disambiguation.util.js';
import { isExplainProviderAvailabilityPrompt } from './ai-explain-provider-availability.util.js';
import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';

describe('e2e-bug.92 check_providers_for_service collapse', () => {
  const rescue = new AiIntentRescueService();

  it.each(
    E2E92_CHECK_PROVIDERS_COLLAPSE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues %s away from check_providers', (_id, row) => {
    expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(false);

    if (row.expectedAction === 'recommend_specialists') {
      expect(isRecommendSpecialistsPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'list_provider_reviews') {
      expect(isListProviderReviewsPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'book_appointment') {
      expect(isConcreteTimedBookAppointmentPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'explain_provider_availability') {
      expect(isExplainProviderAvailabilityPrompt(row.prompt)).toBe(true);
    }
    if (row.expectedAction === 'explain_any_provider_option') {
      expect(isExplainAnyProviderOptionPrompt(row.prompt)).toBe(true);
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
    if ('expectServiceName' in row && row.expectServiceName) {
      expect(String(result?.params?.serviceName ?? '').toLowerCase()).toContain(
        row.expectServiceName,
      );
    }
  });
});
