import {
  E2E278_DETECTION_CASES,
  E2E278_NEGATIVE_CASES,
  E2E278_RESCUE_CASES,
} from './ai-e2e278-recommend-day-part.fixtures.js';
import {
  extractProviderRankServiceCategoryFromPrompt,
  isProviderRankDiscoveryPrompt,
  isSubjectiveServiceRankPrompt,
  rescueServiceRankDiscoveryIntent,
} from './ai-service-rank-discovery.util.js';
import { isRecommendSpecialistsPrompt } from './recommend-specialists.semantic.util.js';

describe('e2e-bug.278: recommend + day-part stays on recommend_specialists', () => {
  it.each(E2E278_DETECTION_CASES)(
    'detection $id',
    ({
      prompt,
      expectProviderRank,
      expectRecommendSpecialists,
      expectSubjective,
    }) => {
      expect(isProviderRankDiscoveryPrompt(prompt)).toBe(expectProviderRank);
      expect(isRecommendSpecialistsPrompt(prompt)).toBe(
        expectRecommendSpecialists,
      );
      expect(isSubjectiveServiceRankPrompt(prompt)).toBe(expectSubjective);
    },
  );

  it.each(E2E278_RESCUE_CASES)(
    'rescue $id',
    ({
      prompt,
      fromAction,
      expectedAction,
      rescueReason,
      serviceCategory,
    }) => {
      const rescued = rescueServiceRankDiscoveryIntent(
        prompt,
        fromAction,
        'public',
      );
      expect(rescued).toEqual({
        action: expectedAction,
        rescueReason,
        params: expect.objectContaining({ serviceCategory }),
      });
      expect(extractProviderRankServiceCategoryFromPrompt(prompt)).toBe(
        serviceCategory,
      );
    },
  );

  it.each(E2E278_NEGATIVE_CASES)(
    'negative $id',
    ({ prompt, expectProviderRank }) => {
      expect(isProviderRankDiscoveryPrompt(prompt)).toBe(expectProviderRank);
      expect(isRecommendSpecialistsPrompt(prompt)).toBe(false);
    },
  );
});
