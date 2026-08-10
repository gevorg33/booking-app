import {
  extractServiceNameFromPrompt,
  stripTrailingTimeWindowFromServiceName,
} from './ai-payments.util.js';
import {
  applyPromptMentionedServiceOverrideToParams,
  enrichPublicAssistantParamsFromPrompt,
} from './ai-booking-param-hints.util.js';
import {
  E2E260_ENRICH_CASES,
  E2E260_EXTRACT_CASES,
  E2E260_OVERRIDE_CASES,
  E2E260_STRIP_CASES,
} from './ai-e2e260-recommend-service-time-window.fixtures.js';

describe('e2e-bug.260: strip trailing time window from service names', () => {
  it.each(E2E260_EXTRACT_CASES)(
    '$id — extractServiceNameFromPrompt',
    ({ prompt, expectedServiceName }) => {
      expect(extractServiceNameFromPrompt(prompt)).toBe(expectedServiceName);
    },
  );

  it.each(E2E260_STRIP_CASES)(
    '$id — stripTrailingTimeWindowFromServiceName',
    ({ polluted, expected }) => {
      expect(stripTrailingTimeWindowFromServiceName(polluted)).toBe(expected);
    },
  );

  it.each(E2E260_OVERRIDE_CASES)(
    '$id — applyPromptMentionedServiceOverrideToParams',
    ({ prompt, params, expectedServiceName, expectedServiceCategory }) => {
      const next = applyPromptMentionedServiceOverrideToParams(prompt, {
        ...params,
      });
      expect(next.serviceName ?? null).toBe(expectedServiceName);
      if (expectedServiceCategory !== undefined) {
        expect(next.serviceCategory ?? null).toBe(expectedServiceCategory);
      }
    },
  );

  it.each(E2E260_ENRICH_CASES)(
    '$id — enrichPublicAssistantParamsFromPrompt',
    ({ prompt, expectedServiceCategory, forbidCategory }) => {
      const next = enrichPublicAssistantParamsFromPrompt(
        prompt,
        {},
        [],
        'recommend_specialists',
      );
      expect(next.serviceCategory ?? null).toBe(expectedServiceCategory);
      if (forbidCategory) {
        expect(String(next.serviceCategory ?? '')).not.toBe(forbidCategory);
        expect(String(next.serviceName ?? '')).not.toBe(forbidCategory);
      }
    },
  );
});
